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
  X,
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
        alert('Email relancé avec succès');
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
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-forest-100 text-forest-800 rounded-lg">
                <Mail className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold font-heading text-primaryText tracking-tight">
                File d'Attente &amp; Journal des Emails Transactionnels
              </h1>
            </div>
            <p className="text-xs text-secondaryText mt-1">
              Contrôlez chaque notification envoyée aux clients, examinez les erreurs et relancez en 1 clic.
            </p>
          </div>

          <button
            onClick={loadEmails}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white border border-subtleBorder rounded-lg text-xs font-semibold text-primaryText hover:bg-beige-50 transition shadow-subtle"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Actualiser la file</span>
          </button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-subtleBorder shadow-subtle">
            <span className="text-[11px] font-semibold text-secondaryText uppercase tracking-wider">Total générés</span>
            <span className="text-xl font-bold font-heading text-primaryText block mt-1">{counts.total}</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-subtleBorder shadow-subtle">
            <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">Délivrés / Envoyés</span>
            <span className="text-xl font-bold font-heading text-emerald-700 block mt-1">{counts.sent}</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-subtleBorder shadow-subtle">
            <span className="text-[11px] font-semibold text-red-800 uppercase tracking-wider">Échecs</span>
            <span className="text-xl font-bold font-heading text-red-700 block mt-1">{counts.failed}</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-subtleBorder shadow-subtle">
            <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">En attente</span>
            <span className="text-xl font-bold font-heading text-amber-700 block mt-1">{counts.queued}</span>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl border border-subtleBorder shadow-subtle flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-secondaryText absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Rechercher par email destinataire, sujet..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-subtleBorder rounded-lg text-xs text-primaryText focus:ring-2 focus:ring-forest-600 focus:outline-none"
            />
          </div>

          <div className="flex space-x-1.5 text-xs w-full sm:w-auto">
            {['', 'SENT', 'FAILED', 'QUEUED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  statusFilter === st
                    ? 'bg-forest-700 text-white shadow-subtle'
                    : 'bg-beige-100 text-secondaryText hover:text-primaryText hover:bg-beige-200'
                }`}
              >
                {st === '' ? 'Tous' : st === 'SENT' ? 'Envoyés' : st === 'FAILED' ? 'Échecs' : 'En attente'}
              </button>
            ))}
          </div>
        </div>

        {/* Emails Table */}
        <div className="bg-white rounded-xl border border-subtleBorder shadow-subtle overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-secondaryText">Chargement des journaux emails...</div>
          ) : emails.length === 0 ? (
            <div className="p-12 text-center text-xs text-secondaryText">Aucun journal trouvé.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-beige-50 text-secondaryText font-semibold uppercase tracking-wider text-[11px] border-b border-subtleBorder">
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
                <tbody className="divide-y divide-subtleBorder">
                  {emails.map((log) => {
                    const isSent = log.status === 'SENT';
                    const isFailed = log.status === 'FAILED';

                    return (
                      <tr key={log.id} className="hover:bg-beige-50/50 transition">
                        <td className="py-3.5 px-4 font-semibold text-primaryText">
                          Email #{log.templateId}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-medium text-primaryText">{log.recipientEmail}</span>
                          {log.order && (
                            <span className="block text-[10px] text-secondaryText">
                              Commande {log.order.orderNumber}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-secondaryText max-w-xs truncate">
                          {log.subject}
                        </td>
                        <td className="py-3.5 px-4">
                          {isSent ? (
                            <span className="badge-success">
                              Envoyé
                            </span>
                          ) : isFailed ? (
                            <span className="badge-destructive">
                              Échec
                            </span>
                          ) : (
                            <span className="badge-warning">
                              En attente
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-secondaryText text-[11px]">
                          {log.sentAt ? new Date(log.sentAt).toLocaleString('fr-FR') : 'Non envoyé'}
                          {log.providerMessageId && (
                            <a
                              href={`https://resend.com/emails/${log.providerMessageId}`}
                              target="_blank"
                              rel="noreferrer"
                              title={`Identifiant fournisseur Resend : ${log.providerMessageId}`}
                              className="block mt-0.5 font-mono text-[10px] text-forest-700 hover:underline"
                            >
                              Resend · {String(log.providerMessageId).slice(0, 8)}…
                            </a>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-secondaryText">
                          {log.retryCount}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                          {log.contentHtml && (
                            <button
                              onClick={() => setPreviewEmail(log)}
                              className="px-2.5 py-1 border border-subtleBorder hover:bg-beige-100 text-primaryText rounded-lg font-medium text-[11px] transition"
                              title="Prévisualiser le modèle"
                            >
                              Aperçu
                            </button>
                          )}
                          <button
                            onClick={() => handleResend(log.id)}
                            disabled={resendingId === log.id}
                            className="btn-primary py-1 px-2.5 text-[11px]"
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
            <div className="absolute inset-0 bg-forest-950/60 backdrop-blur-xs" onClick={() => setPreviewEmail(null)} />
            <div className="relative bg-white rounded-xl max-w-2xl w-full p-6 shadow-elevated border border-subtleBorder z-10 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start pb-3 border-b border-subtleBorder">
                <div>
                  <h3 className="text-sm font-bold font-heading text-primaryText">{previewEmail.subject}</h3>
                  <p className="text-xs text-secondaryText">Destinataire : {previewEmail.recipientEmail}</p>
                </div>
                <button
                  onClick={() => setPreviewEmail(null)}
                  className="p-1 rounded-lg text-secondaryText hover:text-primaryText hover:bg-beige-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div
                className="border border-subtleBorder rounded-lg p-4 bg-beige-50/50 overflow-auto max-h-[60vh]"
                dangerouslySetInnerHTML={{ __html: previewEmail.contentHtml }}
              />
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
