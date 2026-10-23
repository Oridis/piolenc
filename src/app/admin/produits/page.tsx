import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import AdminLayout from '@/components/AdminLayout';
import { formatPrice } from '@/lib/pricing';
import { Package, Plus, AlertTriangle, CheckCircle, Edit } from 'lucide-react';

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
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
                <Package className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                Catalogue des Produits &amp; Gestion des Stocks
              </h1>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Gérez les références de bois, les essences, le conditionnement et les stocks disponibles.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px] border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4">Produit</th>
                  <th className="py-3 px-4">Catégorie</th>
                  <th className="py-3 px-4">Essence &amp; Coupe</th>
                  <th className="py-3 px-4">Prix TTC</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4">Disponibilité</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((prod) => {
                  let parsedImages: string[] = [];
                  try {
                    parsedImages = JSON.parse(prod.images);
                  } catch {
                    parsedImages = [];
                  }

                  const isLowStock = prod.stock <= 30;

                  return (
                    <tr key={prod.id} className="hover:bg-gray-50 transition">
                      <td className="py-3.5 px-4 font-bold text-gray-900 flex items-center space-x-3">
                        <img
                          src={parsedImages[0] || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=300'}
                          alt={prod.name}
                          className="w-12 h-12 object-cover rounded-lg border border-gray-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="block truncate max-w-xs">{prod.name}</span>
                          <span className="text-[10px] text-gray-400 font-mono font-normal">
                            Réf: {prod.reference}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-gray-600 font-medium">
                        {prod.category?.name || 'Bois'}
                      </td>
                      <td className="py-3.5 px-4 text-gray-700">
                        <span>{prod.species}</span>
                        <span className="block text-[10px] text-gray-400">{prod.logLength} • {prod.humidityRate}</span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-forest-900">
                        {prod.promoPrice ? (
                          <div>
                            <span className="text-amber-700">{formatPrice(prod.promoPrice)}</span>
                            <span className="block text-[10px] line-through text-gray-400 font-normal">
                              {formatPrice(prod.priceTTC)}
                            </span>
                          </div>
                        ) : (
                          formatPrice(prod.priceTTC)
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`font-black text-xs ${isLowStock ? 'text-amber-600' : 'text-gray-900'}`}>
                          {prod.stock} unités
                        </span>
                        {prod.reservedStock > 0 && (
                          <span className="block text-[10px] text-gray-400">
                            ({prod.reservedStock} réservées)
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {prod.isActive ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">
                            Actif
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-800">
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
