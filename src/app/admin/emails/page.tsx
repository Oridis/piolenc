'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import {
  Mail,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCw,
  Send,
  Eye,
} from 'lucide-react';

export default function AdminEmailsPage() {
  const [emails, setEmails] = useState<any[]>([]);
  const [counts, setCounts] = useState({ total: 0, sent: 0, failed: 0, queued: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [previewEmail, setPreviewEmail] = useState<any | null>(null);

  const loadEmails = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (statusFilter) q.set('status', statusFilter);
      if (search) q.set('search', search);

      const res = await fetch(`/api/admin/emails?${q.toString()}`);
      const data = await res.json();
      if (data.emails) {
        setEmails(data.emails);
        setCounts(data.counts);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmails();
  }, [statusFilter, search]);

  const handleResend = async (emailId: string) => {
    setResendingId(emailId);
    try {
      const res = await fetch('/api/admin/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailId }),
      });
      const data = await res.json();
      if (res.ok) {
        alert('Email relancé avec succès !');
        loadEmails();
      } else {
        alert(data.error || 'Erreur lors de la relance');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setResendingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-purple-100 text-purple-800 rounded-lg">
                <Mail className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                File d'Attente &amp; Journal des Emails Transactionnels
              </h1>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Contrôlez chaque notification envoyée aux clients, examinez les erreurs et relancez en 1 clic.
            </p>
          </div>

          <button
            onClick={loadEmails}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Actualiser la file</span>
          </button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <span className="text-[11px] font-bold text-gray-500 uppercase">Total générés</span>
            <span className="text-xl font-black text-gray-900 block mt-1">{counts.total}</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <span className="text-[11px] font-bold text-emerald-600 uppercase">Délivrés / Envoyés</span>
            <span className="text-xl font-black text-emerald-700 block mt-1">{counts.sent}</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <span className="text-[11px] font-bold text-red-600 uppercase">Échecs</span>
            <span className="text-xl font-black text-red-700 block mt-1">{counts.failed}</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <span className="text-[11px] font-bold text-amber-600 uppercase">En attente</span>
            <span className="text-xl font-black text-amber-700 block mt-1">{counts.queued}</span>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Rechercher par email destinataire, sujet..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-forest-600 focus:outline-none"
            />
          </div>

          <div className="flex space-x-2 text-xs w-full sm:w-auto">
            {['', 'SENT', 'FAILED', 'QUEUED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl font-bold transition ${
                  statusFilter === st
                    ? 'bg-forest-800 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {st === '' ? 'Tous' : st === 'SENT' ? 'Envoyés' : st === 'FAILED' ? 'Échecs' : 'En attente'}
              </button>
            ))}
          </div>
        </div>

        {/* Emails Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-gray-500">Chargement des journaux emails...</div>
          ) : emails.length === 0 ? (
            <div className="p-12 text-center text-xs text-gray-500">Aucun journal trouvé.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px] border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-4">Modèle</th>
                    <th className="py-3 px-4">Destinataire</th>
                    <th className="py-3 px-4">Sujet</th>
                    <th className="py-3 px-4">Statut</th>
                    <th className="py-3 px-4">Date envoi</th>
                    <th className="py-3 px-4">Tentatives</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {emails.map((log) => {
                    const isSent = log.status === 'SENT';
                    const isFailed = log.status === 'FAILED';

                    return (
                      <tr key={log.id} className="hover:bg-gray-50 transition">
                        <td className="py-3.5 px-4 font-bold text-gray-800">
                          Email #{log.templateId}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-gray-900">
                          {log.recipientEmail}
                          {log.order && (
                            <span className="block text-[10px] text-gray-400">
                              Commande {log.order.orderNumber}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-gray-700 max-w-xs truncate font-medium">
                          {log.subject}
                        </td>
                        <td className="py-3.5 px-4">
                          {isSent ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">
                              ● Envoyé
                            </span>
                          ) : isFailed ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                              ● Échec
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              ● En attente
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-gray-500 text-[11px]">
                          {log.sentAt ? new Date(log.sentAt).toLocaleString('fr-FR') : 'Non envoyé'}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-gray-600">
                          {log.retryCount}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                          {log.contentHtml && (
                            <button
                              onClick={() => setPreviewEmail(log)}
                              className="px-2.5 py-1 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-semibold text-[11px]"
                              title="Prévisualiser le modèle"
                            >
                              Aperçu
                            </button>
                          )}
                          <button
                            onClick={() => handleResend(log.id)}
                            disabled={resendingId === log.id}
                            className="px-2.5 py-1 bg-purple-700 hover:bg-purple-800 text-white rounded-lg font-bold text-[11px] shadow-sm"
                            title="Relancer l'envoi"
                          >
                            {resendingId === log.id ? '...' : 'Relancer'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal for email preview */}
        {previewEmail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setPreviewEmail(null)} />
            <div className="relative bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-200 z-10 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start pb-3 border-b border-gray-100">
                <div>
                  <h3 className="text-sm font-black text-gray-900">{previewEmail.subject}</h3>
                  <p className="text-xs text-gray-500">Destinataire : {previewEmail.recipientEmail}</p>
                </div>
                <button onClick={() => setPreviewEmail(null)} className="text-gray-400 hover:text-gray-700">✕</button>
              </div>

              <div
                className="border border-gray-200 rounded-xl p-4 bg-gray-50 overflow-auto max-h-[60vh]"
                dangerouslySetInnerHTML={{ __html: previewEmail.contentHtml }}
              />
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
