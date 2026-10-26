import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import AdminLayout from '@/components/AdminLayout';
import ProductImportTool from '@/components/ProductImportTool';
import { formatPrice } from '@/lib/pricing';
import { Package, Plus, AlertTriangle, CheckCircle, Edit, Upload } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-forest-100 text-forest-800 rounded-lg">
                <Package className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold font-heading text-primaryText tracking-tight">
                Catalogue des Produits &amp; Gestion des Stocks
              </h1>
            </div>
            <p className="text-xs text-secondaryText mt-1">
              Gérez les références de bois, les essences, le conditionnement et les stocks disponibles.
            </p>
          </div>
          <div className="p-2 bg-amber-50 text-amber-800 rounded-lg w-fit">
            <Upload className="w-5 h-5" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-subtleBorder shadow-subtle overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-beige-50 text-secondaryText font-semibold uppercase tracking-wider text-[11px] border-b border-subtleBorder">
                    <tr>
                      <th className="py-3 px-4">Produit</th>
                      <th className="py-3 px-4">Catégorie</th>
                      <th className="py-3 px-4">Essence &amp; Coupe</th>
                      <th className="py-3 px-4">Prix TTC</th>
                      <th className="py-3 px-4">Stock</th>
                      <th className="py-3 px-4">Disponibilité</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-subtleBorder">
                    {products.map((prod) => {
                      let parsedImages: string[] = [];
                      try {
                        parsedImages = JSON.parse(prod.images);
                      } catch {
                        parsedImages = [];
                      }

                      const isLowStock = prod.stock <= 30;

                      return (
                        <tr key={prod.id} className="hover:bg-beige-50/50 transition">
                          <td className="py-3.5 px-4 font-semibold text-primaryText flex items-center space-x-3">
                            <img
                              src={parsedImages[0] || undefined}
                              alt={prod.name}
                              className="w-12 h-12 object-cover rounded-lg border border-subtleBorder shrink-0"
                            />
                            <div className="min-w-0">
                              <span className="block truncate max-w-xs">{prod.name}</span>
                              <span className="text-[10px] text-secondaryText font-mono font-normal">
                                Réf: {prod.reference}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-secondaryText font-medium">
                            {prod.category?.name || 'Bois'}
                          </td>
                          <td className="py-3.5 px-4 text-primaryText">
                            <span>{prod.species}</span>
                            <span className="block text-[10px] text-secondaryText">{prod.logLength} • {prod.humidityRate}</span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-primaryText">
                            {prod.promoPrice ? (
                              <div>
                                <span className="text-wood-700">{formatPrice(prod.promoPrice)}</span>
                                <span className="block text-[10px] line-through text-secondaryText font-normal">
                                  {formatPrice(prod.priceTTC)}
                                </span>
                              </div>
                            ) : (
                              formatPrice(prod.priceTTC)
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`font-bold text-xs ${isLowStock ? 'text-wood-700' : 'text-primaryText'}`}>
                              {prod.stock} unités
                            </span>
                            {prod.reservedStock > 0 && (
                              <span className="block text-[10px] text-secondaryText">
                                ({prod.reservedStock} réservées)
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            {prod.isActive ? (
                              <span className="badge-success">
                                Actif
                              </span>
                            ) : (
                              <span className="badge-neutral">
                                Désactivé
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-subtleBorder shadow-subtle p-4">
            <h2 className="text-sm font-semibold text-primaryText tracking-tight flex items-center gap-2 mb-3">
              <Upload className="w-4 h-4" />
              Import de produits
            </h2>
            <p className="text-xs text-secondaryText mb-4">
              Récupère une fiche distante ou colle un payload JSON et importe les produits dans le catalogue.
            </p>
            <ProductImportTool />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-subtleBorder shadow-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-beige-50 text-secondaryText font-semibold uppercase tracking-wider text-[11px] border-b border-subtleBorder">
                <tr>
                  <th className="py-3 px-4">Produit</th>
                  <th className="py-3 px-4">Catégorie</th>
                  <th className="py-3 px-4">Essence &amp; Coupe</th>
                  <th className="py-3 px-4">Prix TTC</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4">Disponibilité</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtleBorder">
                {products.map((prod) => {
                  let parsedImages: string[] = [];
                  try {
                    parsedImages = JSON.parse(prod.images);
                  } catch {
                    parsedImages = [];
                  }

                  const isLowStock = prod.stock <= 30;

                  return (
                    <tr key={prod.id} className="hover:bg-beige-50/50 transition">
                      <td className="py-3.5 px-4 font-semibold text-primaryText flex items-center space-x-3">
                        <img
                          src={parsedImages[0] || undefined}
                          alt={prod.name}
                          className="w-12 h-12 object-cover rounded-lg border border-subtleBorder shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="block truncate max-w-xs">{prod.name}</span>
                          <span className="text-[10px] text-secondaryText font-mono font-normal">
                            Réf: {prod.reference}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-secondaryText font-medium">
                        {prod.category?.name || 'Bois'}
                      </td>
                      <td className="py-3.5 px-4 text-primaryText">
                        <span>{prod.species}</span>
                        <span className="block text-[10px] text-secondaryText">{prod.logLength} • {prod.humidityRate}</span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-primaryText">
                        {prod.promoPrice ? (
                          <div>
                            <span className="text-wood-700">{formatPrice(prod.promoPrice)}</span>
                            <span className="block text-[10px] line-through text-secondaryText font-normal">
                              {formatPrice(prod.priceTTC)}
                            </span>
                          </div>
                        ) : (
                          formatPrice(prod.priceTTC)
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`font-bold text-xs ${isLowStock ? 'text-wood-700' : 'text-primaryText'}`}>
                          {prod.stock} unités
                        </span>
                        {prod.reservedStock > 0 && (
                          <span className="block text-[10px] text-secondaryText">
                            ({prod.reservedStock} réservées)
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {prod.isActive ? (
                          <span className="badge-success">
                            Actif
                          </span>
                        ) : (
                          <span className="badge-neutral">
                            Désactivé
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
