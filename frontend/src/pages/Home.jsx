import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Truck, Package, Clock, MapPin, CheckCircle, ArrowRight, Star, Shield, Users, Search, Loader2, AlertCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function Home() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingResult, setTrackingResult] = useState(null);
  const [trackingError, setTrackingError] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  const handleTrackingSearch = async (e) => {
    e.preventDefault();
    if (!trackingNumber.trim()) return;
    
    setTrackingLoading(true);
    setTrackingError(null);
    setTrackingResult(null);
    
    try {
      const response = await fetch(`${API_URL}/api/track/${trackingNumber.trim()}`);
      const data = await response.json();
      
      if (!response.ok) {
        setTrackingError(data.detail || "Numéro introuvable");
      } else {
        setTrackingResult(data);
      }
    } catch (error) {
      setTrackingError("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setTrackingLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      nouveau: "bg-blue-100 text-blue-700 border-blue-200",
      assigne: "bg-amber-100 text-amber-700 border-amber-200",
      en_cours: "bg-sky-100 text-sky-700 border-sky-200",
      livre: "bg-green-100 text-green-700 border-green-200",
      echec: "bg-red-100 text-red-700 border-red-200",
      annule: "bg-slate-100 text-slate-700 border-slate-200"
    };
    return colors[status] || "bg-slate-100 text-slate-700";
  };

  const features = [
    {
      icon: <Truck className="w-6 h-6" />,
      title: "Livraison rapide",
      description: "Vos colis livrés dans les meilleurs délais à travers Cotonou, Porto-Novo et Calavi."
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Sécurité garantie",
      description: "Vos marchandises sont entre de bonnes mains avec notre équipe de livreurs professionnels."
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Service flexible",
      description: "Livraison standard, express ou urgente selon vos besoins et votre budget."
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: "Couverture étendue",
      description: "Nous couvrons les principales villes du Bénin : Cotonou, Porto-Novo, Calavi."
    }
  ];

  const stats = [
    { number: "500+", label: "Livraisons effectuées" },
    { number: "50+", label: "Commerçants partenaires" },
    { number: "98%", label: "Clients satisfaits" },
    { number: "24h", label: "Délai moyen" }
  ];

  const zones = ["Cotonou", "Porto-Novo", "Calavi", "Abomey-Calavi", "Godomey", "Akpakpa"];

  return (
    <div className="overflow-hidden" data-testid="home-page">
      {/* Hero Section */}
      <section className="relative hero-pattern min-h-[90vh] flex items-center">
        <div className="absolute inset-0 overflow-hidden">
          <div className="gradient-blob w-96 h-96 bg-sky-400 top-20 -left-20"></div>
          <div className="gradient-blob w-80 h-80 bg-sky-300 bottom-20 right-10"></div>
        </div>
        
        <div className="container-custom relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-sky-50 text-sky-600 rounded-full text-sm font-medium">
                <Truck className="w-4 h-4" />
                Service de livraison au Bénin
              </span>
              
              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight">
                Vos livraisons,<br />
                <span className="text-sky-500">simplifiées</span>
              </h1>
              
              <p className="text-lg text-slate-600 max-w-lg leading-relaxed">
                PLB Logistique est votre partenaire de confiance pour la livraison de colis à Cotonou, 
                Porto-Novo et Calavi. Rapide, fiable et à votre service.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/demande-livraison">
                  <Button className="bg-sky-500 hover:bg-sky-600 text-white rounded-full px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all" data-testid="hero-cta-btn">
                    Demander une livraison
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/comment-ca-marche">
                  <Button variant="outline" className="rounded-full px-8 py-6 text-lg border-slate-200 hover:bg-slate-50" data-testid="hero-secondary-btn">
                    Comment ça marche
                  </Button>
                </Link>
              </div>
              
              <div className="flex items-center gap-6 pt-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center">
                      <Users className="w-5 h-5 text-slate-500" />
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-slate-600">Plus de 500 clients satisfaits</p>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="relative">
                <img
                  src="https://images.pexels.com/photos/12725436/pexels-photo-12725436.jpeg"
                  alt="Livreur PLB Logistique"
                  className="w-full h-[500px] object-cover rounded-3xl shadow-2xl"
                />
                <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl p-4 shadow-lg border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Livraison confirmée</p>
                      <p className="text-sm text-slate-500">Il y a 2 minutes</p>
                    </div>
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 bg-white rounded-2xl p-4 shadow-lg border border-slate-100">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-sky-500" />
                    <span className="font-semibold text-slate-900">En route...</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Tracking Section */}
      <section className="py-12 bg-gradient-to-br from-sky-500 to-sky-600" data-testid="tracking-section">
        <div className="container-custom">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Suivez votre colis
            </h2>
            <p className="text-sky-100 mb-6">
              Entrez votre numéro de suivi pour connaître l'état de votre livraison
            </p>
            
            <form onSubmit={handleTrackingSearch} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
                  placeholder="PLB-2026-000001"
                  className="pl-12 h-14 text-lg rounded-xl bg-white border-0"
                  data-testid="tracking-input"
                />
              </div>
              <Button 
                type="submit" 
                className="h-14 px-8 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-lg"
                disabled={trackingLoading}
                data-testid="tracking-submit-btn"
              >
                {trackingLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Rechercher"
                )}
              </Button>
            </form>
            
            {/* Tracking Result */}
            {trackingError && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 bg-white/10 backdrop-blur rounded-xl p-4 text-left max-w-xl mx-auto"
                data-testid="tracking-error"
              >
                <div className="flex items-center gap-3 text-white">
                  <AlertCircle className="w-5 h-5" />
                  <span>{trackingError}</span>
                </div>
              </motion.div>
            )}
            
            {trackingResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 bg-white rounded-xl p-6 text-left max-w-xl mx-auto shadow-lg"
                data-testid="tracking-result"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-slate-500">Numéro de suivi</p>
                    <p className="text-xl font-bold text-slate-900">{trackingResult.tracking_number}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(trackingResult.status)}`}>
                    {trackingResult.status_label}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">Enlèvement</p>
                    <p className="font-medium text-slate-900 flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-sky-500" />
                      {trackingResult.zone_enlevement}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">Livraison</p>
                    <p className="font-medium text-slate-900 flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-green-500" />
                      {trackingResult.zone_livraison}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-slate-500 pt-3 border-t">
                  <span>Créé le {new Date(trackingResult.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span>
                  <span>Mis à jour: {new Date(trackingResult.last_status_update).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                
                {trackingResult.delivery_notes && (
                  <div className="mt-3 p-3 bg-amber-50 rounded-lg text-sm text-amber-800">
                    <strong>Note:</strong> {trackingResult.delivery_notes}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-slate-50">
        <div className="container-custom">
          <motion.div
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="text-center"
              >
                <p className="stat-number">{stat.number}</p>
                <p className="text-slate-600 mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section-padding" data-testid="features-section">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-sky-500 font-medium text-sm uppercase tracking-wider">Nos avantages</span>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-slate-900 mt-2">
              Pourquoi choisir PLB Logistique ?
            </h2>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="feature-card group"
                data-testid={`feature-card-${index}`}
              >
                <div className="w-12 h-12 bg-sky-50 rounded-xl flex items-center justify-center text-sky-500 mb-4 group-hover:bg-sky-500 group-hover:text-white transition-colors">
                  {feature.icon}
                </div>
                <h3 className="font-heading font-semibold text-lg text-slate-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Zones Section */}
      <section className="section-padding bg-slate-50">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-sky-500 font-medium text-sm uppercase tracking-wider">Couverture</span>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-slate-900 mt-2 mb-4">
                Zones de livraison
              </h2>
              <p className="text-slate-600 mb-6 leading-relaxed">
                Nous assurons la livraison de vos colis dans les principales villes et quartiers du Bénin. 
                Notre réseau s&apos;étend continuellement pour mieux vous servir.
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                {zones.map((zone) => (
                  <span key={zone} className="zone-badge">
                    <MapPin className="w-3 h-3 mr-1" />
                    {zone}
                  </span>
                ))}
              </div>
              <Link to="/demande-livraison">
                <Button className="bg-sky-500 hover:bg-sky-600 text-white rounded-full px-6">
                  Commander maintenant
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <img
                src="https://images.unsplash.com/photo-1701943896527-334158c81021?w=800"
                alt="Livraison de colis"
                className="w-full h-80 object-cover rounded-3xl"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-sky-500 rounded-3xl p-8 md:p-12 text-center text-white relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-sky-400 to-sky-600"></div>
            <div className="relative z-10">
              <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
                Prêt à expédier ?
              </h2>
              <p className="text-sky-100 max-w-2xl mx-auto mb-8">
                Faites confiance à PLB Logistique pour vos livraisons. Simple, rapide et fiable.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/demande-livraison">
                  <Button className="bg-white text-sky-600 hover:bg-sky-50 rounded-full px-8 py-6 text-lg font-semibold" data-testid="cta-delivery-btn">
                    Demander une livraison
                  </Button>
                </Link>
                <Link to="/devenir-partenaire/commercant">
                  <Button variant="outline" className="border-white text-white hover:bg-white/10 rounded-full px-8 py-6 text-lg" data-testid="cta-partner-btn">
                    Devenir partenaire
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="section-padding bg-slate-50">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-sky-500 font-medium text-sm uppercase tracking-wider">Témoignages</span>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-slate-900 mt-2">
              Ce que disent nos clients
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Aïcha K.",
                role: "Commerçante, Cotonou",
                text: "PLB Logistique a transformé mon business. Mes clients reçoivent leurs commandes rapidement et en parfait état."
              },
              {
                name: "Emmanuel D.",
                role: "Entrepreneur, Porto-Novo",
                text: "Service fiable et professionnel. Je recommande PLB Logistique à tous mes collègues entrepreneurs."
              },
              {
                name: "Fatou S.",
                role: "Particulier, Calavi",
                text: "Excellent service client et livraison ponctuelle. Je suis vraiment satisfaite de leur prestation."
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 border border-slate-100 shadow-soft"
              >
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-600 mb-4 leading-relaxed">&ldquo;{testimonial.text}&rdquo;</p>
                <div>
                  <p className="font-semibold text-slate-900">{testimonial.name}</p>
                  <p className="text-sm text-slate-500">{testimonial.role}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-8"
          >
            <Link to="/donner-avis">
              <Button variant="outline" className="rounded-full border-slate-200" data-testid="give-feedback-btn">
                Donner votre avis
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
