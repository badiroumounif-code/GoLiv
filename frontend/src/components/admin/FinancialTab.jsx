import { motion } from "framer-motion";
import { Bike, Calendar, CheckCircle, Clock, DollarSign, Download, Percent, RefreshCw, TrendingUp } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export default function FinancialTab({
  financialStats,
  handleExport,
  financialDateFrom,
  setFinancialDateFrom,
  financialDateTo,
  setFinancialDateTo,
  loadFinancialData,
}) {
  return (
            <div className="space-y-6">
              {/* Financial Summary */}
              {financialStats && (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="font-heading text-lg md:text-xl font-semibold text-slate-900">
                      Résumé financier
                    </h3>
                    <Button
                      onClick={() => handleExport("finances")}
                      className="bg-sky-500 hover:bg-sky-600 text-white rounded-full"
                      data-testid="export-finances-btn"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Exporter CSV
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-2xl p-6 border border-slate-100"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-sky-600" />
                        </div>
                        <p className="text-sm text-slate-500">Chiffre d'affaires</p>
                      </div>
                      <p className="text-2xl font-bold text-slate-900">
                        {financialStats.totaux.chiffre_affaires.toLocaleString()} FCFA
                      </p>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-white rounded-2xl p-6 border border-slate-100"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                          <Bike className="w-5 h-5 text-amber-600" />
                        </div>
                        <p className="text-sm text-slate-500">Paiements livreurs</p>
                      </div>
                      <p className="text-2xl font-bold text-slate-900">
                        {financialStats.totaux.paiements_livreurs.toLocaleString()} FCFA
                      </p>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-white rounded-2xl p-6 border border-slate-100"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                          <Percent className="w-5 h-5 text-purple-600" />
                        </div>
                        <p className="text-sm text-slate-500">Commission</p>
                      </div>
                      <p className="text-2xl font-bold text-slate-900">
                        {financialStats.totaux.commission_plateforme.toLocaleString()} FCFA
                      </p>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="bg-white rounded-2xl p-6 border border-slate-100"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                          <TrendingUp className="w-5 h-5 text-green-600" />
                        </div>
                        <p className="text-sm text-slate-500">Marge nette</p>
                      </div>
                      <p className="text-2xl font-bold text-green-600">
                        {financialStats.totaux.marge_nette.toLocaleString()} FCFA
                      </p>
                    </motion.div>
                  </div>

                  {/* Date Filter */}
                  <div className="bg-white rounded-2xl border border-slate-100 p-6">
                    <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Filtrer par période
                    </h3>
                    <div className="flex flex-wrap gap-4 items-end">
                      <div>
                        <Label className="text-slate-600">Du</Label>
                        <Input
                          type="date"
                          value={financialDateFrom}
                          onChange={(e) => setFinancialDateFrom(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-600">Au</Label>
                        <Input
                          type="date"
                          value={financialDateTo}
                          onChange={(e) => setFinancialDateTo(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <Button onClick={loadFinancialData} className="bg-sky-500 hover:bg-sky-600">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Actualiser
                      </Button>
                    </div>
                  </div>

                  {/* Breakdown by Status */}
                  <div className="bg-white rounded-2xl border border-slate-100 p-6">
                    <h3 className="font-semibold text-slate-900 mb-4">Répartition par statut</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-green-50 rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="font-medium text-green-800">Livrées</span>
                        </div>
                        <p className="text-3xl font-bold text-green-700">{financialStats.par_statut.livrees.count}</p>
                        <p className="text-sm text-green-600">{financialStats.par_statut.livrees.montant.toLocaleString()} FCFA</p>
                      </div>
                      <div className="bg-amber-50 rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Clock className="w-5 h-5 text-amber-600" />
                          <span className="font-medium text-amber-800">En cours</span>
                        </div>
                        <p className="text-3xl font-bold text-amber-700">{financialStats.par_statut.en_cours.count}</p>
                        <p className="text-sm text-amber-600">{financialStats.par_statut.en_cours.montant.toLocaleString()} FCFA</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 mt-4">
                      Total: {financialStats.nombre_livraisons} livraisons avec tarification
                    </p>
                  </div>
                </>
              )}
            </div>
  );
}
