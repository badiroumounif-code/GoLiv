import {
  ArrowDown, ArrowUp, Ban, CheckCircle, ChevronLeft, ChevronRight, Download,
  Eye, Filter, MapPin, MoreVertical, Phone, RotateCcw, Search, Trash2, Truck,
  UserPlus, X
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Badge } from "../ui/badge";
import { formatShortDate, getUrgencyBadge, getStatusBadge, getStatusLabel } from "./adminUtils";

export default function DeliveryRequestsTab({
  hasActiveFilters,
  clearFilters,
  handleExport,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  urgencyFilter,
  setUrgencyFilter,
  riderFilter,
  setRiderFilter,
  acceptedRiders,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  zoneFilter,
  setZoneFilter,
  uniqueZones,
  filterSummary,
  toggleSort,
  sortField,
  sortDirection,
  paginatedDeliveries,
  setSelectedItem,
  setDetailsOpen,
  setAssignOpen,
  handleDeliveryStatusUpdate,
  setDeleteType,
  setDeleteOpen,
  totalPages,
  currentPage,
  setCurrentPage,
  filteredDeliveries,
}) {
  return (
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              {/* Filters Section */}
              <div className="p-4 border-b border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Filtres & Recherche
                  </h2>
                  <div className="flex items-center gap-2">
                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="text-slate-500 hover:text-slate-700"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Effacer les filtres
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport("delivery-requests")}
                      className="rounded-full"
                      data-testid="export-delivery-btn"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Exporter CSV
                    </Button>
                  </div>
                </div>

                {/* Search and filters row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Rechercher (nom, tél, zone)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 rounded-xl h-10"
                    />
                  </div>

                  {/* Status filter */}
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="rounded-xl h-10">
                      <SelectValue placeholder="Tous les statuts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="nouveau">Nouveau</SelectItem>
                      <SelectItem value="assigne">Assigné</SelectItem>
                      <SelectItem value="en_cours">En cours</SelectItem>
                      <SelectItem value="livre">Livré</SelectItem>
                      <SelectItem value="annule">Annulé</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Urgency filter */}
                  <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                    <SelectTrigger className="rounded-xl h-10">
                      <SelectValue placeholder="Toutes urgences" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes urgences</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="express">Express</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Rider filter */}
                  <Select value={riderFilter} onValueChange={setRiderFilter}>
                    <SelectTrigger className="rounded-xl h-10">
                      <SelectValue placeholder="Tous les livreurs" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les livreurs</SelectItem>
                      {acceptedRiders.map((rider) => (
                        <SelectItem key={rider.id} value={rider.id}>
                          {rider.prenom} {rider.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date range and zone */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Date from */}
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-slate-500 whitespace-nowrap">Du:</Label>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="rounded-xl h-10"
                    />
                  </div>

                  {/* Date to */}
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-slate-500 whitespace-nowrap">Au:</Label>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="rounded-xl h-10"
                    />
                  </div>

                  {/* Zone filter */}
                  <Select value={zoneFilter} onValueChange={setZoneFilter}>
                    <SelectTrigger className="rounded-xl h-10">
                      <SelectValue placeholder="Toutes les zones" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les zones</SelectItem>
                      {uniqueZones.map((zone) => (
                        <SelectItem key={zone} value={zone}>
                          {zone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filter summary badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-slate-500">Résultats:</span>
                  <Badge variant="secondary" className="bg-slate-100">
                    {filterSummary.total} total
                  </Badge>
                  <Badge variant="secondary" className="bg-sky-100 text-sky-700">
                    {filterSummary.nouveau} nouveau
                  </Badge>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                    {filterSummary.assigne} assigné
                  </Badge>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                    {filterSummary.en_cours} en cours
                  </Badge>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    {filterSummary.livre} livré
                  </Badge>
                  {filterSummary.annule > 0 && (
                    <Badge variant="secondary" className="bg-red-100 text-red-700">
                      {filterSummary.annule} annulé
                    </Badge>
                  )}
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full" data-testid="delivery-table">
                  <thead className="bg-slate-50">
                    <tr>
                      <th
                        className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase cursor-pointer hover:bg-slate-100"
                        onClick={() => toggleSort("created_at")}
                      >
                        <div className="flex items-center gap-1">
                          Date
                          {sortField === "created_at" && (
                            sortDirection === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          )}
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Client</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Trajet</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Urgence</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Livreur</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Statut</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedDeliveries.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-4 py-8 text-center text-slate-500">
                          {hasActiveFilters ? "Aucun résultat pour ces filtres" : "Aucune commande"}
                        </td>
                      </tr>
                    ) : (
                      paginatedDeliveries.map((item, index) => (
                        <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50" data-testid={`delivery-row-${index}`}>
                          <td className="px-4 py-3 text-sm text-slate-600">{formatShortDate(item.created_at)}</td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-slate-900">{item.nom}</p>
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {item.telephone}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm text-slate-600 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-green-500" />
                              {item.zone_enlevement?.split(' - ')[0]}
                            </p>
                            <p className="text-sm text-slate-600 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-red-500" />
                              {item.zone_livraison?.split(' - ')[0]}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyBadge(item.urgence)}`}>
                              {item.urgence}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {item.livreur_nom || <span className="text-slate-400">-</span>}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(item.status)}`}>
                              {getStatusLabel(item.status)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { setSelectedItem(item); setDetailsOpen(true); }}
                                className="rounded-full h-8 w-8 p-0"
                                title="Voir détails"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="rounded-full h-8 w-8 p-0">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  {item.status === "nouveau" && (
                                    <DropdownMenuItem onClick={() => { setSelectedItem(item); setAssignOpen(true); }}>
                                      <UserPlus className="w-4 h-4 mr-2 text-purple-600" />
                                      Assigner un livreur
                                    </DropdownMenuItem>
                                  )}

                                  {item.status === "assigne" && (
                                    <>
                                      <DropdownMenuItem onClick={() => handleDeliveryStatusUpdate(item.id, "en_cours")}>
                                        <Truck className="w-4 h-4 mr-2 text-blue-600" />
                                        Marquer en cours
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleDeliveryStatusUpdate(item.id, "nouveau")}>
                                        <RotateCcw className="w-4 h-4 mr-2 text-slate-600" />
                                        Retirer l&apos;assignation
                                      </DropdownMenuItem>
                                    </>
                                  )}

                                  {item.status === "en_cours" && (
                                    <>
                                      <DropdownMenuItem onClick={() => handleDeliveryStatusUpdate(item.id, "livre")}>
                                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                        Marquer livré
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleDeliveryStatusUpdate(item.id, "assigne")}>
                                        <RotateCcw className="w-4 h-4 mr-2 text-slate-600" />
                                        Revenir à assigné
                                      </DropdownMenuItem>
                                    </>
                                  )}

                                  {item.status === "livre" && (
                                    <DropdownMenuItem onClick={() => handleDeliveryStatusUpdate(item.id, "en_cours")}>
                                      <RotateCcw className="w-4 h-4 mr-2 text-slate-600" />
                                      Revenir à en cours
                                    </DropdownMenuItem>
                                  )}

                                  {item.status === "annule" && (
                                    <DropdownMenuItem onClick={() => handleDeliveryStatusUpdate(item.id, "nouveau")}>
                                      <RotateCcw className="w-4 h-4 mr-2 text-slate-600" />
                                      Réactiver la commande
                                    </DropdownMenuItem>
                                  )}

                                  {item.status !== "annule" && item.status !== "livre" && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => handleDeliveryStatusUpdate(item.id, "annule")}
                                        className="text-amber-600"
                                      >
                                        <Ban className="w-4 h-4 mr-2" />
                                        Annuler la commande
                                      </DropdownMenuItem>
                                    </>
                                  )}

                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => { setSelectedItem(item); setDeleteType('delivery'); setDeleteOpen(true); }}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Supprimer
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-slate-100 flex items-center justify-between">
                  <p className="text-sm text-slate-500">
                    Page {currentPage} sur {totalPages} ({filteredDeliveries.length} résultats)
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="rounded-full"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className={`rounded-full w-8 h-8 p-0 ${currentPage === pageNum ? 'bg-sky-500' : ''}`}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
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
