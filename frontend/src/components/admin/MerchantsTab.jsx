import { Check, ChevronLeft, ChevronRight, Download, Search, Trash2, X } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { formatShortDate, getStatusBadge, getStatusLabel } from "./adminUtils";

export default function MerchantsTab({
  handleExport,
  merchantSearchQuery,
  setMerchantSearchQuery,
  setMerchantPage,
  merchantStatusFilter,
  setMerchantStatusFilter,
  paginatedMerchants,
  setSelectedItem,
  setStatusType,
  setSelectedStatus,
  setStatusOpen,
  setDeleteType,
  setDeleteOpen,
  merchantTotalPages,
  merchantPage,
}) {
  return (
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <h2 className="font-semibold text-slate-900">Candidatures commerçants</h2>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        placeholder="Rechercher..."
                        value={merchantSearchQuery}
                        onChange={(e) => { setMerchantSearchQuery(e.target.value); setMerchantPage(1); }}
                        className="pl-10 rounded-xl h-9 w-48"
                      />
                    </div>
                    <Select value={merchantStatusFilter} onValueChange={(v) => { setMerchantStatusFilter(v); setMerchantPage(1); }}>
                      <SelectTrigger className="rounded-xl h-9 w-36">
                        <SelectValue placeholder="Statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        <SelectItem value="en_attente">En attente</SelectItem>
                        <SelectItem value="accepte">Accepté</SelectItem>
                        <SelectItem value="refuse">Refusé</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport("merchants")}
                      className="rounded-full"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      CSV
                    </Button>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full" data-testid="merchants-table">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Entreprise</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Contact</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Volume</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Statut</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedMerchants.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-4 py-8 text-center text-slate-500">
                          Aucun commerçant trouvé
                        </td>
                      </tr>
                    ) : (
                      paginatedMerchants.map((item, index) => (
                        <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50" data-testid={`merchant-row-${index}`}>
                          <td className="px-4 py-3 text-sm text-slate-600">{formatShortDate(item.created_at)}</td>
                          <td className="px-4 py-3 text-sm font-medium text-slate-900">{item.nom_entreprise}</td>
                          <td className="px-4 py-3">
                            <p className="text-sm text-slate-600">{item.nom_contact}</p>
                            <p className="text-xs text-slate-400">{item.email}</p>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">{item.type_produits}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{item.volume_mensuel}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(item.status)}`}>
                              {getStatusLabel(item.status)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              {item.status === "en_attente" && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedItem(item);
                                      setStatusType('merchant');
                                      setSelectedStatus('accepte');
                                      setStatusOpen(true);
                                    }}
                                    className="rounded-full h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                    title="Accepter"
                                  >
                                    <Check className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedItem(item);
                                      setStatusType('merchant');
                                      setSelectedStatus('refuse');
                                      setStatusOpen(true);
                                    }}
                                    className="rounded-full h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    title="Refuser"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { setSelectedItem(item); setDeleteType('merchant'); setDeleteOpen(true); }}
                                className="rounded-full h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {merchantTotalPages > 1 && (
                <div className="p-4 border-t border-slate-100 flex items-center justify-between">
                  <p className="text-sm text-slate-500">
                    Page {merchantPage} sur {merchantTotalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMerchantPage(p => Math.max(1, p - 1))}
                      disabled={merchantPage === 1}
                      className="rounded-full"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMerchantPage(p => Math.min(merchantTotalPages, p + 1))}
                      disabled={merchantPage === merchantTotalPages}
                      className="rounded-full"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
  );
}
