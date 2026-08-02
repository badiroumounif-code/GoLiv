import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Lock, LogOut, Package, MessageSquare, Store, Bike, Mail,
  RefreshCw, Star, CheckCircle, BarChart3, Settings, DollarSign
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { toast } from "sonner";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { getStatusLabel } from "../components/admin/adminUtils";

import DeliveryRequestsTab from "../components/admin/DeliveryRequestsTab";
import RidersTab from "../components/admin/RidersTab";
import MerchantsTab from "../components/admin/MerchantsTab";
import AnalyticsTab from "../components/admin/AnalyticsTab";
import FeedbackTab from "../components/admin/FeedbackTab";
import ContactsTab from "../components/admin/ContactsTab";
import SettingsTab from "../components/admin/SettingsTab";
import FinancialTab from "../components/admin/FinancialTab";
import DeliveryDetailsDialog from "../components/admin/DeliveryDetailsDialog";
import AssignRiderDialog from "../components/admin/AssignRiderDialog";
import StatusUpdateDialog from "../components/admin/StatusUpdateDialog";
import DeleteConfirmDialog from "../components/admin/DeleteConfirmDialog";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Create axios instance with auth header
const getAuthHeaders = () => {
  const token = localStorage.getItem("plb_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Items per page
const ITEMS_PER_PAGE = 10;

export default function Admin() {
  const navigate = useNavigate();
  const { user, isAuthenticated: jwtAuthenticated, logout: jwtLogout } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState("delivery");

  const [deliveryRequests, setDeliveryRequests] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [riders, setRiders] = useState([]);
  const [contacts, setContacts] = useState([]);

  const [selectedItem, setSelectedItem] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteType, setDeleteType] = useState(null);
  const [deliveryStatusOpen, setDeliveryStatusOpen] = useState(false);

  // Filter states for deliveries
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [zoneFilter, setZoneFilter] = useState("all");
  const [riderFilter, setRiderFilter] = useState("all");
  const [sortField, setSortField] = useState("created_at");
  const [sortDirection, setSortDirection] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);

  // Filter states for riders
  const [riderSearchQuery, setRiderSearchQuery] = useState("");
  const [riderStatusFilter, setRiderStatusFilter] = useState("all");
  const [riderPage, setRiderPage] = useState(1);

  // Filter states for merchants
  const [merchantSearchQuery, setMerchantSearchQuery] = useState("");
  const [merchantStatusFilter, setMerchantStatusFilter] = useState("all");
  const [merchantPage, setMerchantPage] = useState(1);

  const [statusType, setStatusType] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [statusReason, setStatusReason] = useState("");
  const [selectedRiderId, setSelectedRiderId] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Settings & Financial states
  const [zones, setZones] = useState([]);
  const [platformSettings, setPlatformSettings] = useState(null);
  const [financialStats, setFinancialStats] = useState(null);
  const [editingZone, setEditingZone] = useState(null);
  const [newZone, setNewZone] = useState({ nom: "", prix_base: "", paiement_livreur: "" });
  const [showNewZoneForm, setShowNewZoneForm] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [financialDateFrom, setFinancialDateFrom] = useState("");
  const [financialDateTo, setFinancialDateTo] = useState("");

  const storedToken = localStorage.getItem("plb_token");

  // Check if logged in via JWT as admin
  useEffect(() => {
    if (jwtAuthenticated && user?.role === "admin") {
      setIsAuthenticated(true);
    } else if (storedToken) {
      // Verify token is still valid
      setIsAuthenticated(true);
    }
  }, [jwtAuthenticated, user, storedToken]);

  useEffect(() => {
    if (isAuthenticated) {
      loadAllData();
    }
  }, [isAuthenticated]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, urgencyFilter, dateFrom, dateTo, zoneFilter, riderFilter]);

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword("");
    // Also logout from JWT if logged in
    if (jwtAuthenticated) {
      jwtLogout();
    }
    navigate("/");
    toast.info("Déconnexion réussie");
  };

  const loadAllData = async () => {
    setLoading(true);
    const headers = getAuthHeaders();
    try {
      const [statsRes, analyticsRes, deliveryRes, feedbackRes, merchantsRes, ridersRes, contactsRes, zonesRes, settingsRes, financialRes] = await Promise.all([
        axios.get(`${API}/admin/stats`, { headers }),
        axios.get(`${API}/admin/analytics`, { headers }),
        axios.get(`${API}/admin/delivery-requests`, { headers }),
        axios.get(`${API}/admin/feedback`, { headers }),
        axios.get(`${API}/admin/merchants`, { headers }),
        axios.get(`${API}/admin/riders`, { headers }),
        axios.get(`${API}/admin/contacts`, { headers }),
        axios.get(`${API}/admin/zones`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API}/admin/settings`, { headers }).catch(() => ({ data: null })),
        axios.get(`${API}/admin/financial`, { headers }).catch(() => ({ data: null }))
      ]);

      setStats(statsRes.data);
      setAnalytics(analyticsRes.data);
      setDeliveryRequests(deliveryRes.data);
      setFeedback(feedbackRes.data);
      setMerchants(merchantsRes.data);
      setRiders(ridersRes.data);
      setContacts(contactsRes.data);
      setZones(zonesRes.data || []);
      setPlatformSettings(settingsRes.data);
      setFinancialStats(financialRes.data);
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        handleLogout();
        toast.error("Session expirée ou accès non autorisé");
      } else {
        toast.error("Erreur lors du chargement des données");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type) => {
    const headers = getAuthHeaders();
    try {
      const response = await axios.get(`${API}/admin/export/${type}`, {
        headers,
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Export téléchargé");
    } catch (error) {
      toast.error("Erreur lors de l'export");
    }
  };

  // Zone management functions
  const handleSaveZone = async (zone) => {
    const headers = getAuthHeaders();
    setSettingsLoading(true);
    try {
      await axios.patch(`${API}/admin/zones/${zone.id}`, {
        nom: zone.nom,
        prix_base: parseInt(zone.prix_base),
        paiement_livreur: parseInt(zone.paiement_livreur),
        is_active: zone.is_active
      }, { headers });
      toast.success("Zone mise à jour");
      setEditingZone(null);
      loadAllData();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleCreateZone = async () => {
    if (!newZone.nom || !newZone.prix_base || !newZone.paiement_livreur) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    const headers = getAuthHeaders();
    setSettingsLoading(true);
    try {
      await axios.post(`${API}/admin/zones`, {
        nom: newZone.nom,
        prix_base: parseInt(newZone.prix_base),
        paiement_livreur: parseInt(newZone.paiement_livreur),
        is_active: true
      }, { headers });
      toast.success("Zone créée");
      setNewZone({ nom: "", prix_base: "", paiement_livreur: "" });
      setShowNewZoneForm(false);
      loadAllData();
    } catch (error) {
      toast.error("Erreur lors de la création");
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleDeleteZone = async (zoneId) => {
    const headers = getAuthHeaders();
    try {
      await axios.delete(`${API}/admin/zones/${zoneId}`, { headers });
      toast.success("Zone supprimée");
      loadAllData();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleSaveSettings = async () => {
    const headers = getAuthHeaders();
    setSettingsLoading(true);
    try {
      const params = new URLSearchParams({
        poids_seuil: platformSettings.poids_seuil,
        poids_supplement: platformSettings.poids_supplement,
        commission_type: platformSettings.commission_type,
        commission_value: platformSettings.commission_value
      });
      await axios.put(`${API}/admin/settings?${params.toString()}`, {}, { headers });
      toast.success("Paramètres sauvegardés");
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSettingsLoading(false);
    }
  };

  const loadFinancialData = async () => {
    const headers = getAuthHeaders();
    try {
      let url = `${API}/admin/financial`;
      const params = [];
      if (financialDateFrom) params.push(`date_from=${financialDateFrom}`);
      if (financialDateTo) params.push(`date_to=${financialDateTo}`);
      if (params.length) url += `?${params.join('&')}`;
      const res = await axios.get(url, { headers });
      setFinancialStats(res.data);
    } catch (error) {
      toast.error("Erreur lors du chargement des données financières");
    }
  };

  // Extract unique zones from deliveries
  const uniqueZones = useMemo(() => {
    const zones = new Set();
    deliveryRequests.forEach(d => {
      if (d.zone_enlevement) zones.add(d.zone_enlevement);
      if (d.zone_livraison) zones.add(d.zone_livraison);
    });
    return Array.from(zones).sort();
  }, [deliveryRequests]);

  // Filtered and sorted deliveries
  const filteredDeliveries = useMemo(() => {
    let filtered = [...deliveryRequests];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(d =>
        d.nom?.toLowerCase().includes(query) ||
        d.telephone?.includes(query) ||
        d.zone_enlevement?.toLowerCase().includes(query) ||
        d.zone_livraison?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(d => d.status === statusFilter);
    }

    // Urgency filter
    if (urgencyFilter !== "all") {
      filtered = filtered.filter(d => d.urgence === urgencyFilter);
    }

    // Zone filter
    if (zoneFilter !== "all") {
      filtered = filtered.filter(d =>
        d.zone_enlevement === zoneFilter || d.zone_livraison === zoneFilter
      );
    }

    // Rider filter
    if (riderFilter !== "all") {
      filtered = filtered.filter(d => d.livreur_id === riderFilter);
    }

    // Date filters
    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      filtered = filtered.filter(d => new Date(d.created_at) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      filtered = filtered.filter(d => new Date(d.created_at) <= to);
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === "created_at" || sortField === "assigned_at" || sortField === "completed_at") {
        aVal = new Date(aVal || 0).getTime();
        bVal = new Date(bVal || 0).getTime();
      }

      if (sortDirection === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [deliveryRequests, searchQuery, statusFilter, urgencyFilter, zoneFilter, riderFilter, dateFrom, dateTo, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredDeliveries.length / ITEMS_PER_PAGE);
  const paginatedDeliveries = filteredDeliveries.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Filtered riders
  const filteredRiders = useMemo(() => {
    let filtered = [...riders];

    if (riderSearchQuery) {
      const query = riderSearchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.nom?.toLowerCase().includes(query) ||
        r.prenom?.toLowerCase().includes(query) ||
        r.telephone?.includes(query) ||
        r.email?.toLowerCase().includes(query)
      );
    }

    if (riderStatusFilter !== "all") {
      filtered = filtered.filter(r => r.status === riderStatusFilter);
    }

    return filtered;
  }, [riders, riderSearchQuery, riderStatusFilter]);

  const riderTotalPages = Math.ceil(filteredRiders.length / ITEMS_PER_PAGE);
  const paginatedRiders = filteredRiders.slice(
    (riderPage - 1) * ITEMS_PER_PAGE,
    riderPage * ITEMS_PER_PAGE
  );

  // Filtered merchants
  const filteredMerchants = useMemo(() => {
    let filtered = [...merchants];

    if (merchantSearchQuery) {
      const query = merchantSearchQuery.toLowerCase();
      filtered = filtered.filter(m =>
        m.nom_entreprise?.toLowerCase().includes(query) ||
        m.nom_contact?.toLowerCase().includes(query) ||
        m.telephone?.includes(query) ||
        m.email?.toLowerCase().includes(query)
      );
    }

    if (merchantStatusFilter !== "all") {
      filtered = filtered.filter(m => m.status === merchantStatusFilter);
    }

    return filtered;
  }, [merchants, merchantSearchQuery, merchantStatusFilter]);

  const merchantTotalPages = Math.ceil(filteredMerchants.length / ITEMS_PER_PAGE);
  const paginatedMerchants = filteredMerchants.slice(
    (merchantPage - 1) * ITEMS_PER_PAGE,
    merchantPage * ITEMS_PER_PAGE
  );

  // Filter summary for deliveries
  const filterSummary = useMemo(() => {
    const summary = {
      total: filteredDeliveries.length,
      nouveau: filteredDeliveries.filter(d => d.status === "nouveau").length,
      assigne: filteredDeliveries.filter(d => d.status === "assigne").length,
      en_cours: filteredDeliveries.filter(d => d.status === "en_cours").length,
      livre: filteredDeliveries.filter(d => d.status === "livre").length,
      annule: filteredDeliveries.filter(d => d.status === "annule").length
    };
    return summary;
  }, [filteredDeliveries]);

  // Handle status update for merchants/riders
  const handleStatusUpdate = async () => {
    if (!selectedStatus) {
      toast.error("Veuillez sélectionner un statut");
      return;
    }

    setActionLoading(true);
    const headers = getAuthHeaders();

    try {
      const endpoint = statusType === 'merchant'
        ? `${API}/admin/merchants/${selectedItem.id}/status`
        : `${API}/admin/riders/${selectedItem.id}/status`;

      await axios.patch(endpoint, {
        status: selectedStatus,
        reason: statusReason || null
      }, { headers });

      toast.success(`Statut mis à jour et email envoyé !`);
      setStatusOpen(false);
      setSelectedStatus("");
      setStatusReason("");
      loadAllData();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle delivery assignment
  const handleAssignRider = async () => {
    if (!selectedRiderId) {
      toast.error("Veuillez sélectionner un livreur");
      return;
    }

    setActionLoading(true);
    const headers = getAuthHeaders();

    try {
      await axios.patch(
        `${API}/admin/delivery-requests/${selectedItem.id}/assign`,
        { livreur_id: selectedRiderId },
        { headers }
      );

      toast.success("Livraison assignée avec succès !");
      setAssignOpen(false);
      setSelectedRiderId("");
      loadAllData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de l'assignation");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle delivery status update
  const handleDeliveryStatusUpdate = async (deliveryId, newStatus) => {
    const headers = getAuthHeaders();

    try {
      await axios.patch(
        `${API}/admin/delivery-requests/${deliveryId}/status`,
        { status: newStatus },
        { headers }
      );

      toast.success(`Statut mis à jour: ${getStatusLabel(newStatus)}`);
      loadAllData();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  // Handle delete
  const handleDelete = async () => {
    setActionLoading(true);
    const headers = getAuthHeaders();

    try {
      let endpoint = '';
      if (deleteType === 'merchant') {
        endpoint = `${API}/admin/merchants/${selectedItem.id}`;
      } else if (deleteType === 'rider') {
        endpoint = `${API}/admin/riders/${selectedItem.id}`;
      } else if (deleteType === 'delivery') {
        endpoint = `${API}/admin/delivery-requests/${selectedItem.id}`;
      }

      await axios.delete(endpoint, { headers });

      toast.success("Suppression effectuée");
      setDeleteOpen(false);
      setSelectedItem(null);
      loadAllData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de la suppression");
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle sort
  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setUrgencyFilter("all");
    setDateFrom("");
    setDateTo("");
    setZoneFilter("all");
    setRiderFilter("all");
    setCurrentPage(1);
  };

  const acceptedRiders = riders.filter(r => r.status === 'accepte');
  const hasActiveFilters = searchQuery || statusFilter !== "all" || urgencyFilter !== "all" || dateFrom || dateTo || zoneFilter !== "all" || riderFilter !== "all";

  // Redirect to login page if not authenticated as admin
  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center" data-testid="admin-login-page">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md mx-auto px-4"
        >
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-soft">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-sky-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-sky-500" />
              </div>
              <h1 className="font-heading text-2xl font-bold text-slate-900">
                Administration
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                Connectez-vous avec votre compte administrateur
              </p>
            </div>

            <Button
              onClick={() => navigate("/connexion")}
              className="w-full bg-sky-500 hover:bg-sky-600 text-white rounded-full h-12"
              data-testid="admin-goto-login-btn"
            >
              Se connecter
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="admin-dashboard">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-16 z-40">
        <div className="container-custom py-4 md:py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="font-heading text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                Tableau de bord
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">Gestion GoLiv</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={loadAllData}
                disabled={loading}
                className="rounded-full"
                data-testid="refresh-btn"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Actualiser
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="rounded-full text-red-500 hover:text-red-600 hover:bg-red-50"
                data-testid="logout-btn"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="container-custom py-6 md:py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5 mb-6 md:mb-8">
          <div className="bg-white rounded-2xl p-4 border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <Package className="w-5 h-5 text-sky-500" />
              {analytics && (
                <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  +{analytics.activite_recente?.nouvelles_demandes_7j || 0} / 7j
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats?.demandes_livraison || 0}</p>
            <p className="text-sm text-slate-500">Commandes</p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{analytics?.overview?.livraisons_completees || 0}</p>
            <p className="text-sm text-slate-500">Livrées</p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <Bike className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {analytics?.overview?.livreurs_actifs || 0}
              <span className="text-sm font-normal text-slate-400">/{stats?.livreurs || 0}</span>
            </p>
            <p className="text-sm text-slate-500">Livreurs actifs</p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <Star className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{analytics?.overview?.note_moyenne || 0}/5</p>
            <p className="text-sm text-slate-500">Note moyenne</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-white border border-slate-100 rounded-full p-1 mb-6 flex-wrap">
            <TabsTrigger value="delivery" className="rounded-full" data-testid="tab-delivery">
              <Package className="w-4 h-4 mr-2" />
              Commandes ({deliveryRequests.length})
            </TabsTrigger>
            <TabsTrigger value="riders" className="rounded-full" data-testid="tab-riders">
              <Bike className="w-4 h-4 mr-2" />
              Livreurs ({riders.length})
            </TabsTrigger>
            <TabsTrigger value="merchants" className="rounded-full" data-testid="tab-merchants">
              <Store className="w-4 h-4 mr-2" />
              Commerçants ({merchants.length})
            </TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-full" data-testid="tab-analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              Statistiques
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-full" data-testid="tab-settings">
              <Settings className="w-4 h-4 mr-2" />
              Paramètres
            </TabsTrigger>
            <TabsTrigger value="financial" className="rounded-full" data-testid="tab-financial">
              <DollarSign className="w-4 h-4 mr-2" />
              Finances
            </TabsTrigger>
            <TabsTrigger value="feedback" className="rounded-full" data-testid="tab-feedback">
              <MessageSquare className="w-4 h-4 mr-2" />
              Avis ({feedback.length})
            </TabsTrigger>
            <TabsTrigger value="contacts" className="rounded-full" data-testid="tab-contacts">
              <Mail className="w-4 h-4 mr-2" />
              Messages ({contacts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="delivery">
            <DeliveryRequestsTab
              hasActiveFilters={hasActiveFilters}
              clearFilters={clearFilters}
              handleExport={handleExport}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              urgencyFilter={urgencyFilter}
              setUrgencyFilter={setUrgencyFilter}
              riderFilter={riderFilter}
              setRiderFilter={setRiderFilter}
              acceptedRiders={acceptedRiders}
              dateFrom={dateFrom}
              setDateFrom={setDateFrom}
              dateTo={dateTo}
              setDateTo={setDateTo}
              zoneFilter={zoneFilter}
              setZoneFilter={setZoneFilter}
              uniqueZones={uniqueZones}
              filterSummary={filterSummary}
              toggleSort={toggleSort}
              sortField={sortField}
              sortDirection={sortDirection}
              paginatedDeliveries={paginatedDeliveries}
              setSelectedItem={setSelectedItem}
              setDetailsOpen={setDetailsOpen}
              setAssignOpen={setAssignOpen}
              handleDeliveryStatusUpdate={handleDeliveryStatusUpdate}
              setDeleteType={setDeleteType}
              setDeleteOpen={setDeleteOpen}
              totalPages={totalPages}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              filteredDeliveries={filteredDeliveries}
            />
          </TabsContent>

          <TabsContent value="riders">
            <RidersTab
              handleExport={handleExport}
              riderSearchQuery={riderSearchQuery}
              setRiderSearchQuery={setRiderSearchQuery}
              setRiderPage={setRiderPage}
              riderStatusFilter={riderStatusFilter}
              setRiderStatusFilter={setRiderStatusFilter}
              paginatedRiders={paginatedRiders}
              setSelectedItem={setSelectedItem}
              setStatusType={setStatusType}
              setSelectedStatus={setSelectedStatus}
              setStatusOpen={setStatusOpen}
              setDeleteType={setDeleteType}
              setDeleteOpen={setDeleteOpen}
              riderTotalPages={riderTotalPages}
              riderPage={riderPage}
            />
          </TabsContent>

          <TabsContent value="merchants">
            <MerchantsTab
              handleExport={handleExport}
              merchantSearchQuery={merchantSearchQuery}
              setMerchantSearchQuery={setMerchantSearchQuery}
              setMerchantPage={setMerchantPage}
              merchantStatusFilter={merchantStatusFilter}
              setMerchantStatusFilter={setMerchantStatusFilter}
              paginatedMerchants={paginatedMerchants}
              setSelectedItem={setSelectedItem}
              setStatusType={setStatusType}
              setSelectedStatus={setSelectedStatus}
              setStatusOpen={setStatusOpen}
              setDeleteType={setDeleteType}
              setDeleteOpen={setDeleteOpen}
              merchantTotalPages={merchantTotalPages}
              merchantPage={merchantPage}
            />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsTab analytics={analytics} />
          </TabsContent>

          <TabsContent value="feedback">
            <FeedbackTab handleExport={handleExport} feedback={feedback} />
          </TabsContent>

          <TabsContent value="contacts">
            <ContactsTab contacts={contacts} />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsTab
              showNewZoneForm={showNewZoneForm}
              setShowNewZoneForm={setShowNewZoneForm}
              newZone={newZone}
              setNewZone={setNewZone}
              handleCreateZone={handleCreateZone}
              settingsLoading={settingsLoading}
              zones={zones}
              editingZone={editingZone}
              setEditingZone={setEditingZone}
              handleSaveZone={handleSaveZone}
              handleDeleteZone={handleDeleteZone}
              platformSettings={platformSettings}
              setPlatformSettings={setPlatformSettings}
              handleSaveSettings={handleSaveSettings}
            />
          </TabsContent>

          <TabsContent value="financial">
            <FinancialTab
              financialStats={financialStats}
              handleExport={handleExport}
              financialDateFrom={financialDateFrom}
              setFinancialDateFrom={setFinancialDateFrom}
              financialDateTo={financialDateTo}
              setFinancialDateTo={setFinancialDateTo}
              loadFinancialData={loadFinancialData}
            />
          </TabsContent>
        </Tabs>
      </div>

      <DeliveryDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        selectedItem={selectedItem}
      />

      <AssignRiderDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        selectedItem={selectedItem}
        acceptedRiders={acceptedRiders}
        selectedRiderId={selectedRiderId}
        setSelectedRiderId={setSelectedRiderId}
        actionLoading={actionLoading}
        handleAssignRider={handleAssignRider}
      />

      <StatusUpdateDialog
        open={statusOpen}
        onOpenChange={setStatusOpen}
        selectedItem={selectedItem}
        statusType={statusType}
        selectedStatus={selectedStatus}
        statusReason={statusReason}
        setStatusReason={setStatusReason}
        actionLoading={actionLoading}
        handleStatusUpdate={handleStatusUpdate}
      />

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        deleteType={deleteType}
        actionLoading={actionLoading}
        handleDelete={handleDelete}
      />
    </div>
  );
}
