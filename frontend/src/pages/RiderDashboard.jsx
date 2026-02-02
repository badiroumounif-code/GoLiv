import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Truck, Package, CheckCircle, Clock, XCircle, MapPin, 
  Phone, User, AlertCircle, RefreshCw, LogOut, TrendingUp,
  Navigation, MessageSquare, Camera
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function RiderDashboard() {
  const navigate = useNavigate();
  const { user, token, logout, authFetch } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [stats, setStats] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("en_cours");
  const [actionLoading, setActionLoading] = useState(null);
  const [noteModal, setNoteModal] = useState({ open: false, deliveryId: null, action: null });
  const [noteText, setNoteText] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [deliveriesRes, statsRes, profileRes] = await Promise.all([
        authFetch(`${API_URL}/api/rider/deliveries`),
        authFetch(`${API_URL}/api/rider/stats`),
        authFetch(`${API_URL}/api/rider/profile`)
      ]);

      if (deliveriesRes.ok) {
        setDeliveries(await deliveriesRes.json());
      }
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
      if (profileRes.ok) {
        setProfile(await profileRes.json());
      }
    } catch (error) {
      if (error.message === "Session expirée") {
        toast.error("Session expirée, veuillez vous reconnecter");
        navigate("/connexion");
      } else {
        toast.error("Erreur lors du chargement des données");
      }
    } finally {
      setLoading(false);
    }
  }, [authFetch, navigate]);

  useEffect(() => {
    if (!token) {
      navigate("/connexion");
      return;
    }
    if (user?.role !== "rider") {
      toast.error("Accès non autorisé");
      navigate("/connexion");
      return;
    }
    fetchData();
  }, [token, user, navigate, fetchData]);

  const handleAccept = async (deliveryId) => {
    setActionLoading(deliveryId);
    try {
      const res = await authFetch(`${API_URL}/api/rider/deliveries/${deliveryId}/accept`, {
        method: "PATCH"
      });
      if (res.ok) {
        toast.success("Livraison acceptée !");
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.detail || "Erreur");
      }
    } catch (error) {
      toast.error("Erreur de connexion");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRefuse = async () => {
    if (!noteText.trim()) {
      toast.error("Veuillez indiquer une raison");
      return;
    }
    setActionLoading(noteModal.deliveryId);
    try {
      const res = await authFetch(`${API_URL}/api/rider/deliveries/${noteModal.deliveryId}/refuse`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: noteText })
      });
      if (res.ok) {
        toast.success("Livraison refusée");
        setNoteModal({ open: false, deliveryId: null, action: null });
        setNoteText("");
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.detail || "Erreur");
      }
    } catch (error) {
      toast.error("Erreur de connexion");
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusUpdate = async (deliveryId, status) => {
    setActionLoading(deliveryId);
    try {
      const res = await authFetch(`${API_URL}/api/rider/deliveries/${deliveryId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes: noteText || null })
      });
      if (res.ok) {
        toast.success(`Statut mis à jour: ${getStatusLabel(status)}`);
        setNoteModal({ open: false, deliveryId: null, action: null });
        setNoteText("");
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.detail || "Erreur");
      }
    } catch (error) {
      toast.error("Erreur de connexion");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      nouveau: "Nouveau",
      assigne: "Assigné",
      en_cours: "En cours",
      livre: "Livré",
      echec: "Échec",
      annule: "Annulé"
    };
    return labels[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = {
      nouveau: "bg-blue-100 text-blue-700",
      assigne: "bg-amber-100 text-amber-700",
      en_cours: "bg-sky-100 text-sky-700",
      livre: "bg-green-100 text-green-700",
      echec: "bg-red-100 text-red-700",
      annule: "bg-slate-100 text-slate-700"
    };
    return colors[status] || "bg-slate-100 text-slate-700";
  };

  const filteredDeliveries = deliveries.filter(d => {
    if (activeTab === "en_cours") return ["assigne", "en_cours"].includes(d.status);
    if (activeTab === "termine") return ["livre", "echec", "annule"].includes(d.status);
    return true;
  });

  const handleLogout = () => {
    logout();
    navigate("/");
    toast.success("Déconnexion réussie");
  };

  const openGoogleMaps = (zone) => {
    const query = encodeURIComponent(`${zone}, Bénin`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container-custom py-12">
        <div className="bg-amber-50 rounded-2xl p-8 text-center">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Profil non configuré</h2>
          <p className="text-slate-600 mb-6">
            Votre profil livreur n'est pas encore lié à votre compte. 
            Veuillez contacter l'administrateur.
          </p>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            Se déconnecter
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="rider-dashboard">
      {/* Header */}
      <div className="bg-gradient-to-br from-sky-500 to-sky-600 text-white">
        <div className="container-custom py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sky-100 text-sm mb-1">Espace Livreur</p>
              <h1 className="text-2xl md:text-3xl font-bold">
                Bonjour, {profile?.prenom || user?.nom} !
              </h1>
              <p className="text-sky-100 mt-1 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Zone: {profile?.zone_couverture}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={fetchData}
                variant="secondary"
                className="bg-white/20 hover:bg-white/30 text-white border-0"
                data-testid="refresh-btn"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualiser
              </Button>
              <Button
                onClick={handleLogout}
                variant="secondary"
                className="bg-white/20 hover:bg-white/30 text-white border-0"
                data-testid="logout-btn"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center">
                  <Package className="w-5 h-5 text-sky-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats.stats.total_assignees}</p>
                  <p className="text-sm text-slate-500">Total assignées</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats.stats.en_cours}</p>
                  <p className="text-sm text-slate-500">En cours</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats.stats.completees}</p>
                  <p className="text-sm text-slate-500">Complétées</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats.stats.completees_7j}</p>
                  <p className="text-sm text-slate-500">Cette semaine</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: "en_cours", label: "En cours", icon: Clock },
            { id: "termine", label: "Terminées", icon: CheckCircle },
            { id: "toutes", label: "Toutes", icon: Package }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-sky-500 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
              }`}
              data-testid={`tab-${tab.id}`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Deliveries List */}
        <div className="space-y-4">
          {filteredDeliveries.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center">
              <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Aucune livraison</h3>
              <p className="text-slate-500">
                {activeTab === "en_cours" 
                  ? "Vous n'avez pas de livraison en cours" 
                  : "Aucune livraison trouvée"}
              </p>
            </div>
          ) : (
            filteredDeliveries.map((delivery, index) => (
              <motion.div
                key={delivery.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
                data-testid={`delivery-card-${delivery.id}`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <User className="w-4 h-4 text-slate-400" />
                          <span className="font-semibold text-slate-900">{delivery.nom}</span>
                          <Badge className={getStatusColor(delivery.status)}>
                            {getStatusLabel(delivery.status)}
                          </Badge>
                        </div>
                        <a 
                          href={`tel:${delivery.telephone}`}
                          className="flex items-center gap-2 text-sky-600 hover:text-sky-700"
                        >
                          <Phone className="w-4 h-4" />
                          {delivery.telephone}
                        </a>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        delivery.urgence === "urgent" ? "bg-red-100 text-red-700" :
                        delivery.urgence === "express" ? "bg-amber-100 text-amber-700" :
                        "bg-slate-100 text-slate-600"
                      }`}>
                        {delivery.urgence}
                      </span>
                    </div>

                    <div className="grid md:grid-cols-2 gap-3 mb-4">
                      <div 
                        className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100"
                        onClick={() => openGoogleMaps(delivery.zone_enlevement)}
                      >
                        <MapPin className="w-4 h-4 text-sky-500 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500">Enlèvement</p>
                          <p className="text-sm font-medium text-slate-900">{delivery.zone_enlevement}</p>
                        </div>
                        <Navigation className="w-4 h-4 text-slate-400 ml-auto" />
                      </div>
                      <div 
                        className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100"
                        onClick={() => openGoogleMaps(delivery.zone_livraison)}
                      >
                        <MapPin className="w-4 h-4 text-green-500 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500">Livraison</p>
                          <p className="text-sm font-medium text-slate-900">{delivery.zone_livraison}</p>
                        </div>
                        <Navigation className="w-4 h-4 text-slate-400 ml-auto" />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 text-sm text-slate-600">
                      <span className="bg-slate-100 px-2 py-1 rounded">
                        <Package className="w-3 h-3 inline mr-1" />
                        {delivery.type_colis}
                      </span>
                      {delivery.notes && (
                        <span className="bg-slate-100 px-2 py-1 rounded">
                          <MessageSquare className="w-3 h-3 inline mr-1" />
                          {delivery.notes}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 lg:w-48">
                    {delivery.status === "assigne" && !delivery.rider_accepted && (
                      <>
                        <Button
                          onClick={() => handleAccept(delivery.id)}
                          className="bg-green-500 hover:bg-green-600 text-white"
                          disabled={actionLoading === delivery.id}
                          data-testid={`accept-btn-${delivery.id}`}
                        >
                          {actionLoading === delivery.id ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Accepter
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => setNoteModal({ open: true, deliveryId: delivery.id, action: "refuse" })}
                          variant="outline"
                          className="border-red-200 text-red-600 hover:bg-red-50"
                          disabled={actionLoading === delivery.id}
                          data-testid={`refuse-btn-${delivery.id}`}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Refuser
                        </Button>
                      </>
                    )}

                    {(delivery.status === "en_cours" || (delivery.status === "assigne" && delivery.rider_accepted)) && (
                      <Button
                        onClick={() => handleStatusUpdate(delivery.id, "livre")}
                        className="bg-green-500 hover:bg-green-600 text-white"
                        disabled={actionLoading === delivery.id}
                        data-testid={`complete-btn-${delivery.id}`}
                      >
                        {actionLoading === delivery.id ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Marquer livré
                          </>
                        )}
                      </Button>
                    )}

                    {delivery.status === "en_cours" && (
                      <Button
                        onClick={() => setNoteModal({ open: true, deliveryId: delivery.id, action: "echec" })}
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50"
                        disabled={actionLoading === delivery.id}
                        data-testid={`fail-btn-${delivery.id}`}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Signaler échec
                      </Button>
                    )}

                    {delivery.status === "livre" && (
                      <div className="text-center p-3 bg-green-50 rounded-xl">
                        <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-1" />
                        <p className="text-sm text-green-700 font-medium">Livrée</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Note Modal */}
      {noteModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" data-testid="note-modal">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full"
          >
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              {noteModal.action === "refuse" ? "Raison du refus" : "Note sur l'échec"}
            </h3>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Expliquez la raison..."
              className="w-full p-3 border border-slate-200 rounded-xl resize-none h-32 focus:outline-none focus:ring-2 focus:ring-sky-500"
              data-testid="note-textarea"
            />
            <div className="flex gap-3 mt-4">
              <Button
                onClick={() => {
                  setNoteModal({ open: false, deliveryId: null, action: null });
                  setNoteText("");
                }}
                variant="outline"
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={() => {
                  if (noteModal.action === "refuse") {
                    handleRefuse();
                  } else {
                    handleStatusUpdate(noteModal.deliveryId, "echec");
                  }
                }}
                className={noteModal.action === "refuse" ? "flex-1 bg-red-500 hover:bg-red-600" : "flex-1 bg-amber-500 hover:bg-amber-600"}
                disabled={actionLoading}
                data-testid="confirm-note-btn"
              >
                {actionLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Confirmer"
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
