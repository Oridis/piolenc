import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { getSiteSettings } from '@/lib/settings';
import { calculateShippingFee } from '@/lib/pricing';
import { dispatchTransactionalEmail, generateEmailTemplate } from '@/lib/email';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const siteSettings = await getSiteSettings();
    const body = await request.json();

    const {
      customer,
      shippingAddress,
      billingAddress,
      items,
      accessibility,
      discountCode,
      requestedDeliverySlot,
      customerNotes,
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Le panier est vide' }, { status: 400 });
    }

    if (!customer?.email || !customer?.firstName || !customer?.lastName || !customer?.phone) {
      return NextResponse.json({ error: 'Les coordonnées de contact sont incomplètes' }, { status: 400 });
    }

    if (!shippingAddress?.street || !shippingAddress?.postalCode || !shippingAddress?.city || !shippingAddress?.country) {
      return NextResponse.json({ error: 'L\'adresse de livraison est incomplète' }, { status: 400 });
    }

    // Idempotence : le tunnel de commande envoie une clé stable par tentative de
    // validation. Un double clic, une actualisation ou un retour navigateur
    // renvoient donc la commande déjà enregistrée au lieu d'en créer une seconde
    // (et de réserver une deuxième fois le stock).
    const rawIdempotencyKey = typeof body.idempotencyKey === 'string' ? body.idempotencyKey.trim() : '';
    const idempotencyKey = /^[A-Za-z0-9_-]{8,64}$/.test(rawIdempotencyKey) ? rawIdempotencyKey : null;

    const orderResponse = (order: {
      orderNumber: string;
      secureToken: string;
      totalAmount: number;
      currency: string;
    }) => ({
      success: true,
      orderNumber: order.orderNumber,
      secureToken: order.secureToken,
      totalAmount: order.totalAmount,
      currency: order.currency,
      bankDetails: {
        beneficiary: siteSettings.bankBeneficiary,
        bankName: siteSettings.bankName,
        iban: siteSettings.bankIban,
        bic: siteSettings.bankBic,
        reference: order.orderNumber,
        deadlineDays: siteSettings.bankTransferDeadlineDays,
      },
    });

    if (idempotencyKey) {
      const existingOrder = await prisma.order.findUnique({ where: { idempotencyKey } });
      if (existingOrder) {
        return NextResponse.json({ ...orderResponse(existingOrder), alreadyCreated: true });
      }
    }

    // 1. Fetch live product data from database and recalculate server-side
    const productIds = items.map((i: any) => i.productId);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const dbProductMap = new Map(dbProducts.map((p) => [p.id, p]));

    let calculatedSubtotalHT = 0;
    let calculatedSubtotalTTC = 0;
    let calculatedVatTotal = 0;
    let totalItemsCount = 0;
    let totalWeightKg = 0;

    const orderItemsData: any[] = [];

    for (const item of items) {
      const dbProduct = dbProductMap.get(item.productId);
      if (!dbProduct) {
        return NextResponse.json({ error: `Produit introuvable : ${item.name || item.productId}` }, { status: 400 });
      }

      if (!dbProduct.isActive) {
        return NextResponse.json({ error: `Le produit ${dbProduct.name} n'est plus disponible` }, { status: 400 });
      }

      // Quantité: un entier strictement positif. Sans ce contrôle, une quantité
      // nulle, négative ou non numérique était silencieusement ramenée à 1 et
      // créait une commande non voulue.
      const rawQty = item.quantity;
      const requestedQty = typeof rawQty === 'number' ? rawQty : Number.parseInt(String(rawQty ?? ''), 10);
      if (!Number.isInteger(requestedQty) || requestedQty < 1 || requestedQty > 999) {
        return NextResponse.json(
          { error: `Quantité invalide pour ${dbProduct.name} (reçu : ${rawQty})` },
          { status: 400 }
        );
      }

      // Stock check
      const availableStock = dbProduct.stock - dbProduct.reservedStock;

      if (availableStock < requestedQty && !dbProduct.isPreorderAllowed) {
        return NextResponse.json(
          { error: `Quantité insuffisante en stock pour ${dbProduct.name} (disponible : ${availableStock})` },
          { status: 400 }
        );
      }

      const effectivePriceTTC =
        dbProduct.promoPrice && dbProduct.promoPrice > 0 ? dbProduct.promoPrice : dbProduct.priceTTC;
      const vatMultiplier = 1 + dbProduct.vatRate / 100;
      const effectivePriceHT = Number((effectivePriceTTC / vatMultiplier).toFixed(2));

      const lineTotalTTC = Number((effectivePriceTTC * requestedQty).toFixed(2));
      const lineTotalHT = Number((effectivePriceHT * requestedQty).toFixed(2));
      const lineVat = Number((lineTotalTTC - lineTotalHT).toFixed(2));

      calculatedSubtotalTTC += lineTotalTTC;
      calculatedSubtotalHT += lineTotalHT;
      calculatedVatTotal += lineVat;
      totalItemsCount += requestedQty;
      totalWeightKg += (dbProduct.weightKg || 900) * requestedQty;

      orderItemsData.push({
        productId: dbProduct.id,
        productName: dbProduct.name,
        productRef: dbProduct.reference,
        unitPriceHT: effectivePriceHT,
        unitPriceTTC: effectivePriceTTC,
        quantity: requestedQty,
        totalHT: lineTotalHT,
        totalTTC: lineTotalTTC,
        snapshot: JSON.stringify({
          species: dbProduct.species,
          woodType: dbProduct.woodType,
          logLength: dbProduct.logLength,
          humidityRate: dbProduct.humidityRate,
          calorificValue: dbProduct.calorificValue,
          packaging: dbProduct.packaging,
          dimensions: dbProduct.dimensions,
          weightKg: dbProduct.weightKg,
        }),
      });
    }

    // 2. Shipping calculation server-side
    const shippingResult = calculateShippingFee(
      {
        countryCode: shippingAddress.country,
        postalCode: shippingAddress.postalCode,
        itemsCount: totalItemsCount,
        totalWeightKg,
        // Le supplément « accès difficile » ne s'applique que si le client a
        // déclaré explicitement une contrainte (pente ou camion non accessible),
        // jamais parce que l'information d'accessibilité est absente.
        difficultAccess: accessibility?.steepSlope === true || accessibility?.heavyTruckAccessible === false,
      },
      calculatedSubtotalTTC,
      siteSettings.freeShippingThreshold
    );

    let calculatedDiscount = 0.0;
    if (discountCode) {
      const discount = await prisma.discountCode.findUnique({
        where: { code: discountCode.toUpperCase().trim() },
      });
      if (discount && discount.isActive && calculatedSubtotalTTC >= discount.minOrderAmount) {
        if (discount.discountPercent) {
          calculatedDiscount = Number(((calculatedSubtotalTTC * discount.discountPercent) / 100).toFixed(2));
        } else if (discount.discountAmount) {
          calculatedDiscount = Math.min(calculatedSubtotalTTC, discount.discountAmount);
        }
      }
    }

    const calculatedTotalAmount = Number(
      Math.max(0, calculatedSubtotalTTC + shippingResult.shippingFeeTTC - calculatedDiscount).toFixed(2)
    );

    // 3. Generate unique order number and unguessable secure token
    // Try up to 10 times to find a unique order number (handles concurrent requests)
    let attempts = 0;
    const maxAttempts = 10;
    let orderNumber: string | null = null;
    while (attempts < maxAttempts && orderNumber === null) {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const candidate = `AM-${new Date().getFullYear()}-${randomSuffix}`;
      // Check if order number already exists in the database
      const existing = await prisma.order.findUnique({
        where: { orderNumber: candidate },
      });
      if (!existing) {
        orderNumber = candidate;
      }
      attempts++;
    }
    // Fallback if all attempts collided (extremely unlikely)
    if (orderNumber === null) {
      const fallbackSuffix = Math.floor(100000 + Math.random() * 900000);
      orderNumber = `AM-${new Date().getFullYear()}-${fallbackSuffix}`;
    }

    const secureToken = `tok_${crypto.randomBytes(16).toString('hex')}`;

    // 4. Create immutable order snapshot
    const siteSnapshot = JSON.stringify({
      siteName: siteSettings.siteName,
      companyName: siteSettings.companyName,
      companyAddress: siteSettings.companyAddress,
      companyPhone: siteSettings.companyPhone,
      companyEmail: siteSettings.companyEmail,
      companySiret: siteSettings.companySiret,
      companyVatNumber: siteSettings.companyVatNumber,
      bankName: siteSettings.bankName,
      bankBeneficiary: siteSettings.bankBeneficiary,
      bankIban: siteSettings.bankIban,
      bankBic: siteSettings.bankBic,
      bankTransferDeadlineDays: siteSettings.bankTransferDeadlineDays,
      bankInstructions: siteSettings.bankInstructions,
    });

    const destinationCountry = shippingAddress.country.toUpperCase();
    const currency = destinationCountry === 'CH' ? 'CHF' : 'EUR';

    // 5. Database transaction to create order, reserve stock and create logistics/payment records.
    // Le délai est élargi (Neon est distant) : sans cela, deux commandes
    // simultanées dépassaient les 5 s par défaut et la seconde échouait en 500.
    let order;
    try {
      order = await prisma.$transaction(async (tx) => {
      // Reserve stock for products
      for (const item of orderItemsData) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity },
            reservedStock: { increment: item.quantity },
          },
        });
      }

      // Create Order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          secureToken,
          idempotencyKey,
          userId: user ? user.id : null,
          customerEmail: customer.email.toLowerCase().trim(),
          customerPhone: customer.phone.trim(),
          customerFirstName: customer.firstName.trim(),
          customerLastName: customer.lastName.trim(),
          siteSnapshot,
          shippingAddress: JSON.stringify(shippingAddress),
          billingAddress: JSON.stringify(billingAddress || shippingAddress),
          subtotalHT: calculatedSubtotalHT,
          subtotalTTC: calculatedSubtotalTTC,
          vatTotal: calculatedVatTotal,
          shippingFee: shippingResult.shippingFeeTTC,
          discountTotal: calculatedDiscount,
          totalAmount: calculatedTotalAmount,
          currency,
          paymentMethod: 'BANK_TRANSFER',
          paymentStatus: 'PENDING_TRANSFER',
          fulfillmentStatus: 'ORDER_CREATED',
          accessibilityInfo: JSON.stringify(accessibility || {}),
          requestedDeliverySlot: requestedDeliverySlot || null,
          customerNotes: customerNotes || null,
          items: {
            create: orderItemsData,
          },
          paymentRecords: {
            create: {
              expectedAmount: calculatedTotalAmount,
              receivedAmount: 0.0,
              notes: `En attente de virement bancaire libellé ${orderNumber}.`,
              isVerified: false,
            },
          },
          deliveryShipment: {
            create: {
              trackingNumber: `EXP-${orderNumber}`,
              currentStage: 'PREPARATION',
              estimatedDeliveryDate: new Date(Date.now() + shippingResult.estimatedLeadDays * 86400000),
              trackingEvents: {
                create: {
                  status: 'Commande enregistrée',
                  sourceType: 'WAREHOUSE_CONFIRMED',
                  location: 'Dépôt Central Piolenc Bois Direct',
                  description: 'Votre commande a bien été validée et attend le règlement bancaire.',
                },
              },
            },
          },
        },
        include: {
          items: true,
          deliveryShipment: true,
        },
      });

        return newOrder;
      }, { maxWait: 15000, timeout: 30000 });
    } catch (error: any) {
      // Course entre deux validations identiques : la contrainte d'unicité a
      // repéré la clé déjà utilisée, on renvoie la commande existante.
      if (error?.code === 'P2002' && idempotencyKey) {
        const existingOrder = await prisma.order.findUnique({ where: { idempotencyKey } });
        if (existingOrder) {
          return NextResponse.json({ ...orderResponse(existingOrder), alreadyCreated: true });
        }
      }
      throw error;
    }

    // 6. Asynchronously trigger transactional Email 1 (Client Confirmation) and Email 2 (Admin Alert)
    try {
      const email1Template = generateEmailTemplate(1, {
        siteSettings,
        order,
      });

      await dispatchTransactionalEmail({
        templateId: 1,
        recipientEmail: order.customerEmail,
        orderId: order.id,
        subject: email1Template.subject,
        htmlContent: email1Template.htmlContent,
        textContent: email1Template.textContent,
        idempotencyKey: `email-1-${order.orderNumber}`,
      });

      const email2Template = generateEmailTemplate(2, {
        siteSettings,
        order,
      });

      await dispatchTransactionalEmail({
        templateId: 2,
        recipientEmail: siteSettings.adminNotificationEmail || 'commandes@woodmachine.fr',
        orderId: order.id,
        subject: email2Template.subject,
        htmlContent: email2Template.htmlContent,
        textContent: email2Template.textContent,
        idempotencyKey: `email-2-${order.orderNumber}`,
      });
    } catch (emailErr) {
      console.error('Email dispatch non-blocking error:', emailErr);
    }

    return NextResponse.json(orderResponse(order));
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: error.message || 'Erreur lors de la validation de commande' }, { status: 500 });
  }
}
