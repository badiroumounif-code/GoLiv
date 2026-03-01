import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Package, CheckCircle, Clock, XCircle, MapPin, 
  Phone, User, AlertCircle, RefreshCw, LogOut, TrendingUp,
  Plus, Download, Search, Building2, MessageSquare, Scale
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function MerchantDashboard() {
  const navigate = useNavigate();
  const { user, token, logout, authFetch } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [stats, setStats] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("en_cours");
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [availableZones, setAvailableZones] = useState([]);
  const [estimatedPrice, setEstimatedPrice] = useState(null);
  const [newDelivery, setNewDelivery] = useState({
    nom_client: "",
    telephone_client: "",
    zone_enlevement: "",
    zone_livraison: "",
    zone_livraison_id: "",
    type_colis: "petit_colis",
    urgence: "standard",
    poids: "",
    notes: ""
  });

  const pickupZones = ["Cotonou Centre", "Akpakpa", "Calavi", "Godomey", "Porto-Novo", "Fidjrossè", "Cadjèhoun", "Ganhi", "Dantokpa"];
  const typesColis = [
    { value: "petit_colis", label: "Petit colis (< 5kg)" },
    { value: "moyen_colis", label: "Moyen colis (5-15kg)" },
    { value: "gros_colis", label: "Gros colis (> 15kg)" },
    { value: "documents", label: "Documents" },
    { value: "fragile", label: "Colis fragile" }
  ];
  const urgences = [
    { value: "standard", label: "Standard (24-48h)" },
    { value: "express", label: "Express (même jour)" },
    { value: "urgent", label: "Urgent (2-4h)" }
  ];

  // Fetch available zones
  useEffect(() => {
    const fetchZones = async () => {
      try {
        const response = await fetch(`${API_URL}/api/zones`);
        if (response.ok) {
          setAvailableZones(await response.json());
        }
      } catch (error) {
        console.error("Failed to fetch zones:", error);
      }
    };
    fetchZones();
  }, []);

  // Calculate estimated price
  useEffect(() => {
    if (newDelivery.zone_livraison_id) {
      const zone = availableZones.find(z => z.id === newDelivery.zone_livraison_id);
      if (zone) {
        let price = zone.prix_base;
        const weight = parseFloat(newDelivery.poids) || 0;
        if (weight > 5) {
          price += 500;
        }
        setEstimatedPrice(price);
      }
    } else {
      setEstimatedPrice(null);
    }
  }, [newDelivery.zone_livraison_id, newDelivery.poids, availableZones]);

  const fetchData = useCallback(async () => {
    try {
      const [deliveriesRes, statsRes, profileRes] = await Promise.all([
        authFetch(`${API_URL}/api/merchant/deliveries`),
        authFetch(`${API_URL}/api/merchant/stats`),
        authFetch(`${API_URL}/api/merchant/profile`)
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
    if (user?.role !== "merchant") {
      toast.error("Accès non autorisé");
      navigate("/connexion");
      return;
    }
    fetchData();
  }, [token, user, navigate, fetchData]);

  const handleNewDeliveryChange = (e) => {
    setNewDelivery(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleZoneSelect = (zoneId) => {
    const zone = availableZones.find(z => z.id === zoneId);
    if (zone) {
      setNewDelivery(prev => ({ 
        ...prev, 
        zone_livraison: zone.nom,
        zone_livraison_id: zone.id 
      }));
    }
  };

  const handleSubmitNewDelivery = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const payload = {
        ...newDelivery,
        poids: newDelivery.poids ? parseFloat(newDelivery.poids) : null
      };
      const res = await authFetch(`${API_URL}/api/merchant/deliveries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(`Commande créée ! N° ${data.tracking_number}`);
        setShowNewForm(false);
        setNewDelivery({
          nom_client: "",
          telephone_client: "",
          zone_enlevement: "",
          zone_livraison: "",
          zone_livraison_id: "",
          type_colis: "petit_colis",
          urgence: "standard",
          poids: "",
          notes: ""
        });
        setEstimatedPrice(null);
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.detail || "Erreur lors de la création");
      }
    } catch (error) {
      toast.error("Erreur de connexion");
    } finally {
      setFormLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await authFetch(`${API_URL}/api/merchant/export`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `commandes_${profile?.nom_entreprise || "export"}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        toast.success("Export téléchargé !");
      }
    } catch (error) {
      toast.error("Erreur lors de l'export");
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      nouveau: "En attente",
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

  const filteredDeliveries = deliveries
    .filter(d => {
      if (activeTab === "en_cours") return ["nouveau", "assigne", "en_cours"].includes(d.status);
      if (activeTab === "termine") return ["livre", "echec", "annule"].includes(d.status);
      return true;
    })
    .filter(d => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        d.nom?.toLowerCase().includes(term) ||
        d.telephone?.includes(term) ||
        d.zone_livraison?.toLowerCase().includes(term)
      );
    });

  const handleLogout = () => {
    logout();
    navigate("/");
    toast.success("Déconnexion réussie");
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
            Votre profil commerçant n'est pas encore lié à votre compte. 
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
    <div className="min-h-screen bg-slate-50" data-testid="merchant-dashboard">
      {/* Header */}
      <div className="bg-gradient-to-br from-sky-500 to-sky-600 text-white">
        <div className="container-custom py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sky-100 text-sm mb-1">Espace Commerçant</p>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <Building2 className="w-8 h-8" />
                {profile?.nom_entreprise}
              </h1>
              <p className="text-sky-100 mt-1">
                Contact: {profile?.nom_contact}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={() => setShowNewForm(true)}
                className="bg-white text-sky-600 hover:bg-sky-50"
                data-testid="new-delivery-btn"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle commande
              </Button>
              <Button
                onClick={handleExport}
                variant="secondary"
                className="bg-white/20 hover:bg-white/30 text-white border-0"
                data-testid="export-btn"
              >
                <Download className="w-4 h-4 mr-2" />
                Exporter
              </Button>
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
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
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
                  <p className="text-2xl font-bold text-slate-900">{stats.stats.total_commandes}</p>
                  <p className="text-sm text-slate-500">Total commandes</p>
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
              className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 col-span-2 md:col-span-1"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats.stats.livrees}</p>
                  <p className="text-sm text-slate-500">Livrées</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Search and Tabs */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Rechercher par nom, téléphone ou zone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-xl"
              data-testid="search-input"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
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
        </div>

        {/* Deliveries List */}
        <div className="space-y-4">
          {filteredDeliveries.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center">
              <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Aucune commande</h3>
              <p className="text-slate-500 mb-6">
                {searchTerm 
                  ? "Aucun résultat pour votre recherche" 
                  : "Vous n'avez pas encore de commande"}
              </p>
              <Button onClick={() => setShowNewForm(true)} className="bg-sky-500 hover:bg-sky-600">
                <Plus className="w-4 h-4 mr-2" />
                Créer une commande
              </Button>
            </div>
          ) : (
            filteredDeliveries.map((delivery, index) => (
              <motion.div
                key={delivery.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
                data-testid={`delivery-card-${delivery.id}`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        {/* Tracking Number */}
                        {delivery.tracking_number && (
                          <p className="text-xs font-mono text-sky-600 mb-1">{delivery.tracking_number}</p>
                        )}
                        <div className="flex items-center gap-2 mb-1">
                          <User className="w-4 h-4 text-slate-400" />
                          <span className="font-semibold text-slate-900">{delivery.nom}</span>
                          <Badge className={getStatusColor(delivery.status)}>
                            {getStatusLabel(delivery.status)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Phone className="w-4 h-4" />
                          {delivery.telephone}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          delivery.urgence === "urgent" ? "bg-red-100 text-red-700" :
                          delivery.urgence === "express" ? "bg-amber-100 text-amber-700" :
                          "bg-slate-100 text-slate-600"
                        }`}>
                          {delivery.urgence}
                        </span>
                        {delivery.prix_total && (
                          <p className="text-sm font-semibold text-green-600 mt-1">
                            {delivery.prix_total.toLocaleString()} FCFA
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-3 mb-4">
                      <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl">
                        <MapPin className="w-4 h-4 text-sky-500 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500">Enlèvement</p>
                          <p className="text-sm font-medium text-slate-900">{delivery.zone_enlevement}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl">
                        <MapPin className="w-4 h-4 text-green-500 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500">Livraison</p>
                          <p className="text-sm font-medium text-slate-900">{delivery.zone_livraison}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 text-sm text-slate-600">
                      <span className="bg-slate-100 px-2 py-1 rounded">
                        <Package className="w-3 h-3 inline mr-1" />
                        {delivery.type_colis}
                      </span>
                      {delivery.livreur_nom && (
                        <span className="bg-sky-50 text-sky-700 px-2 py-1 rounded">
                          Livreur: {delivery.livreur_nom}
                        </span>
                      )}
                      {delivery.notes && (
                        <span className="bg-slate-100 px-2 py-1 rounded">
                          <MessageSquare className="w-3 h-3 inline mr-1" />
                          {delivery.notes}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status indicator */}
                  <div className="lg:w-36">
                    {delivery.status === "livre" && (
                      <div className="text-center p-3 bg-green-50 rounded-xl">
                        <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-1" />
                        <p className="text-sm text-green-700 font-medium">Livrée</p>
                        {delivery.completed_at && (
                          <p className="text-xs text-green-600 mt-1">
                            {new Date(delivery.completed_at).toLocaleDateString("fr-FR")}
                          </p>
                        )}
                      </div>
                    )}
                    {delivery.status === "echec" && (
                      <div className="text-center p-3 bg-red-50 rounded-xl">
                        <XCircle className="w-6 h-6 text-red-500 mx-auto mb-1" />
                        <p className="text-sm text-red-700 font-medium">Échec</p>
                      </div>
                    )}
                    {delivery.status === "en_cours" && (
                      <div className="text-center p-3 bg-sky-50 rounded-xl">
                        <Clock className="w-6 h-6 text-sky-500 mx-auto mb-1 animate-pulse" />
                        <p className="text-sm text-sky-700 font-medium">En cours</p>
                      </div>
                    )}
                    {delivery.status === "nouveau" && (
                      <div className="text-center p-3 bg-blue-50 rounded-xl">
                        <Clock className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                        <p className="text-sm text-blue-700 font-medium">En attente</p>
                      </div>
                    )}
                    {delivery.status === "assigne" && (
                      <div className="text-center p-3 bg-amber-50 rounded-xl">
                        <User className="w-6 h-6 text-amber-500 mx-auto mb-1" />
                        <p className="text-sm text-amber-700 font-medium">Assigné</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* New Delivery Modal */}
      {showNewForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto" data-testid="new-delivery-modal">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-lg w-full my-8"
          >
            <h3 className="text-xl font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-sky-500" />
              Nouvelle commande
            </h3>
            <form onSubmit={handleSubmitNewDelivery} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <Label htmlFor="nom_client">Nom du client *</Label>
                  <Input
                    id="nom_client"
                    name="nom_client"
                    value={newDelivery.nom_client}
                    onChange={handleNewDeliveryChange}
                    placeholder="Nom complet"
                    className="rounded-xl mt-1"
                    required
                    data-testid="input-nom-client"
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <Label htmlFor="telephone_client">Téléphone *</Label>
                  <Input
                    id="telephone_client"
                    name="telephone_client"
                    value={newDelivery.telephone_client}
                    onChange={handleNewDeliveryChange}
                    placeholder="+229 97 00 11 22"
                    className="rounded-xl mt-1"
                    required
                    data-testid="input-telephone-client"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="zone_enlevement">Zone d'enlèvement *</Label>
                  <select
                    id="zone_enlevement"
                    name="zone_enlevement"
                    value={newDelivery.zone_enlevement}
                    onChange={handleNewDeliveryChange}
                    className="w-full mt-1 p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                    data-testid="select-zone-enlevement"
                  >
                    <option value="">Sélectionner</option>
                    {pickupZones.map(zone => (
                      <option key={zone} value={zone}>{zone}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="zone_livraison">Zone de livraison *</Label>
                  <select
                    id="zone_livraison_id"
                    name="zone_livraison_id"
                    value={newDelivery.zone_livraison_id}
                    onChange={(e) => handleZoneSelect(e.target.value)}
                    className="w-full mt-1 p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                    data-testid="select-zone-livraison"
                  >
                    <option value="">Sélectionner</option>
                    {availableZones.map(zone => (
                      <option key={zone.id} value={zone.id}>{zone.nom} - {zone.prix_base.toLocaleString()} FCFA</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="type_colis">Type de colis *</Label>
                  <select
                    id="type_colis"
                    name="type_colis"
                    value={newDelivery.type_colis}
                    onChange={handleNewDeliveryChange}
                    className="w-full mt-1 p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                    data-testid="select-type-colis"
                  >
                    {typesColis.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="urgence">Urgence *</Label>
                  <select
                    id="urgence"
                    name="urgence"
                    value={newDelivery.urgence}
                    onChange={handleNewDeliveryChange}
                    className="w-full mt-1 p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                    data-testid="select-urgence"
                  >
                    {urgences.map(u => (
                      <option key={u.value} value={u.value}>{u.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="poids">Poids (kg)</Label>
                  <div className="relative">
                    <Scale className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 mt-0.5" />
                    <Input
                      id="poids"
                      name="poids"
                      type="number"
                      step="0.1"
                      min="0"
                      value={newDelivery.poids}
                      onChange={handleNewDeliveryChange}
                      placeholder="Ex: 2.5"
                      className="rounded-xl mt-1 pl-9"
                      data-testid="input-poids"
                    />
                  </div>
                </div>
              </div>

              {/* Estimated Price */}
              {estimatedPrice && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center justify-between">
                  <span className="text-sm text-green-600">Prix estimé</span>
                  <span className="text-lg font-bold text-green-700">{estimatedPrice.toLocaleString()} FCFA</span>
                </div>
              )}
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes (optionnel)</Label>
                <textarea
                  id="notes"
                  name="notes"
                  value={newDelivery.notes}
                  onChange={handleNewDeliveryChange}
                  placeholder="Instructions spéciales..."
                  className="w-full mt-1 p-3 border border-slate-200 rounded-xl resize-none h-20 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  data-testid="textarea-notes"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  onClick={() => setShowNewForm(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-sky-500 hover:bg-sky-600"
                  disabled={formLoading}
                  data-testid="submit-new-delivery-btn"
                >
                  {formLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Créer la commande
                    </>
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
