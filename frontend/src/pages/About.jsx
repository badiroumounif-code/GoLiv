import { motion } from "framer-motion";
import { Users, Target, Heart, Truck, MapPin, Award } from "lucide-react";

export default function About() {
  const values = [
    {
      icon: <Target className="w-6 h-6" />,
      title: "Fiabilité",
      description: "Nous tenons nos engagements. Chaque colis est traité avec le même soin et la même attention."
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: "Proximité",
      description: "Nous sommes proches de nos clients et de nos partenaires. Votre satisfaction est notre priorité."
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: "Excellence",
      description: "Nous visons l'excellence dans chaque livraison, chaque interaction, chaque service."
    }
  ];

  const team = [
    {
      name: "L'équipe de direction",
      role: "Gestion et stratégie",
      description: "Une équipe passionnée qui pilote la vision de PLB Logistique."
    },
    {
      name: "Nos livreurs",
      role: "Sur le terrain",
      description: "Des professionnels dévoués qui assurent vos livraisons au quotidien."
    },
    {
      name: "Service client",
      role: "À votre écoute",
      description: "Une équipe disponible pour répondre à toutes vos questions."
    }
  ];

  return (
    <div className="overflow-hidden" data-testid="about-page">
      {/* Hero Section */}
      <section className="section-padding bg-slate-50">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="text-sky-500 font-medium text-sm uppercase tracking-wider">Notre histoire</span>
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-slate-900 mt-2 mb-4">
              À propos de PLB Logistique
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed">
              Née de la volonté de moderniser la livraison au Bénin, PLB Logistique s&apos;engage 
              à offrir un service de qualité, accessible et fiable à tous.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Story Section */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <img
                src="https://images.unsplash.com/photo-1768796373360-95d80c5830fb?w=800"
                alt="Équipe PLB Logistique"
                className="w-full h-80 object-cover rounded-3xl"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <span className="text-sky-500 font-medium text-sm uppercase tracking-wider">Notre mission</span>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-slate-900">
                Simplifier la logistique pour tous
              </h2>
              <p className="text-slate-600 leading-relaxed">
                PLB Logistique est née d&apos;un constat simple : la livraison de colis au Bénin peut être 
                compliquée, coûteuse et peu fiable. Nous avons décidé de changer cela.
              </p>
              <p className="text-slate-600 leading-relaxed">
                Notre mission est de rendre la livraison accessible à tous, que vous soyez un particulier 
                envoyant un colis à un proche ou un commerçant livrant ses clients. Avec PLB Logistique, 
                chaque envoi est entre de bonnes mains.
              </p>
              <div className="flex items-center gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-sky-500" />
                  <span className="text-slate-700 font-medium">Livraison rapide</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-sky-500" />
                  <span className="text-slate-700 font-medium">3 villes couvertes</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="section-padding bg-slate-50">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-sky-500 font-medium text-sm uppercase tracking-wider">Nos valeurs</span>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-slate-900 mt-2">
              Ce qui nous guide
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-8 border border-slate-100 shadow-soft text-center"
                data-testid={`value-${index}`}
              >
                <div className="w-14 h-14 bg-sky-50 rounded-2xl flex items-center justify-center text-sky-500 mx-auto mb-4">
                  {value.icon}
                </div>
                <h3 className="font-heading font-semibold text-xl text-slate-900 mb-2">
                  {value.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="section-padding">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-sky-500 font-medium text-sm uppercase tracking-wider">Notre équipe</span>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-slate-900 mt-2">
              Les personnes derrière PLB
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {team.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 border border-slate-100 shadow-soft"
                data-testid={`team-${index}`}
              >
                <div className="w-16 h-16 bg-sky-100 rounded-2xl flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-sky-600" />
                </div>
                <h3 className="font-heading font-semibold text-lg text-slate-900 mb-1">
                  {member.name}
                </h3>
                <p className="text-sky-500 text-sm font-medium mb-2">{member.role}</p>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {member.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Coverage Section */}
      <section className="section-padding bg-slate-50">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-3xl p-8 md:p-12 border border-slate-100 shadow-soft"
          >
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="w-16 h-16 bg-sky-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-sky-500" />
                </div>
                <h3 className="font-heading font-bold text-2xl text-slate-900 mb-2">Cotonou</h3>
                <p className="text-slate-600">Capitale économique</p>
              </div>
              <div>
                <div className="w-16 h-16 bg-sky-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-sky-500" />
                </div>
                <h3 className="font-heading font-bold text-2xl text-slate-900 mb-2">Porto-Novo</h3>
                <p className="text-slate-600">Capitale administrative</p>
              </div>
              <div>
                <div className="w-16 h-16 bg-sky-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-sky-500" />
                </div>
                <h3 className="font-heading font-bold text-2xl text-slate-900 mb-2">Calavi</h3>
                <p className="text-slate-600">Zone en expansion</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
