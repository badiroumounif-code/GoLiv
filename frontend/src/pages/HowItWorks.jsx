import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ClipboardList, Phone, Truck, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "../components/ui/button";

export default function HowItWorks() {
  const steps = [
    {
      number: "01",
      icon: <ClipboardList className="w-8 h-8" />,
      title: "Faites votre demande",
      description: "Remplissez notre formulaire en ligne avec les détails de votre colis : zones d'enlèvement et de livraison, type de colis et niveau d'urgence."
    },
    {
      number: "02",
      icon: <Phone className="w-8 h-8" />,
      title: "Confirmation",
      description: "Notre équipe vous contacte rapidement pour confirmer les détails et vous communiquer le tarif exact de la livraison."
    },
    {
      number: "03",
      icon: <Truck className="w-8 h-8" />,
      title: "Enlèvement",
      description: "Un de nos livreurs professionnels se présente à l'adresse indiquée pour récupérer votre colis en toute sécurité."
    },
    {
      number: "04",
      icon: <CheckCircle className="w-8 h-8" />,
      title: "Livraison",
      description: "Votre colis est livré à destination dans les délais convenus. Vous recevez une confirmation de livraison."
    }
  ];

  const faqs = [
    {
      question: "Quels sont les délais de livraison ?",
      answer: "Pour une livraison standard, comptez 24 à 48 heures. En mode express, nous livrons le jour même. Pour les urgences, nous pouvons livrer en quelques heures selon la disponibilité."
    },
    {
      question: "Quels types de colis acceptez-vous ?",
      answer: "Nous acceptons les documents, petits colis, colis moyens et grands colis. Pour les marchandises fragiles ou de valeur, merci de le préciser lors de la demande."
    },
    {
      question: "Comment connaître le tarif de ma livraison ?",
      answer: "Le tarif dépend de la zone de livraison, du type de colis et du niveau d'urgence. Consultez notre page Services & Tarifs ou faites une demande pour recevoir un devis."
    },
    {
      question: "Puis-je suivre ma livraison ?",
      answer: "Oui, vous serez informé par téléphone des différentes étapes de votre livraison : enlèvement, en cours de livraison et livré."
    }
  ];

  return (
    <div className="overflow-hidden" data-testid="how-it-works-page">
      {/* Hero Section */}
      <section className="section-padding bg-slate-50">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="text-sky-500 font-medium text-sm uppercase tracking-wider">Processus</span>
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-slate-900 mt-2 mb-4">
              Comment ça marche ?
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed">
              En quelques étapes simples, faites livrer vos colis à travers Cotonou, Porto-Novo et Calavi. 
              Notre processus est conçu pour être rapide et sans stress.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative flex gap-6 md:gap-8 pb-12 last:pb-0"
                data-testid={`step-${index + 1}`}
              >
                {/* Timeline line */}
                {index < steps.length - 1 && (
                  <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-slate-200 md:left-10"></div>
                )}
                
                {/* Step number circle */}
                <div className="flex-shrink-0 w-12 h-12 md:w-20 md:h-20 bg-sky-500 rounded-2xl flex items-center justify-center text-white relative z-10">
                  {step.icon}
                </div>
                
                {/* Content */}
                <div className="flex-grow pt-1">
                  <span className="text-sky-500 font-bold text-sm">Étape {step.number}</span>
                  <h3 className="font-heading text-xl md:text-2xl font-semibold text-slate-900 mt-1 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-slate-50">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-3xl p-8 md:p-12 text-center border border-slate-100 shadow-soft"
          >
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-slate-900 mb-4">
              Prêt à commencer ?
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto mb-8">
              C&apos;est simple et rapide. Faites votre première demande de livraison en quelques clics.
            </p>
            <Link to="/demande-livraison">
              <Button className="bg-sky-500 hover:bg-sky-600 text-white rounded-full px-8 py-6 text-lg" data-testid="start-delivery-btn">
                Demander une livraison
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section-padding">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-sky-500 font-medium text-sm uppercase tracking-wider">FAQ</span>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-slate-900 mt-2">
              Questions fréquentes
            </h2>
          </motion.div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 border border-slate-100 shadow-soft"
                data-testid={`faq-${index}`}
              >
                <h3 className="font-heading font-semibold text-lg text-slate-900 mb-2">
                  {faq.question}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {faq.answer}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
