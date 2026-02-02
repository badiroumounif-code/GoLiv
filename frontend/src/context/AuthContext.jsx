import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    // Check for stored auth on mount
    const storedToken = localStorage.getItem("plb_token");
    const storedUser = localStorage.getItem("plb_user");
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.detail || "Erreur de connexion");
    }
    
    localStorage.setItem("plb_token", data.token);
    localStorage.setItem("plb_user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    
    return data.user;
  };

  const register = async (userData) => {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.detail || "Erreur d'inscription");
    }
    
    localStorage.setItem("plb_token", data.token);
    localStorage.setItem("plb_user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("plb_token");
    localStorage.removeItem("plb_user");
    setToken(null);
    setUser(null);
  };

  const authFetch = async (url, options = {}) => {
    const headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    };
    
    const response = await fetch(url, { ...options, headers });
    
    if (response.status === 401) {
      logout();
      throw new Error("Session expirée");
    }
    
    return response;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      loading, 
      login, 
      register, 
      logout, 
      authFetch,
      isAuthenticated: !!token 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
