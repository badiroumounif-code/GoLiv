import { Link } from "react-router-dom";
import { Truck, Phone, Mail, MapPin, Facebook, Instagram, Twitter } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-50 border-t border-slate-100" data-testid="footer">
      <div className="container-custom py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <span className="font-heading font-bold text-xl text-slate-900">
                PLB Logistique
              </span>
            </Link>
            <p className="text-slate-600 text-sm leading-relaxed">
              Votre partenaire de confiance pour la livraison au Bénin. Rapide, fiable et moderne.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-9 h-9 bg-white rounded-full flex items-center justify-center border border-slate-200 hover:border-sky-500 hover:text-sky-500 transition-colors" aria-label="Facebook">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 bg-white rounded-full flex items-center justify-center border border-slate-200 hover:border-sky-500 hover:text-sky-500 transition-colors" aria-label="Instagram">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 bg-white rounded-full flex items-center justify-center border border-slate-200 hover:border-sky-500 hover:text-sky-500 transition-colors" aria-label="Twitter">
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-heading font-semibold text-slate-900 mb-4">Navigation</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-slate-600 hover:text-sky-500 text-sm transition-colors">
                  Accueil
                </Link>
              </li>
              <li>
                <Link to="/comment-ca-marche" className="text-slate-600 hover:text-sky-500 text-sm transition-colors">
                  Comment ça marche
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-slate-600 hover:text-sky-500 text-sm transition-colors">
                  Services & Tarifs
                </Link>
              </li>
              <li>
                <Link to="/a-propos" className="text-slate-600 hover:text-sky-500 text-sm transition-colors">
                  À propos
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-slate-600 hover:text-sky-500 text-sm transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-heading font-semibold text-slate-900 mb-4">Services</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/demande-livraison" className="text-slate-600 hover:text-sky-500 text-sm transition-colors">
                  Demander une livraison
                </Link>
              </li>
              <li>
                <Link to="/donner-avis" className="text-slate-600 hover:text-sky-500 text-sm transition-colors">
                  Donner votre avis
                </Link>
              </li>
              <li>
                <Link to="/devenir-partenaire/commercant" className="text-slate-600 hover:text-sky-500 text-sm transition-colors">
                  Devenir commerçant
                </Link>
              </li>
              <li>
                <Link to="/devenir-partenaire/livreur" className="text-slate-600 hover:text-sky-500 text-sm transition-colors">
                  Devenir livreur
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading font-semibold text-slate-900 mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-slate-600">
                <MapPin className="w-4 h-4 text-sky-500 mt-0.5 flex-shrink-0" />
                <span>Cotonou, Porto-Novo, Calavi<br />Bénin</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-600">
                <Phone className="w-4 h-4 text-sky-500 flex-shrink-0" />
                <span>+229 XX XX XX XX</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-600">
                <Mail className="w-4 h-4 text-sky-500 flex-shrink-0" />
                <span>contact@plblogistique.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-slate-200 mt-10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} PLB Logistique. Tous droits réservés.
          </p>
          <div className="flex gap-6 text-sm text-slate-500">
            <Link to="/admin" className="hover:text-sky-500 transition-colors">
              Administration
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
