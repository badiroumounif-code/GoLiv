import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH

export default function AuthCallback() {
  const navigate = useNavigate();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent double processing in React StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      try {
        // Extract session_id from URL fragment
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.substring(1));
        const sessionId = params.get("session_id");

        if (!sessionId) {
          toast.error("Erreur d'authentification : session_id manquant");
          navigate("/connexion", { replace: true });
          return;
        }

        // Call backend to exchange session_id for user data
        const API_URL = process.env.REACT_APP_BACKEND_URL;
        const response = await fetch(`${API_URL}/api/auth/google/session`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId }),
          credentials: "include" // Important for cookies
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail || "Échec de l'authentification Google");
        }

        const data = await response.json();

        // Store user data in localStorage (same pattern as existing auth)
        localStorage.setItem("plb_token", data.token);
        localStorage.setItem("plb_user", JSON.stringify(data.user));

        toast.success(`Bienvenue, ${data.user.nom} !`);

        // Redirect based on role
        switch (data.user.role) {
          case "admin":
            navigate("/admin", { replace: true, state: { user: data.user } });
            break;
          case "rider":
            navigate("/espace-livreur", { replace: true, state: { user: data.user } });
            break;
          case "merchant":
            navigate("/espace-commercant", { replace: true, state: { user: data.user } });
            break;
          default:
            navigate("/", { replace: true, state: { user: data.user } });
        }
      } catch (error) {
        console.error("Google auth error:", error);
        toast.error(error.message || "Erreur lors de la connexion Google");
        navigate("/connexion", { replace: true });
      }
    };

    processAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-sky-500 mx-auto mb-4" />
        <p className="text-slate-600 font-medium">Connexion en cours...</p>
      </div>
    </div>
  );
}
