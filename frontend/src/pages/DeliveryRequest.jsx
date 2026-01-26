import { useState } from "react";
import { motion } from "framer-motion";
import { Package, Truck, CheckCircle, Loader2 } from "lucide-react";
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

export default function DeliveryRequest() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    nom: "",
    telephone: "",
    zone_enlevement: "",
    zone_livraison: "",
    type_colis: "",
    urgence: "",
    notes: ""
  });

  const zones = [
    "Cotonou - Centre",
    "Cotonou - Akpakpa",
    "Cotonou - Fidjrossè",
    "Cotonou - Cadjèhoun",
    "Cotonou - Zogbo",
    "Calavi - Centre",
    "Calavi - Godomey",
    "Calavi - Abomey-Calavi",
    "Porto-Novo - Centre",
    "Porto-Novo - Ouando"
  ];

  const packageTypes = [
    { value: "documents", label: "Documents (< 1 kg)" },
    { value: "petit_colis", label: "Petit colis (1 - 5 kg)" },
    { value: "colis_moyen", label: "Colis moyen (5 - 15 kg)" },
    { value: "grand_colis", label: "Grand colis (15 - 30 kg)" }
  ];

  const urgencyLevels = [
    { value: "standard", label: "Standard (24 - 48h)" },
    { value: "express", label: "Express (même jour)" },
    { value: "urgent", label: "Urgent (2 - 4h)" }
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nom || !formData.telephone || !formData.zone_enlevement || 
        !formData.zone_livraison || !formData.type_colis || !formData.urgence) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/delivery-requests`, formData);
      setSuccess(true);
      toast.success("Demande envoyée avec succès !");
    } catch (error) {
      toast.error("Erreur lors de l'envoi de la demande");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center" data-testid="delivery-success">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md mx-auto px-4"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-slate-900 mb-4">
            Demande envoyée !
          </h1>
          <p className="text-slate-600 mb-6">
            Merci pour votre demande. Notre équipe vous contactera très rapidement pour confirmer les détails et le tarif de votre livraison.
          </p>
          <Button
            onClick={() => {
              setSuccess(false);
              setFormData({
                nom: "",
                telephone: "",
                zone_enlevement: "",
                zone_livraison: "",
                type_colis: "",
                urgence: "",
                notes: ""
              });
            }}
            className="bg-sky-500 hover:bg-sky-600 text-white rounded-full"
            data-testid="new-request-btn"
          >
            Nouvelle demande
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden" data-testid="delivery-request-page">
      {/* Hero Section */}
      <section className="section-padding bg-slate-50">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="text-sky-500 font-medium text-sm uppercase tracking-wider">Nouveau</span>
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-slate-900 mt-2 mb-4">
              Demander une livraison
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed">
              Remplissez ce formulaire pour demander une livraison. Notre équipe vous contactera 
              rapidement pour confirmer les détails.
            </p>
          </motion.div>
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
                  <Package className="w-6 h-6 text-sky-500" />
                </div>
                <div>
                  <h2 className="font-heading font-semibold text-lg text-slate-900">
                    Informations de livraison
                  </h2>
                  <p className="text-sm text-slate-500">Tous les champs marqués * sont obligatoires</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5" data-testid="delivery-form">
                {/* Personal Info */}
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <Label htmlFor="nom" className="text-slate-700 mb-2 block">
                      Votre nom *
                    </Label>
                    <Input
                      id="nom"
                      name="nom"
                      value={formData.nom}
                      onChange={handleChange}
                      placeholder="Jean Dupont"
                      className="rounded-xl h-12"
                      data-testid="delivery-nom-input"
                    />
                  </div>
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
                      data-testid="delivery-telephone-input"
                    />
                  </div>
                </div>

                {/* Zones */}
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <Label className="text-slate-700 mb-2 block">
                      Zone d&apos;enlèvement *
                    </Label>
                    <Select
                      value={formData.zone_enlevement}
                      onValueChange={(value) => handleSelectChange("zone_enlevement", value)}
                    >
                      <SelectTrigger className="rounded-xl h-12" data-testid="delivery-zone-enlevement-select">
                        <SelectValue placeholder="Sélectionner une zone" />
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
                      Zone de livraison *
                    </Label>
                    <Select
                      value={formData.zone_livraison}
                      onValueChange={(value) => handleSelectChange("zone_livraison", value)}
                    >
                      <SelectTrigger className="rounded-xl h-12" data-testid="delivery-zone-livraison-select">
                        <SelectValue placeholder="Sélectionner une zone" />
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
                </div>

                {/* Package & Urgency */}
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <Label className="text-slate-700 mb-2 block">
                      Type de colis *
                    </Label>
                    <Select
                      value={formData.type_colis}
                      onValueChange={(value) => handleSelectChange("type_colis", value)}
                    >
                      <SelectTrigger className="rounded-xl h-12" data-testid="delivery-type-colis-select">
                        <SelectValue placeholder="Sélectionner un type" />
                      </SelectTrigger>
                      <SelectContent>
                        {packageTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-slate-700 mb-2 block">
                      Niveau d&apos;urgence *
                    </Label>
                    <Select
                      value={formData.urgence}
                      onValueChange={(value) => handleSelectChange("urgence", value)}
                    >
                      <SelectTrigger className="rounded-xl h-12" data-testid="delivery-urgence-select">
                        <SelectValue placeholder="Sélectionner un niveau" />
                      </SelectTrigger>
                      <SelectContent>
                        {urgencyLevels.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <Label htmlFor="notes" className="text-slate-700 mb-2 block">
                    Notes supplémentaires
                  </Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Informations complémentaires sur votre colis, instructions spéciales..."
                    className="rounded-xl min-h-[100px]"
                    data-testid="delivery-notes-input"
                  />
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-sky-500 hover:bg-sky-600 text-white rounded-full h-12 mt-6"
                  data-testid="delivery-submit-btn"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Truck className="w-4 h-4 mr-2" />
                      Envoyer ma demande
                    </>
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
