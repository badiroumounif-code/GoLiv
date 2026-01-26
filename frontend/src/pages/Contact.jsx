import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Clock, Send, Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Contact() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    sujet: "",
    message: ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nom || !formData.email || !formData.sujet || !formData.message) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/contact`, formData);
      toast.success("Message envoyé avec succès !");
      setFormData({ nom: "", email: "", sujet: "", message: "" });
    } catch (error) {
      toast.error("Erreur lors de l'envoi du message");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const contactInfo = [
    {
      icon: <MapPin className="w-5 h-5" />,
      title: "Adresse",
      content: "Cotonou, Porto-Novo, Calavi\nBénin"
    },
    {
      icon: <Phone className="w-5 h-5" />,
      title: "Téléphone",
      content: "+229 XX XX XX XX"
    },
    {
      icon: <Mail className="w-5 h-5" />,
      title: "Email",
      content: "contact@plblogistique.com"
    },
    {
      icon: <Clock className="w-5 h-5" />,
      title: "Horaires",
      content: "Lun - Sam: 7h - 20h\nDimanche: 8h - 18h"
    }
  ];

  return (
    <div className="overflow-hidden" data-testid="contact-page">
      {/* Hero Section */}
      <section className="section-padding bg-slate-50">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="text-sky-500 font-medium text-sm uppercase tracking-wider">Contact</span>
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-slate-900 mt-2 mb-4">
              Contactez-nous
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed">
              Une question ? Un besoin particulier ? N&apos;hésitez pas à nous contacter. 
              Notre équipe est à votre disposition.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-heading text-2xl font-bold text-slate-900 mb-6">
                Informations de contact
              </h2>
              
              <div className="space-y-6">
                {contactInfo.map((info, index) => (
                  <div key={index} className="flex items-start gap-4" data-testid={`contact-info-${index}`}>
                    <div className="w-12 h-12 bg-sky-50 rounded-xl flex items-center justify-center text-sky-500 flex-shrink-0">
                      {info.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">{info.title}</h3>
                      <p className="text-slate-600 whitespace-pre-line">{info.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-6 bg-sky-50 rounded-2xl">
                <h3 className="font-heading font-semibold text-lg text-slate-900 mb-2">
                  Besoin d&apos;une réponse rapide ?
                </h3>
                <p className="text-slate-600 text-sm mb-4">
                  Appelez-nous directement ou envoyez-nous un message WhatsApp pour une réponse immédiate.
                </p>
                <Button className="bg-green-500 hover:bg-green-600 text-white rounded-full" data-testid="whatsapp-btn">
                  <Phone className="w-4 h-4 mr-2" />
                  Appeler maintenant
                </Button>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-soft">
                <h2 className="font-heading text-2xl font-bold text-slate-900 mb-6">
                  Envoyez-nous un message
                </h2>

                <form onSubmit={handleSubmit} className="space-y-5" data-testid="contact-form">
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
                      data-testid="contact-nom-input"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-slate-700 mb-2 block">
                      Votre email *
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="jean@exemple.com"
                      className="rounded-xl h-12"
                      data-testid="contact-email-input"
                    />
                  </div>

                  <div>
                    <Label htmlFor="sujet" className="text-slate-700 mb-2 block">
                      Sujet *
                    </Label>
                    <Input
                      id="sujet"
                      name="sujet"
                      value={formData.sujet}
                      onChange={handleChange}
                      placeholder="Question sur vos services"
                      className="rounded-xl h-12"
                      data-testid="contact-sujet-input"
                    />
                  </div>

                  <div>
                    <Label htmlFor="message" className="text-slate-700 mb-2 block">
                      Votre message *
                    </Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Décrivez votre demande..."
                      className="rounded-xl min-h-[120px]"
                      data-testid="contact-message-input"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-sky-500 hover:bg-sky-600 text-white rounded-full h-12"
                    data-testid="contact-submit-btn"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Envoyer le message
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
