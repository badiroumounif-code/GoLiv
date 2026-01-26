import { useState } from "react";
import { motion } from "framer-motion";
import { Bike, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function PartnerRider() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    telephone: "",
    email: "",
    zone_couverture: "",
    type_vehicule: "",
    experience: "",
    disponibilite: "",
    message: ""
  });

  const zones = [
    "Cotonou",
    "Porto-Novo",
    "Calavi",
    "Plusieurs zones"
  ];

  const vehicleTypes = [
    { value: "moto", label: "Moto" },
    { value: "velo", label: "Vélo" },
    { value: "tricycle", label: "Tricycle" },
    { value: "voiture", label: "Voiture" }
  ];

  const experienceLevels = [
    { value: "debutant", label: "Débutant (< 1 an)" },
    { value: "intermediaire", label: "Intermédiaire (1-3 ans)" },
    { value: "experimente", label: "Expérimenté (> 3 ans)" }
  ];

  const availabilities = [
    { value: "temps_plein", label: "Temps plein" },
    { value: "temps_partiel", label: "Temps partiel" },
    { value: "weekend", label: "Week-ends uniquement" },
    { value: "flexible", label: "Flexible" }
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nom || !formData.prenom || !formData.telephone || 
        !formData.email || !formData.zone_couverture || !formData.type_vehicule ||
        !formData.experience || !formData.disponibilite) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/riders`, formData);
      setSuccess(true);
      toast.success("Candidature envoyée avec succès !");
    } catch (error) {
      toast.error("Erreur lors de l'envoi de votre candidature");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center" data-testid="rider-success">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md mx-auto px-4"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-slate-900 mb-4">
            Candidature envoyée !
          </h1>
          <p className="text-slate-600 mb-6">
            Merci pour votre intérêt ! Notre équipe examinera votre candidature et vous contactera dans les plus brefs délais.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden" data-testid="partner-rider-page">
      {/* Hero Section */}
      <section className="section-padding bg-slate-50">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="text-sky-500 font-medium text-sm uppercase tracking-wider">Recrutement</span>
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-slate-900 mt-2 mb-4">
              Devenir livreur partenaire
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed">
              Rejoignez notre équipe de livreurs et gagnez de l&apos;argent en livrant des colis 
              dans votre zone. Horaires flexibles et rémunération attractive.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { title: "Horaires flexibles", desc: "Travaillez selon votre disponibilité" },
              { title: "Rémunération attractive", desc: "Gagnez par livraison effectuée" },
              { title: "Formation incluse", desc: "Nous vous formons à nos standards" }
            ].map((benefit, index) => (
              <div key={index} className="text-center p-4">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <h3 className="font-semibold text-slate-900">{benefit.title}</h3>
                <p className="text-sm text-slate-600">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-8 border border-slate-100 shadow-soft"
            >
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
                <div className="w-12 h-12 bg-sky-50 rounded-xl flex items-center justify-center">
                  <Bike className="w-6 h-6 text-sky-500" />
                </div>
                <div>
                  <h2 className="font-heading font-semibold text-lg text-slate-900">
                    Formulaire de candidature
                  </h2>
                  <p className="text-sm text-slate-500">Tous les champs marqués * sont obligatoires</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5" data-testid="rider-form">
                {/* Personal Info */}
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <Label htmlFor="prenom" className="text-slate-700 mb-2 block">
                      Prénom *
                    </Label>
                    <Input
                      id="prenom"
                      name="prenom"
                      value={formData.prenom}
                      onChange={handleChange}
                      placeholder="Jean"
                      className="rounded-xl h-12"
                      data-testid="rider-prenom-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="nom" className="text-slate-700 mb-2 block">
                      Nom *
                    </Label>
                    <Input
                      id="nom"
                      name="nom"
                      value={formData.nom}
                      onChange={handleChange}
                      placeholder="Dupont"
                      className="rounded-xl h-12"
                      data-testid="rider-nom-input"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <Label htmlFor="telephone" className="text-slate-700 mb-2 block">
                      Téléphone *
                    </Label>
                    <Input
                      id="telephone"
                      name="telephone"
                      value={formData.telephone}
                      onChange={handleChange}
                      placeholder="+229 XX XX XX XX"
                      className="rounded-xl h-12"
                      data-testid="rider-telephone-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-slate-700 mb-2 block">
                      Email *
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="jean@exemple.com"
                      className="rounded-xl h-12"
                      data-testid="rider-email-input"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <Label className="text-slate-700 mb-2 block">
                      Zone de couverture *
                    </Label>
                    <Select
                      value={formData.zone_couverture}
                      onValueChange={(value) => handleSelectChange("zone_couverture", value)}
                    >
                      <SelectTrigger className="rounded-xl h-12" data-testid="rider-zone-select">
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {zones.map((zone) => (
                          <SelectItem key={zone} value={zone}>
                            {zone}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-slate-700 mb-2 block">
                      Type de véhicule *
                    </Label>
                    <Select
                      value={formData.type_vehicule}
                      onValueChange={(value) => handleSelectChange("type_vehicule", value)}
                    >
                      <SelectTrigger className="rounded-xl h-12" data-testid="rider-vehicule-select">
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicleTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <Label className="text-slate-700 mb-2 block">
                      Expérience en livraison *
                    </Label>
                    <Select
                      value={formData.experience}
                      onValueChange={(value) => handleSelectChange("experience", value)}
                    >
                      <SelectTrigger className="rounded-xl h-12" data-testid="rider-experience-select">
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {experienceLevels.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-slate-700 mb-2 block">
                      Disponibilité *
                    </Label>
                    <Select
                      value={formData.disponibilite}
                      onValueChange={(value) => handleSelectChange("disponibilite", value)}
                    >
                      <SelectTrigger className="rounded-xl h-12" data-testid="rider-disponibilite-select">
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {availabilities.map((avail) => (
                          <SelectItem key={avail.value} value={avail.value}>
                            {avail.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="message" className="text-slate-700 mb-2 block">
                    Message (optionnel)
                  </Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Présentez-vous brièvement..."
                    className="rounded-xl min-h-[100px]"
                    data-testid="rider-message-input"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-sky-500 hover:bg-sky-600 text-white rounded-full h-12 mt-6"
                  data-testid="rider-submit-btn"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    "Envoyer ma candidature"
                  )}
                </Button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
