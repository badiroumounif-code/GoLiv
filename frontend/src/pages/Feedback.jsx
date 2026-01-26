import { useState } from "react";
import { motion } from "framer-motion";
import { Star, MessageSquare, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Feedback() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [formData, setFormData] = useState({
    nom: "",
    telephone: "",
    commentaire: "",
    problemes: ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nom || !formData.telephone || !formData.commentaire || rating === 0) {
      toast.error("Veuillez remplir tous les champs obligatoires et donner une note");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/feedback`, {
        ...formData,
        note: rating
      });
      setSuccess(true);
      toast.success("Merci pour votre avis !");
    } catch (error) {
      toast.error("Erreur lors de l'envoi de votre avis");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center" data-testid="feedback-success">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md mx-auto px-4"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-slate-900 mb-4">
            Merci pour votre avis !
          </h1>
          <p className="text-slate-600 mb-6">
            Votre retour nous aide à améliorer nos services. Nous apprécions votre confiance et votre temps.
          </p>
          <Button
            onClick={() => {
              setSuccess(false);
              setRating(0);
              setFormData({
                nom: "",
                telephone: "",
                commentaire: "",
                problemes: ""
              });
            }}
            variant="outline"
            className="rounded-full"
            data-testid="new-feedback-btn"
          >
            Donner un autre avis
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden" data-testid="feedback-page">
      {/* Hero Section */}
      <section className="section-padding bg-slate-50">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="text-sky-500 font-medium text-sm uppercase tracking-wider">Votre avis</span>
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-slate-900 mt-2 mb-4">
              Donnez votre avis
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed">
              Votre retour d&apos;expérience nous aide à améliorer nos services. 
              Partagez votre expérience avec PLB Logistique.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Form Section */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="max-w-xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-8 border border-slate-100 shadow-soft"
            >
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
                <div className="w-12 h-12 bg-sky-50 rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-sky-500" />
                </div>
                <div>
                  <h2 className="font-heading font-semibold text-lg text-slate-900">
                    Votre expérience
                  </h2>
                  <p className="text-sm text-slate-500">Partagez votre avis sur notre service</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5" data-testid="feedback-form">
                {/* Rating */}
                <div>
                  <Label className="text-slate-700 mb-3 block">
                    Votre note *
                  </Label>
                  <div className="flex gap-2" data-testid="rating-stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="focus:outline-none"
                        data-testid={`rating-star-${star}`}
                      >
                        <Star
                          className={`w-10 h-10 transition-colors ${
                            star <= (hoverRating || rating)
                              ? "fill-amber-400 text-amber-400"
                              : "text-slate-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  {rating > 0 && (
                    <p className="text-sm text-slate-500 mt-2">
                      {rating === 1 && "Très insatisfait"}
                      {rating === 2 && "Insatisfait"}
                      {rating === 3 && "Correct"}
                      {rating === 4 && "Satisfait"}
                      {rating === 5 && "Très satisfait"}
                    </p>
                  )}
                </div>

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
                      data-testid="feedback-nom-input"
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
                      data-testid="feedback-telephone-input"
                    />
                  </div>
                </div>

                {/* Comment */}
                <div>
                  <Label htmlFor="commentaire" className="text-slate-700 mb-2 block">
                    Votre commentaire *
                  </Label>
                  <Textarea
                    id="commentaire"
                    name="commentaire"
                    value={formData.commentaire}
                    onChange={handleChange}
                    placeholder="Décrivez votre expérience avec PLB Logistique..."
                    className="rounded-xl min-h-[100px]"
                    data-testid="feedback-commentaire-input"
                  />
                </div>

                {/* Problems */}
                <div>
                  <Label htmlFor="problemes" className="text-slate-700 mb-2 block">
                    Problèmes rencontrés (optionnel)
                  </Label>
                  <Textarea
                    id="problemes"
                    name="problemes"
                    value={formData.problemes}
                    onChange={handleChange}
                    placeholder="Avez-vous rencontré des problèmes ? Décrivez-les ici..."
                    className="rounded-xl min-h-[80px]"
                    data-testid="feedback-problemes-input"
                  />
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-sky-500 hover:bg-sky-600 text-white rounded-full h-12 mt-6"
                  data-testid="feedback-submit-btn"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    "Envoyer mon avis"
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
