import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, Search, Package, MapPin, Clock, AlertCircle, Phone, Mail, Scale, CreditCard } from "lucide-react";
import { Input } from "../components/ui/input";

const faqCategories = [
  {
    id: "tracking",
    title: "Suivi de Colis",
    icon: Package,
    questions: [
      {
        question: "Comment fonctionne le suivi de colis ?",
        answer: "Chaque livraison se voit attribuer un numéro de suivi unique au format PLB-YYYY-XXXXXX (ex: PLB-2026-000123). Vous pouvez suivre votre colis en entrant ce numéro directement sur notre page d'accueil. Le statut est mis à jour en temps réel : En attente → Assigné → En cours → Livré."
      },
      {
        question: "Où trouver mon numéro de suivi ?",
        answer: "Votre numéro de suivi vous est communiqué par email dès la création de votre commande. Il apparaît également sur la page de confirmation après avoir soumis une demande de livraison. Conservez-le précieusement pour suivre l'avancement de votre colis."
      },
      {
        question: "Le suivi ne fonctionne pas, que faire ?",
        answer: "Vérifiez que vous avez bien saisi le numéro complet (ex: PLB-2026-000123, avec les tirets). Si le problème persiste, contactez notre service client par téléphone ou via le formulaire de contact."
      }
    ]
  },
  {
    id: "pricing",
    title: "Tarification",
    icon: CreditCard,
    questions: [
      {
        question: "Comment sont calculés les prix de livraison ?",
        answer: "Nos tarifs sont basés sur deux critères principaux : 1) La zone de livraison (Cotonou Centre, Akpakpa, Calavi, Porto-Novo, etc.) - chaque zone a un prix de base. 2) Le poids du colis - un supplément de 500 FCFA s'applique pour les colis de plus de 5kg. Le prix final est affiché avant confirmation de votre commande."
      },
      {
        question: "Quels sont les tarifs par zone ?",
        answer: "Nos tarifs de base par zone sont : Cotonou Centre (1 500 FCFA), Akpakpa (2 000 FCFA), Calavi/Godomey (2 500 FCFA), Périphérie (3 000 FCFA), Porto-Novo (3 500 FCFA), Hors Zone (5 000 FCFA). Ces tarifs sont susceptibles d'être mis à jour - consultez notre formulaire de commande pour les prix actuels."
      },
      {
        question: "Y a-t-il des frais supplémentaires ?",
        answer: "Un supplément de 500 FCFA s'applique uniquement pour les colis dépassant 5 kg. Les livraisons urgentes (2-4h) ou express (même jour) peuvent entraîner des frais additionnels selon la distance. Tous les prix sont affichés clairement avant la validation de votre commande."
      }
    ]
  },
  {
    id: "delivery",
    title: "Livraison",
    icon: MapPin,
    questions: [
      {
        question: "Quels sont les délais de livraison ?",
        answer: "Nous proposons trois niveaux d'urgence : Standard (24-48h) pour les envois classiques, Express (même jour) pour les besoins rapides, et Urgent (2-4h) pour les situations critiques. Les délais dépendent de la zone de livraison et de la disponibilité des livreurs."
      },
      {
        question: "Quelles zones couvrez-vous ?",
        answer: "Nous couvrons l'ensemble du Grand Cotonou : Cotonou Centre, Akpakpa, Fidjrossè, Cadjèhoun, Zogbo, ainsi que Calavi, Godomey, Abomey-Calavi, Porto-Novo et ses environs. Pour les zones non répertoriées, contactez-nous pour une estimation personnalisée."
      },
      {
        question: "Que se passe-t-il si la livraison échoue ?",
        answer: "En cas d'échec de livraison (destinataire absent, adresse incorrecte), notre livreur tente de vous contacter. Une deuxième tentative est généralement organisée. Si la livraison reste impossible, le colis peut être retourné à l'expéditeur avec des frais applicables. Nous vous tiendrons informé par SMS et via le suivi en ligne."
      },
      {
        question: "Puis-je modifier l'adresse de livraison ?",
        answer: "Oui, tant que le colis n'est pas encore en cours de livraison. Contactez notre service client dès que possible avec votre numéro de suivi pour effectuer la modification."
      }
    ]
  },
  {
    id: "weight",
    title: "Poids et Colis",
    icon: Scale,
    questions: [
      {
        question: "Quel est le poids maximum accepté ?",
        answer: "Nous acceptons les colis jusqu'à 30 kg en standard. Pour les colis plus lourds ou volumineux, contactez-nous pour un devis personnalisé. Le poids doit être estimé lors de la commande pour un calcul précis du tarif."
      },
      {
        question: "Quels types de colis transportez-vous ?",
        answer: "Nous transportons : documents, petits colis (< 5kg), colis moyens (5-15kg), grands colis (15-30kg), et colis fragiles nécessitant une attention particulière. Certains articles sont interdits (produits dangereux, périssables sans emballage adapté)."
      }
    ]
  },
  {
    id: "support",
    title: "Contact et Support",
    icon: Phone,
    questions: [
      {
        question: "Comment contacter le service client ?",
        answer: "Vous pouvez nous joindre par téléphone au +229 97 00 00 00 (du lundi au samedi, 8h-20h), par email à contact@plb-logistique.bj, ou via notre formulaire de contact sur le site. Pour les urgences liées à une livraison en cours, privilégiez le téléphone."
      },
      {
        question: "Comment devenir partenaire livreur ?",
        answer: "Rendez-vous sur notre page 'Devenir Partenaire' et sélectionnez 'Livreur'. Remplissez le formulaire avec vos informations personnelles et le type de véhicule que vous utilisez. Notre équipe examinera votre candidature et vous contactera sous 48h."
      },
      {
        question: "Comment devenir commerçant partenaire ?",
        answer: "Les commerçants peuvent bénéficier de tarifs préférentiels et d'un accès à un tableau de bord dédié. Inscrivez-vous via notre formulaire 'Devenir Partenaire Commerçant' et nous vous contacterons pour discuter de vos besoins."
      }
    ]
  }
];

