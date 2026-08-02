import { BarChart3, Clock, Package, TrendingUp } from "lucide-react";
import { getStatusBadge, getStatusLabel, getUrgencyBadge } from "./adminUtils";

export default function AnalyticsTab({ analytics }) {
  return (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Deliveries by Status */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-sky-500" />
                  Livraisons par statut
                </h3>
                <div className="space-y-3">
                  {analytics?.par_statut && Object.entries(analytics.par_statut).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${getStatusBadge(status).split(' ')[0]}`}></span>
                        <span className="text-sm text-slate-600">{getStatusLabel(status)}</span>
                      </div>
                      <span className="font-semibold text-slate-900">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Deliveries by Urgency */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-500" />
                  Livraisons par urgence
                </h3>
                <div className="space-y-3">
                  {analytics?.par_urgence && Object.entries(analytics.par_urgence).map(([urgence, count]) => (
                    <div key={urgence} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${getUrgencyBadge(urgence).split(' ')[0]}`}></span>
                        <span className="text-sm text-slate-600 capitalize">{urgence}</span>
                      </div>
                      <span className="font-semibold text-slate-900">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Riders */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6 md:col-span-2">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Top livreurs
                </h3>
                {analytics?.top_livreurs?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="text-left py-2 text-sm font-medium text-slate-500">#</th>
                          <th className="text-left py-2 text-sm font-medium text-slate-500">Livreur</th>
                          <th className="text-right py-2 text-sm font-medium text-slate-500">Total livraisons</th>
                          <th className="text-right py-2 text-sm font-medium text-slate-500">En cours</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.top_livreurs.map((rider, index) => (
                          <tr key={rider.id} className="border-b border-slate-50">
                            <td className="py-3 text-sm text-slate-400">{index + 1}</td>
                            <td className="py-3 text-sm font-medium text-slate-900">{rider.prenom} {rider.nom}</td>
                            <td className="py-3 text-sm text-slate-600 text-right">{rider.total_livraisons || 0}</td>
                            <td className="py-3 text-sm text-slate-600 text-right">{rider.livraisons_en_cours || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm">Aucun livreur actif pour le moment</p>
                )}
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6 md:col-span-2">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-500" />
                  Activité des 7 derniers jours
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-sky-600">{analytics?.activite_recente?.nouvelles_demandes_7j || 0}</p>
                    <p className="text-sm text-slate-500">Nouvelles demandes</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">{analytics?.activite_recente?.livraisons_completees_7j || 0}</p>
                    <p className="text-sm text-slate-500">Livraisons complétées</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-purple-600">{analytics?.overview?.livreurs_actifs || 0}</p>
                    <p className="text-sm text-slate-500">Livreurs actifs</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-amber-600">{analytics?.overview?.commercants_actifs || 0}</p>
                    <p className="text-sm text-slate-500">Commerçants actifs</p>
                  </div>
                </div>
              </div>
            </div>
  );
}
