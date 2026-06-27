import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Truck, Mail, Lock, User, Phone, Eye, EyeOff, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";

// Google icon SVG component
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    nom: "",
    telephone: "",
    role: "merchant"
  });

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    // Use dynamic location to ensure correct domain
    const redirectUrl = window.location.origin + '/connexion';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let user;
      if (isLogin) {
        user = await login(formData.email, formData.password);
        toast.success(`Bienvenue, ${user.nom} !`);
      } else {
        user = await register({
          email: formData.email,
          password: formData.password,
          nom: formData.nom,
          telephone: formData.telephone,
          role: formData.role
        });
        toast.success("Compte créé avec succès !");
      }
      
      // Redirect based on role
      switch (user.role) {
        case "admin":
          navigate("/admin");
          break;
        case "rider":
          navigate("/espace-livreur");
          break;
        case "merchant":
          navigate("/espace-commercant");
          break;
        default:
          navigate("/");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12" data-testid="login-page">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="gradient-blob w-96 h-96 bg-sky-400/30 top-20 -left-20"></div>
        <div className="gradient-blob w-80 h-80 bg-sky-300/30 bottom-20 right-10"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md px-5 sm:px-0 sm:mx-4 relative z-10"
      >
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-sky-500 to-sky-600 p-8 md:p-10 text-center text-white">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Truck className="w-8 h-8" />
            </div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold mb-2 tracking-tight">
              {isLogin ? "Connexion" : "Créer un compte"}
            </h1>
            <p className="text-sky-100 text-sm">
              {isLogin 
                ? "Accédez à votre espace personnel" 
                : "Rejoignez GoLiv Logistique"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5" data-testid="login-form">
            {!isLogin && (
              <>
                {/* Role Selection */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, role: "merchant" }))}
                    className={`p-4 rounded-xl border-2 transition-all text-center ${
                      formData.role === "merchant"
                        ? "border-sky-500 bg-sky-50 text-sky-700"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                    data-testid="role-merchant-btn"
                  >
                    <User className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-sm font-medium">Commerçant</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, role: "rider" }))}
                    className={`p-4 rounded-xl border-2 transition-all text-center ${
                      formData.role === "rider"
                        ? "border-sky-500 bg-sky-50 text-sky-700"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                    data-testid="role-rider-btn"
                  >
                    <Truck className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-sm font-medium">Livreur</span>
                  </button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nom">Nom complet</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      id="nom"
                      name="nom"
                      value={formData.nom}
                      onChange={handleChange}
                      placeholder="Votre nom"
                      className="pl-10 rounded-xl"
                      required={!isLogin}
                      data-testid="input-nom"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telephone">Téléphone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      id="telephone"
                      name="telephone"
                      value={formData.telephone}
                      onChange={handleChange}
                      placeholder="+229 97 00 11 22"
                      className="pl-10 rounded-xl"
                      data-testid="input-telephone"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="votre@email.com"
                  className="pl-10 rounded-xl"
                  required
                  data-testid="input-email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="pl-10 pr-10 rounded-xl"
                  required
                  data-testid="input-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  data-testid="toggle-password-btn"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-sky-500 hover:bg-sky-600 text-white rounded-xl py-6 text-base"
              disabled={loading}
              data-testid="submit-btn"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? "Se connecter" : "Créer mon compte"}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </>
              )}
            </Button>

            {/* Google Sign-in Divider and Button */}
            {isLogin && (
              <>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-4 text-slate-500">ou</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-xl py-6 text-base border-slate-300 hover:bg-slate-50"
                  onClick={handleGoogleLogin}
                  disabled={googleLoading}
                  data-testid="google-login-btn"
                >
                  {googleLoading ? (
                    <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                  ) : (
                    <>
                      <GoogleIcon />
                      <span className="ml-2">Continuer avec Google</span>
                    </>
                  )}
                </Button>
              </>
            )}
          </form>

          {/* Footer */}
          <div className="px-8 pb-8 text-center">
            <p className="text-slate-600 text-sm">
              {isLogin ? "Pas encore de compte ?" : "Déjà un compte ?"}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sky-600 hover:text-sky-700 font-medium ml-1"
                data-testid="toggle-mode-btn"
              >
                {isLogin ? "Créer un compte" : "Se connecter"}
              </button>
            </p>
          </div>
        </div>

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 bg-sky-50 rounded-2xl p-6"
        >
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-sky-500" />
            Espaces dédiés
          </h3>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <span className="text-sky-500 font-bold">•</span>
              <span><strong>Commerçants :</strong> Gérez vos commandes et suivez vos livraisons</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-sky-500 font-bold">•</span>
              <span><strong>Livreurs :</strong> Consultez vos missions et mettez à jour vos statuts</span>
            </li>
          </ul>
        </motion.div>
      </motion.div>
    </div>
  );
}
