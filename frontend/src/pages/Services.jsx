import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Package, FileText, Box, Truck, Clock, Zap, AlertTriangle, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "../components/ui/button";

export default function Services() {
  const packageTypes = [
    {
      icon: <FileText className="w-6 h-6" />,
      name: "Documents",
      description: "Enveloppes, courriers, documents officiels",
      weight: "< 1 kg"
    },
    {
      icon: <Package className="w-6 h-6" />,
      name: "Petit colis",
      description: "Petits paquets, accessoires, téléphones",
      weight: "1 - 5 kg"
    },
    {
      icon: <Box className="w-6 h-6" />,
      name: "Colis moyen",
      description: "Cartons, vêtements, appareils",
      weight: "5 - 15 kg"
    },
    {
      icon: <Truck className="w-6 h-6" />,
      name: "Grand colis",
      description: "Meubles légers, gros cartons",
      weight: "15 - 30 kg"
    }
  ];

  const urgencyLevels = [
    {
      icon: <Clock className="w-6 h-6" />,
      name: "Standard",
      delay: "24 - 48h",
      description: "Livraison économique pour les envois non urgents",
      color: "bg-slate-100 text-slate-700"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      name: "Express",
      delay: "Même jour",
      description: "Livraison rapide pour les envois prioritaires",
      color: "bg-amber-100 text-amber-700"
    },
    {
      icon: <AlertTriangle className="w-6 h-6" />,
      name: "Urgent",
      delay: "2 - 4h",
      description: "Livraison immédiate pour les urgences",
      color: "bg-red-100 text-red-700"
    }
  ];

  const pricingZones = [
    { from: "Cotonou", to: "Cotonou", standard: "1 000 - 2 500", express: "2 000 - 4 000" },
    { from: "Cotonou", to: "Calavi", standard: "2 000 - 3 500", express: "3 500 - 6 000" },
    { from: "Cotonou", to: "Porto-Novo", standard: "3 000 - 5 000", express: "5 000 - 8 000" },
    { from: "Calavi", to: "Porto-Novo", standard: "3 500 - 6 000", express: "6 000 - 10 000" }
  ];

  const included = [
    "Enlèvement à domicile ou en entreprise",
    "Livraison à l'adresse indiquée",
    "Confirmation par téléphone",
    "Suivi de votre livraison",
    "Emballage sécurisé sur demande",
    "Paiement à la livraison accepté"
  ];

  return (
    <div className="overflow-hidden" data-testid="services-page">
      {/* Hero Section */}
      <section className="section-padding bg-slate-50">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="text-sky-500 font-medium text-sm uppercase tracking-wider">Nos offres</span>
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-slate-900 mt-2 mb-4">
              Services & Tarifs
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed">
              Des solutions de livraison adaptées à tous vos besoins, avec des tarifs transparents et compétitifs.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Package Types */}
      <section className="section-padding">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-sky-500 font-medium text-sm uppercase tracking-wider">Types de colis</span>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-slate-900 mt-2">
              Nous transportons tout type de colis
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {packageTypes.map((type, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 border border-slate-100 shadow-soft hover:shadow-hover transition-shadow"
                data-testid={`package-type-${index}`}
              >
                <div className="w-12 h-12 bg-sky-50 rounded-xl flex items-center justify-center text-sky-500 mb-4">
                  {type.icon}
                </div>
                <h3 className="font-heading font-semibold text-lg text-slate-900 mb-1">
                  {type.name}
                </h3>
                <p className="text-slate-600 text-sm mb-2">{type.description}</p>
                <span className="text-sky-500 text-sm font-medium">{type.weight}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Urgency Levels */}
      <section className="section-padding bg-slate-50">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-sky-500 font-medium text-sm uppercase tracking-wider">Délais</span>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-slate-900 mt-2">
              Choisissez votre niveau d&apos;urgence
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {urgencyLevels.map((level, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 border border-slate-100 shadow-soft text-center"
                data-testid={`urgency-level-${index}`}
              >
                <div className={`w-16 h-16 ${level.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                  {level.icon}
                </div>
                <h3 className="font-heading font-semibold text-xl text-slate-900 mb-1">
                  {level.name}
                </h3>
                <p className="text-sky-500 font-bold text-lg mb-2">{level.delay}</p>
                <p className="text-slate-600 text-sm">{level.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Table */}
      <section className="section-padding">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-sky-500 font-medium text-sm uppercase tracking-wider">Grille tarifaire</span>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-slate-900 mt-2">
              Tarifs indicatifs
            </h2>
            <p className="text-slate-600 mt-2">Tarifs en FCFA, variables selon le poids et la taille du colis</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-100 shadow-soft overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="pricing-table">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Trajet</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">Standard</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">Express</th>
                  </tr>
                </thead>
                <tbody>
                  {pricingZones.map((zone, index) => (
                    <tr key={index} className="border-t border-slate-100">
                      <td className="px-6 py-4 text-slate-700">
                        {zone.from} → {zone.to}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="urgency-normal px-3 py-1 rounded-full text-sm font-medium">
                          {zone.standard} F
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="urgency-express px-3 py-1 rounded-full text-sm font-medium">
                          {zone.express} F
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          <p className="text-center text-sm text-slate-500 mt-4">
            * Les tarifs urgents sont calculés sur devis selon la disponibilité
          </p>
        </div>
      </section>

      {/* What's Included */}
      <section className="section-padding bg-slate-50">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-sky-500 font-medium text-sm uppercase tracking-wider">Inclus</span>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-slate-900 mt-2 mb-6">
                Ce qui est inclus dans nos services
              </h2>
              <ul className="space-y-4">
                {included.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-3xl p-8 border border-slate-100 shadow-soft"
            >
              <h3 className="font-heading text-xl font-semibold text-slate-900 mb-4">
                Besoin d&apos;un devis personnalisé ?
              </h3>
              <p className="text-slate-600 mb-6">
                Pour les envois réguliers ou les volumes importants, contactez-nous pour obtenir un tarif préférentiel adapté à vos besoins.
              </p>
              <div className="space-y-3">
                <Link to="/demande-livraison" className="block">
                  <Button className="w-full bg-sky-500 hover:bg-sky-600 text-white rounded-full" data-testid="request-delivery-btn">
                    Demander une livraison
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/contact" className="block">
                  <Button variant="outline" className="w-full rounded-full border-slate-200" data-testid="contact-btn">
                    Nous contacter
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
