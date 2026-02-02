import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Lock, LogOut, Package, MessageSquare, Store, Bike, Mail,
  Download, RefreshCw, Loader2, Star, Eye, Check, X, UserPlus,
  TrendingUp, BarChart3, Clock, CheckCircle, Truck, AlertCircle,
  Trash2, RotateCcw, MoreVertical, Ban
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { Textarea } from "../components/ui/textarea";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
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
  const [deleteType, setDeleteType] = useState(null); // 'merchant', 'rider', 'delivery'
  const [deliveryStatusOpen, setDeliveryStatusOpen] = useState(false);
  const [statusType, setStatusType] = useState(null); // 'merchant' or 'rider'
  const [selectedStatus, setSelectedStatus] = useState("");
  const [statusReason, setStatusReason] = useState("");
  const [selectedRiderId, setSelectedRiderId] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  
  const storedPassword = localStorage.getItem("plb_admin_password");

  useEffect(() => {
    if (storedPassword) {
      setPassword(storedPassword);
      setIsAuthenticated(true);
    }
  }, [storedPassword]);

  useEffect(() => {
    if (isAuthenticated) {
      loadAllData();
    }
  }, [isAuthenticated]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!password) {
      toast.error("Veuillez entrer le mot de passe");
      return;
    }

    setLoginLoading(true);
    try {
      const response = await axios.post(`${API}/admin/login`, { password });
      if (response.data.success) {
        localStorage.setItem("plb_admin_password", password);
        setIsAuthenticated(true);
        toast.success("Connexion réussie");
      }
    } catch (error) {
      toast.error("Mot de passe incorrect");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("plb_admin_password");
    setIsAuthenticated(false);
    setPassword("");
    toast.info("Déconnexion réussie");
  };

  const loadAllData = async () => {
    setLoading(true);
    const pwd = localStorage.getItem("plb_admin_password");
    try {
      const [statsRes, analyticsRes, deliveryRes, feedbackRes, merchantsRes, ridersRes, contactsRes] = await Promise.all([
        axios.get(`${API}/admin/stats?password=${pwd}`),
        axios.get(`${API}/admin/analytics?password=${pwd}`),
        axios.get(`${API}/admin/delivery-requests?password=${pwd}`),
        axios.get(`${API}/admin/feedback?password=${pwd}`),
        axios.get(`${API}/admin/merchants?password=${pwd}`),
        axios.get(`${API}/admin/riders?password=${pwd}`),
        axios.get(`${API}/admin/contacts?password=${pwd}`)
      ]);
      
      setStats(statsRes.data);
      setAnalytics(analyticsRes.data);
      setDeliveryRequests(deliveryRes.data);
      setFeedback(feedbackRes.data);
      setMerchants(merchantsRes.data);
      setRiders(ridersRes.data);
      setContacts(contactsRes.data);
    } catch (error) {
      console.error(error);
      if (error.response?.status === 401) {
        handleLogout();
        toast.error("Session expirée");
      } else {
        toast.error("Erreur lors du chargement des données");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (type) => {
    const pwd = localStorage.getItem("plb_admin_password");
    window.open(`${API}/admin/export/${type}?password=${pwd}`, "_blank");
    toast.success("Export en cours...");
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getUrgencyBadge = (urgence) => {
    const badges = {
      standard: "bg-slate-100 text-slate-700",
      express: "bg-amber-100 text-amber-700",
      urgent: "bg-red-100 text-red-700"
    };
    return badges[urgence] || badges.standard;
  };

  const getStatusBadge = (status) => {
    const badges = {
      nouveau: "bg-sky-100 text-sky-700",
      en_attente: "bg-amber-100 text-amber-700",
      accepte: "bg-green-100 text-green-700",
      refuse: "bg-red-100 text-red-700",
      assigne: "bg-purple-100 text-purple-700",
      en_cours: "bg-blue-100 text-blue-700",
      livre: "bg-green-100 text-green-700",
      annule: "bg-red-100 text-red-700"
    };
    return badges[status] || "bg-slate-100 text-slate-700";
  };

  const getStatusLabel = (status) => {
    const labels = {
      nouveau: "Nouveau",
      en_attente: "En attente",
      accepte: "Accepté",
      refuse: "Refusé",
      assigne: "Assigné",
      en_cours: "En cours",
      livre: "Livré",
      annule: "Annulé"
    };
    return labels[status] || status;
  };

  // Handle status update for merchants/riders
  const handleStatusUpdate = async () => {
    if (!selectedStatus) {
      toast.error("Veuillez sélectionner un statut");
      return;
    }
    
    setActionLoading(true);
    const pwd = localStorage.getItem("plb_admin_password");
    
    try {
      const endpoint = statusType === 'merchant' 
        ? `${API}/admin/merchants/${selectedItem.id}/status`
        : `${API}/admin/riders/${selectedItem.id}/status`;
      
      await axios.patch(`${endpoint}?password=${pwd}`, {
        status: selectedStatus,
        reason: statusReason || null
      });
      
      toast.success(`Statut mis à jour et email envoyé !`);
      setStatusOpen(false);
      setSelectedStatus("");
      setStatusReason("");
      loadAllData();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
      console.error(error);
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
    const pwd = localStorage.getItem("plb_admin_password");
    
    try {
      await axios.patch(
        `${API}/admin/delivery-requests/${selectedItem.id}/assign?password=${pwd}`,
        { livreur_id: selectedRiderId }
      );
      
      toast.success("Livraison assignée avec succès !");
      setAssignOpen(false);
      setSelectedRiderId("");
      loadAllData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de l'assignation");
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle delivery status update
  const handleDeliveryStatusUpdate = async (deliveryId, newStatus) => {
    const pwd = localStorage.getItem("plb_admin_password");
    
    try {
      await axios.patch(
        `${API}/admin/delivery-requests/${deliveryId}/status?password=${pwd}`,
        { status: newStatus }
      );
      
      toast.success(`Statut mis à jour: ${getStatusLabel(newStatus)}`);
      loadAllData();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
      console.error(error);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    setActionLoading(true);
    const pwd = localStorage.getItem("plb_admin_password");
    
    try {
      let endpoint = '';
      if (deleteType === 'merchant') {
        endpoint = `${API}/admin/merchants/${selectedItem.id}?password=${pwd}`;
      } else if (deleteType === 'rider') {
        endpoint = `${API}/admin/riders/${selectedItem.id}?password=${pwd}`;
      } else if (deleteType === 'delivery') {
        endpoint = `${API}/admin/delivery-requests/${selectedItem.id}?password=${pwd}`;
      }
      
      await axios.delete(endpoint);
      
      toast.success("Suppression effectuée");
      setDeleteOpen(false);
      setSelectedItem(null);
      loadAllData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de la suppression");
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const acceptedRiders = riders.filter(r => r.status === 'accepte');

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
                Connectez-vous pour accéder au tableau de bord
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4" data-testid="admin-login-form">
              <div>
                <Label htmlFor="password" className="text-slate-700 mb-2 block">
                  Mot de passe
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Entrez le mot de passe"
                  className="rounded-xl h-12"
                  data-testid="admin-password-input"
                />
              </div>
              <Button
                type="submit"
                disabled={loginLoading}
                className="w-full bg-sky-500 hover:bg-sky-600 text-white rounded-full h-12"
                data-testid="admin-login-btn"
              >
                {loginLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connexion...
                  </>
                ) : (
                  "Se connecter"
                )}
              </Button>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="admin-dashboard">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-16 z-40">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-2xl font-bold text-slate-900">
                Tableau de bord
              </h1>
              <p className="text-sm text-slate-500">Gestion PLB Logistique</p>
            </div>
            <div className="flex items-center gap-3">
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
      <div className="container-custom py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
            <p className="text-sm text-slate-500">Demandes</p>
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
            <TabsTrigger value="feedback" className="rounded-full" data-testid="tab-feedback">
              <MessageSquare className="w-4 h-4 mr-2" />
              Avis ({feedback.length})
            </TabsTrigger>
            <TabsTrigger value="contacts" className="rounded-full" data-testid="tab-contacts">
              <Mail className="w-4 h-4 mr-2" />
              Messages ({contacts.length})
            </TabsTrigger>
          </TabsList>

          {/* Delivery Requests Tab */}
          <TabsContent value="delivery">
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-semibold text-slate-900">Commandes de livraison</h2>
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
              <div className="overflow-x-auto">
                <table className="w-full" data-testid="delivery-table">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Client</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Trajet</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Urgence</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Livreur</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Statut</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveryRequests.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-4 py-8 text-center text-slate-500">
                          Aucune commande
                        </td>
                      </tr>
                    ) : (
                      deliveryRequests.map((item, index) => (
                        <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50" data-testid={`delivery-row-${index}`}>
                          <td className="px-4 py-3 text-sm text-slate-600">{formatDate(item.created_at)}</td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-slate-900">{item.nom}</p>
                            <p className="text-xs text-slate-500">{item.telephone}</p>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {item.zone_enlevement} → {item.zone_livraison}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyBadge(item.urgence)}`}>
                              {item.urgence}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {item.livreur_nom || "-"}
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
            </div>
          </TabsContent>

          {/* Riders Tab */}
          <TabsContent value="riders">
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-semibold text-slate-900">Candidatures livreurs</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport("riders")}
                  className="rounded-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exporter CSV
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full" data-testid="riders-table">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Nom</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Contact</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Zone</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Véhicule</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Livraisons</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Statut</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riders.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="px-4 py-8 text-center text-slate-500">
                          Aucune candidature livreur
                        </td>
                      </tr>
                    ) : (
                      riders.map((item, index) => (
                        <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50" data-testid={`rider-row-${index}`}>
                          <td className="px-4 py-3 text-sm text-slate-600">{formatDate(item.created_at)}</td>
                          <td className="px-4 py-3 text-sm font-medium text-slate-900">{item.prenom} {item.nom}</td>
                          <td className="px-4 py-3">
                            <p className="text-sm text-slate-600">{item.telephone}</p>
                            <p className="text-xs text-slate-400">{item.email}</p>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">{item.zone_couverture}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{item.type_vehicule}</td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-slate-900">{item.total_livraisons || 0}</p>
                            <p className="text-xs text-slate-400">{item.livraisons_en_cours || 0} en cours</p>
                          </td>
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
                                      setStatusType('rider');
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
                                      setStatusType('rider');
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
                                onClick={() => { setSelectedItem(item); setDeleteType('rider'); setDeleteOpen(true); }}
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
            </div>
          </TabsContent>

          {/* Merchants Tab */}
          <TabsContent value="merchants">
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-semibold text-slate-900">Candidatures commerçants</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport("merchants")}
                  className="rounded-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exporter CSV
                </Button>
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
                    {merchants.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-4 py-8 text-center text-slate-500">
                          Aucune candidature commerçant
                        </td>
                      </tr>
                    ) : (
                      merchants.map((item, index) => (
                        <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50" data-testid={`merchant-row-${index}`}>
                          <td className="px-4 py-3 text-sm text-slate-600">{formatDate(item.created_at)}</td>
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
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
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
          </TabsContent>

          {/* Feedback Tab */}
          <TabsContent value="feedback">
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-semibold text-slate-900">Avis clients</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport("feedback")}
                  className="rounded-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exporter CSV
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full" data-testid="feedback-table">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Client</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Note</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Commentaire</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Problèmes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feedback.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-4 py-8 text-center text-slate-500">
                          Aucun avis client
                        </td>
                      </tr>
                    ) : (
                      feedback.map((item, index) => (
                        <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50">
                          <td className="px-4 py-3 text-sm text-slate-600">{formatDate(item.created_at)}</td>
                          <td className="px-4 py-3 text-sm font-medium text-slate-900">{item.nom}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${star <= item.note ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
                                />
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600 max-w-xs">{item.commentaire}</td>
                          <td className="px-4 py-3 text-sm text-slate-600 max-w-xs">{item.problemes || "-"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Contacts Tab */}
          <TabsContent value="contacts">
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <h2 className="font-semibold text-slate-900">Messages de contact</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full" data-testid="contacts-table">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Nom</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Sujet</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-4 py-8 text-center text-slate-500">
                          Aucun message de contact
                        </td>
                      </tr>
                    ) : (
                      contacts.map((item, index) => (
                        <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50">
                          <td className="px-4 py-3 text-sm text-slate-600">{formatDate(item.created_at)}</td>
                          <td className="px-4 py-3 text-sm font-medium text-slate-900">{item.nom}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{item.email}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{item.sujet}</td>
                          <td className="px-4 py-3 text-sm text-slate-600 max-w-xs truncate">{item.message}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delivery Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Détails de la commande</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Client</p>
                  <p className="font-medium text-slate-900">{selectedItem.nom}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Téléphone</p>
                  <p className="font-medium text-slate-900">{selectedItem.telephone}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Zone d&apos;enlèvement</p>
                  <p className="font-medium text-slate-900">{selectedItem.zone_enlevement}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Zone de livraison</p>
                  <p className="font-medium text-slate-900">{selectedItem.zone_livraison}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Type de colis</p>
                  <p className="font-medium text-slate-900">{selectedItem.type_colis}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Urgence</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyBadge(selectedItem.urgence)}`}>
                    {selectedItem.urgence}
                  </span>
                </div>
              </div>
              {selectedItem.livreur_nom && (
                <div>
                  <p className="text-sm text-slate-500">Livreur assigné</p>
                  <p className="font-medium text-slate-900">{selectedItem.livreur_nom}</p>
                </div>
              )}
              {selectedItem.notes && (
                <div>
                  <p className="text-sm text-slate-500">Notes</p>
                  <p className="text-slate-900">{selectedItem.notes}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-slate-500">Statut</p>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedItem.status)}`}>
                  {getStatusLabel(selectedItem.status)}
                </span>
              </div>
              <div>
                <p className="text-sm text-slate-500">Date de création</p>
                <p className="font-medium text-slate-900">{formatDate(selectedItem.created_at)}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Rider Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assigner un livreur</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-sm text-slate-500 mb-1">Commande</p>
                <p className="font-medium text-slate-900">{selectedItem.nom}</p>
                <p className="text-sm text-slate-600">{selectedItem.zone_enlevement} → {selectedItem.zone_livraison}</p>
              </div>
              
              <div>
                <Label className="text-slate-700 mb-2 block">
                  Sélectionner un livreur *
                </Label>
                <Select value={selectedRiderId} onValueChange={setSelectedRiderId}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Choisir un livreur" />
                  </SelectTrigger>
                  <SelectContent>
                    {acceptedRiders.length === 0 ? (
                      <div className="p-2 text-sm text-slate-500">Aucun livreur validé</div>
                    ) : (
                      acceptedRiders.map((rider) => (
                        <SelectItem key={rider.id} value={rider.id}>
                          {rider.prenom} {rider.nom} - {rider.zone_couverture} ({rider.livraisons_en_cours || 0} en cours)
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)} className="rounded-full">
              Annuler
            </Button>
            <Button 
              onClick={handleAssignRider} 
              disabled={actionLoading || !selectedRiderId}
              className="bg-sky-500 hover:bg-sky-600 text-white rounded-full"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Assigner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedStatus === 'accepte' ? 'Accepter la candidature' : 'Refuser la candidature'}
            </DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-sm text-slate-500 mb-1">Candidat</p>
                <p className="font-medium text-slate-900">
                  {statusType === 'merchant' ? selectedItem.nom_entreprise : `${selectedItem.prenom} ${selectedItem.nom}`}
                </p>
                <p className="text-sm text-slate-600">
                  {statusType === 'merchant' ? selectedItem.email : selectedItem.email}
                </p>
              </div>
              
              <div className={`flex items-center gap-3 p-4 rounded-xl ${selectedStatus === 'accepte' ? 'bg-green-50' : 'bg-red-50'}`}>
                {selectedStatus === 'accepte' ? (
                  <>
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800">Accepter cette candidature</p>
                      <p className="text-sm text-green-600">Un email de confirmation sera envoyé</p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-6 h-6 text-red-600" />
                    <div>
                      <p className="font-medium text-red-800">Refuser cette candidature</p>
                      <p className="text-sm text-red-600">Un email de notification sera envoyé</p>
                    </div>
                  </>
                )}
              </div>
              
              <div>
                <Label className="text-slate-700 mb-2 block">
                  Raison (optionnel)
                </Label>
                <Textarea
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder={selectedStatus === 'accepte' ? "Message de bienvenue..." : "Motif du refus..."}
                  className="rounded-xl"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusOpen(false)} className="rounded-full">
              Annuler
            </Button>
            <Button 
              onClick={handleStatusUpdate} 
              disabled={actionLoading}
              className={`rounded-full ${selectedStatus === 'accepte' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white`}
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {selectedStatus === 'accepte' ? 'Accepter' : 'Refuser'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteType === 'delivery' && (
                <>Êtes-vous sûr de vouloir supprimer cette commande ? Cette action est irréversible.</>
              )}
              {deleteType === 'rider' && (
                <>Êtes-vous sûr de vouloir supprimer ce livreur ? Cette action est irréversible.</>
              )}
              {deleteType === 'merchant' && (
                <>Êtes-vous sûr de vouloir supprimer ce commerçant ? Cette action est irréversible.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700 text-white rounded-full"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
