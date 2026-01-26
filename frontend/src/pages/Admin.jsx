import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Lock, LogOut, Package, MessageSquare, Store, Bike, Mail,
  Download, RefreshCw, Loader2, Star, Eye
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
} from "../components/ui/dialog";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState("delivery");
  
  const [deliveryRequests, setDeliveryRequests] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [riders, setRiders] = useState([]);
  const [contacts, setContacts] = useState([]);
  
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  
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
      const [statsRes, deliveryRes, feedbackRes, merchantsRes, ridersRes, contactsRes] = await Promise.all([
        axios.get(`${API}/admin/stats?password=${pwd}`),
        axios.get(`${API}/admin/delivery-requests?password=${pwd}`),
        axios.get(`${API}/admin/feedback?password=${pwd}`),
        axios.get(`${API}/admin/merchants?password=${pwd}`),
        axios.get(`${API}/admin/riders?password=${pwd}`),
        axios.get(`${API}/admin/contacts?password=${pwd}`)
      ]);
      
      setStats(statsRes.data);
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
      complete: "bg-green-100 text-green-700"
    };
    return badges[status] || badges.nouveau;
  };

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

      {/* Stats */}
      <div className="container-custom py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { icon: <Package className="w-5 h-5" />, label: "Demandes", value: stats?.demandes_livraison || 0, color: "sky" },
            { icon: <MessageSquare className="w-5 h-5" />, label: "Avis", value: stats?.avis_clients || 0, color: "amber" },
            { icon: <Store className="w-5 h-5" />, label: "Commerçants", value: stats?.commercants || 0, color: "green" },
            { icon: <Bike className="w-5 h-5" />, label: "Livreurs", value: stats?.livreurs || 0, color: "purple" }
          ].map((stat, index) => (
            <div key={index} className="bg-white rounded-2xl p-4 border border-slate-100" data-testid={`stat-${index}`}>
              <div className={`w-10 h-10 bg-${stat.color}-50 rounded-xl flex items-center justify-center text-${stat.color}-500 mb-2`}>
                {stat.icon}
              </div>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-sm text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-white border border-slate-100 rounded-full p-1 mb-6">
            <TabsTrigger value="delivery" className="rounded-full" data-testid="tab-delivery">
              <Package className="w-4 h-4 mr-2" />
              Demandes ({deliveryRequests.length})
            </TabsTrigger>
            <TabsTrigger value="feedback" className="rounded-full" data-testid="tab-feedback">
              <MessageSquare className="w-4 h-4 mr-2" />
              Avis ({feedback.length})
            </TabsTrigger>
            <TabsTrigger value="merchants" className="rounded-full" data-testid="tab-merchants">
              <Store className="w-4 h-4 mr-2" />
              Commerçants ({merchants.length})
            </TabsTrigger>
            <TabsTrigger value="riders" className="rounded-full" data-testid="tab-riders">
              <Bike className="w-4 h-4 mr-2" />
              Livreurs ({riders.length})
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
                <h2 className="font-semibold text-slate-900">Demandes de livraison</h2>
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Téléphone</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Trajet</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Urgence</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveryRequests.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-4 py-8 text-center text-slate-500">
                          Aucune demande de livraison
                        </td>
                      </tr>
                    ) : (
                      deliveryRequests.map((item, index) => (
                        <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50" data-testid={`delivery-row-${index}`}>
                          <td className="px-4 py-3 text-sm text-slate-600">{formatDate(item.created_at)}</td>
                          <td className="px-4 py-3 text-sm font-medium text-slate-900">{item.nom}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{item.telephone}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {item.zone_enlevement} → {item.zone_livraison}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">{item.type_colis}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyBadge(item.urgence)}`}>
                              {item.urgence}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => { setSelectedItem(item); setDetailsOpen(true); }}
                              className="rounded-full"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
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
                  data-testid="export-feedback-btn"
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
                        <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50" data-testid={`feedback-row-${index}`}>
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
                          <td className="px-4 py-3 text-sm text-slate-600 max-w-xs truncate">{item.commentaire}</td>
                          <td className="px-4 py-3 text-sm text-slate-600 max-w-xs truncate">{item.problemes || "-"}</td>
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
                  data-testid="export-merchants-btn"
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Volume</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Statut</th>
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
                          <td className="px-4 py-3 text-sm text-slate-600">{item.nom_contact}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{item.email}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{item.type_produits}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{item.volume_mensuel}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(item.status)}`}>
                              {item.status}
                            </span>
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
                  data-testid="export-riders-btn"
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Téléphone</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Zone</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Véhicule</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Disponibilité</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riders.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-4 py-8 text-center text-slate-500">
                          Aucune candidature livreur
                        </td>
                      </tr>
                    ) : (
                      riders.map((item, index) => (
                        <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50" data-testid={`rider-row-${index}`}>
                          <td className="px-4 py-3 text-sm text-slate-600">{formatDate(item.created_at)}</td>
                          <td className="px-4 py-3 text-sm font-medium text-slate-900">{item.prenom} {item.nom}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{item.telephone}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{item.zone_couverture}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{item.type_vehicule}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{item.disponibilite}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(item.status)}`}>
                              {item.status}
                            </span>
                          </td>
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
                        <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50" data-testid={`contact-row-${index}`}>
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

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Détails de la demande</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-500">Client</p>
                <p className="font-medium text-slate-900">{selectedItem.nom}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Téléphone</p>
                <p className="font-medium text-slate-900">{selectedItem.telephone}</p>
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
              {selectedItem.notes && (
                <div>
                  <p className="text-sm text-slate-500">Notes</p>
                  <p className="text-slate-900">{selectedItem.notes}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-slate-500">Date de création</p>
                <p className="font-medium text-slate-900">{formatDate(selectedItem.created_at)}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
