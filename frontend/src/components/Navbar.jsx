import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Truck, ChevronDown, User, LogOut, LayoutDashboard } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getDashboardPath = () => {
    if (!user) return "/connexion";
    switch (user.role) {
      case "admin": return "/admin";
      case "rider": return "/espace-livreur";
      case "merchant": return "/espace-commercant";
      default: return "/connexion";
    }
  };

  const getRoleLabel = () => {
    if (!user) return "";
    switch (user.role) {
      case "admin": return "Admin";
      case "rider": return "Livreur";
      case "merchant": return "Commerçant";
      default: return "";
    }
  };

  const navLinks = [
    { name: "Accueil", path: "/" },
    { name: "Comment ça marche", path: "/comment-ca-marche" },
    { name: "Services & Tarifs", path: "/services" },
    { name: "FAQ", path: "/faq" },
    { name: "À propos", path: "/a-propos" },
    { name: "Contact", path: "/contact" },
  ];

  return (
    <header className="sticky top-0 z-50 nav-glass" data-testid="navbar">
      <div className="container-custom">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2" data-testid="logo-link">
            <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <span className="font-heading font-bold text-xl text-slate-900">
              PLB Logistique
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  isActive(link.path)
                    ? "bg-sky-50 text-sky-600"
                    : "text-slate-600 hover:text-sky-600 hover:bg-sky-50/50"
                }`}
                data-testid={`nav-link-${link.path.replace("/", "") || "home"}`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-slate-600 rounded-full" data-testid="partner-dropdown">
                  Devenir partenaire
                  <ChevronDown className="ml-1 w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link to="/devenir-partenaire/commercant" data-testid="partner-merchant-link">
                    Commerçant
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/devenir-partenaire/livreur" data-testid="partner-rider-link">
                    Livreur
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="rounded-full px-4" data-testid="user-menu-btn">
                    <User className="w-4 h-4 mr-2" />
                    {user?.nom?.split(' ')[0] || getRoleLabel()}
                    <ChevronDown className="ml-1 w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5 text-sm text-slate-500">
                    {getRoleLabel()}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={getDashboardPath()} className="flex items-center" data-testid="dashboard-link">
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Mon espace
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600" data-testid="logout-menu-btn">
                    <LogOut className="w-4 h-4 mr-2" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/connexion">
                <Button variant="outline" className="rounded-full px-6" data-testid="login-btn">
                  <User className="w-4 h-4 mr-2" />
                  Connexion
                </Button>
              </Link>
            )}
            
            <Link to="/demande-livraison">
              <Button className="bg-sky-500 hover:bg-sky-600 text-white rounded-full px-6" data-testid="request-delivery-btn">
                Demander une livraison
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="mobile-menu-toggle"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-slate-700" />
            ) : (
              <Menu className="w-6 h-6 text-slate-700" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-slate-100 mobile-menu-enter" data-testid="mobile-menu">
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-3 rounded-xl text-base font-medium ${
                    isActive(link.path)
                      ? "bg-sky-50 text-sky-600"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <div className="border-t border-slate-100 my-2 pt-2">
                <Link
                  to="/devenir-partenaire/commercant"
                  className="block px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-xl"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Devenir commerçant partenaire
                </Link>
                <Link
                  to="/devenir-partenaire/livreur"
                  className="block px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-xl"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Devenir livreur partenaire
                </Link>
              </div>
              
              {/* Auth section for mobile */}
              <div className="border-t border-slate-100 my-2 pt-2">
                {isAuthenticated ? (
                  <>
                    <Link
                      to={getDashboardPath()}
                      className="block px-4 py-3 text-sky-600 hover:bg-sky-50 rounded-xl font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <LayoutDashboard className="w-4 h-4 inline mr-2" />
                      Mon espace ({getRoleLabel()})
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl"
                    >
                      <LogOut className="w-4 h-4 inline mr-2" />
                      Déconnexion
                    </button>
                  </>
                ) : (
                  <Link
                    to="/connexion"
                    className="block px-4 py-3 text-sky-600 hover:bg-sky-50 rounded-xl font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="w-4 h-4 inline mr-2" />
                    Connexion
                  </Link>
                )}
              </div>
              
              <Link
                to="/demande-livraison"
                className="mx-4 mt-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Button className="w-full bg-sky-500 hover:bg-sky-600 text-white rounded-full">
                  Demander une livraison
                </Button>
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
