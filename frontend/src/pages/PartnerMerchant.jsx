import { useState } from "react";
import { motion } from "framer-motion";
import { Store, CheckCircle, Loader2 } from "lucide-react";
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

export default function PartnerMerchant() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    nom_entreprise: "",
    nom_contact: "",
    telephone: "",
    email: "",
    adresse: "",
    type_produits: "",
    volume_mensuel: "",
    message: ""
  });

  const productTypes = [
    "Alimentation",
    "Vêtements & Mode",
    "Électronique",
    "Cosmétiques",
    "Artisanat",
    "Autre"
  ];

  const volumes = [
    { value: "1-10", label: "1 à 10 livraisons/mois" },
    { value: "10-50", label: "10 à 50 livraisons/mois" },
    { value: "50-100", label: "50 à 100 livraisons/mois" },
    { value: "100+", label: "Plus de 100 livraisons/mois" }
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nom_entreprise || !formData.nom_contact || !formData.telephone || 
        !formData.email || !formData.adresse || !formData.type_produits || !formData.volume_mensuel) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/merchants`, formData);
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
      <div className="min-h-[80vh] flex items-center justify-center" data-testid="merchant-success">
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
    <div className="overflow-hidden" data-testid="partner-merchant-page">
      {/* Hero Section */}
      <section className="section-padding bg-slate-50">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="text-sky-500 font-medium text-sm uppercase tracking-wider">Partenariat</span>
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-slate-900 mt-2 mb-4">
              Devenir commerçant partenaire
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed">
              Rejoignez notre réseau de commerçants partenaires et bénéficiez de tarifs préférentiels 
              pour la livraison de vos produits.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { title: "Tarifs préférentiels", desc: "Jusqu'à 20% de réduction sur vos livraisons" },
              { title: "Service prioritaire", desc: "Vos livraisons traitées en priorité" },
              { title: "Facturation mensuelle", desc: "Simplifiez votre gestion avec une facture unique" }
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
                  <Store className="w-6 h-6 text-sky-500" />
                </div>
                <div>
                  <h2 className="font-heading font-semibold text-lg text-slate-900">
                    Formulaire de candidature
                  </h2>
                  <p className="text-sm text-slate-500">Tous les champs marqués * sont obligatoires</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5" data-testid="merchant-form">
                {/* Business Info */}
                <div>
                  <Label htmlFor="nom_entreprise" className="text-slate-700 mb-2 block">
                    Nom de l&apos;entreprise *
                  </Label>
                  <Input
                    id="nom_entreprise"
                    name="nom_entreprise"
                    value={formData.nom_entreprise}
                    onChange={handleChange}
                    placeholder="Ma Boutique"
                    className="rounded-xl h-12"
                    data-testid="merchant-nom-entreprise-input"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <Label htmlFor="nom_contact" className="text-slate-700 mb-2 block">
                      Nom du contact *
                    </Label>
                    <Input
                      id="nom_contact"
                      name="nom_contact"
                      value={formData.nom_contact}
                      onChange={handleChange}
                      placeholder="Jean Dupont"
                      className="rounded-xl h-12"
                      data-testid="merchant-nom-contact-input"
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
                      data-testid="merchant-telephone-input"
                    />
                  </div>
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
                    placeholder="contact@maboutique.com"
                    className="rounded-xl h-12"
                    data-testid="merchant-email-input"
                  />
                </div>

                <div>
                  <Label htmlFor="adresse" className="text-slate-700 mb-2 block">
                    Adresse de l&apos;entreprise *
                  </Label>
                  <Input
                    id="adresse"
                    name="adresse"
                    value={formData.adresse}
                    onChange={handleChange}
                    placeholder="Quartier, Ville"
                    className="rounded-xl h-12"
                    data-testid="merchant-adresse-input"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <Label className="text-slate-700 mb-2 block">
                      Type de produits *
                    </Label>
                    <Select
                      value={formData.type_produits}
                      onValueChange={(value) => handleSelectChange("type_produits", value)}
                    >
                      <SelectTrigger className="rounded-xl h-12" data-testid="merchant-type-produits-select">
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {productTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-slate-700 mb-2 block">
                      Volume mensuel estimé *
                    </Label>
                    <Select
                      value={formData.volume_mensuel}
                      onValueChange={(value) => handleSelectChange("volume_mensuel", value)}
                    >
                      <SelectTrigger className="rounded-xl h-12" data-testid="merchant-volume-select">
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {volumes.map((vol) => (
                          <SelectItem key={vol.value} value={vol.value}>
                            {vol.label}
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
                    placeholder="Dites-nous en plus sur votre activité..."
                    className="rounded-xl min-h-[100px]"
                    data-testid="merchant-message-input"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-sky-500 hover:bg-sky-600 text-white rounded-full h-12 mt-6"
                  data-testid="merchant-submit-btn"
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