function FAQItem({ question, answer, isOpen, onClick }) {
  return (
    <div className="border border-slate-100 rounded-xl overflow-hidden">
      <button
        onClick={onClick}
        className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
        aria-expanded={isOpen}
      >
        <span className="font-medium text-slate-900">{question}</span>
        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="px-5 pb-5"
        >
          <p className="text-slate-600 leading-relaxed">{answer}</p>
        </motion.div>
      )}
    </div>
  );
}

export default function FAQ() {
  const [searchTerm, setSearchTerm] = useState("");
  const [openItems, setOpenItems] = useState({});
  const [activeCategory, setActiveCategory] = useState("all");

  const toggleItem = (categoryId, questionIndex) => {
    const key = `${categoryId}-${questionIndex}`;
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredCategories = faqCategories.map(category => ({
    ...category,
    questions: category.questions.filter(q =>
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => 
    activeCategory === "all" || category.id === activeCategory
  ).filter(category => 
    searchTerm === "" || category.questions.length > 0
  );

  return (
    <div className="min-h-screen" data-testid="faq-page">
      {/* Hero */}
      <section className="bg-gradient-to-br from-sky-500 to-sky-600 py-16 md:py-24">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="font-heading text-3xl md:text-5xl font-bold text-white mb-6">
              Foire Aux Questions
            </h1>
            <p className="text-sky-100 text-lg mb-8">
              Trouvez rapidement les réponses à vos questions sur nos services de livraison
            </p>
            
            {/* Search */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher une question..."
                className="pl-12 h-14 text-lg rounded-xl bg-white border-0 shadow-lg"
                data-testid="faq-search-input"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories Filter */}
      <section className="py-8 border-b border-slate-100">
        <div className="container-custom">
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => setActiveCategory("all")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === "all"
                  ? "bg-sky-500 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Toutes les catégories
            </button>
            {faqCategories.map(category => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeCategory === category.id
                    ? "bg-sky-500 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <category.icon className="w-4 h-4" />
                {category.title}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-12 md:py-16">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto space-y-10">
            {filteredCategories.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Aucun résultat</h3>
                <p className="text-slate-600">
                  Aucune question ne correspond à votre recherche. Essayez d'autres mots-clés ou contactez-nous directement.
                </p>
              </div>
            ) : (
              filteredCategories.map(category => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center">
                      <category.icon className="w-5 h-5 text-sky-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-slate-900">{category.title}</h2>
                  </div>
                  <div className="space-y-3">
                    {category.questions.map((item, index) => (
                      <FAQItem
                        key={index}
                        question={item.question}
                        answer={item.answer}
                        isOpen={openItems[`${category.id}-${index}`]}
                        onClick={() => toggleItem(category.id, index)}
                      />
                    ))}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-12 bg-slate-50">
        <div className="container-custom">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Vous n'avez pas trouvé votre réponse ?
            </h2>
            <p className="text-slate-600 mb-6">
              Notre équipe est là pour vous aider. Contactez-nous directement.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="tel:+22997000000"
                className="flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-6 py-3 rounded-full font-medium transition-colors"
              >
                <Phone className="w-5 h-5" />
                +229 97 00 00 00
              </a>
              <a
                href="/contact"
                className="flex items-center justify-center gap-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 px-6 py-3 rounded-full font-medium transition-colors"
              >
                <Mail className="w-5 h-5" />
                Formulaire de contact
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
