import { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Check current session on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
      if (token) {
        try {
          const res = await api.get("/api/auth/me");
          if (res.data.success) {
            setUser(res.data.user);
          }
        } catch (err) {
          console.error("Auth initialization failed:", err);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password, rememberMe = true) => {
    try {
      setError("");
      const res = await api.post("/api/auth/login", { email, password });

      if (res.data.success) {
        const { user, accessToken, refreshToken } = res.data;
        const storage = rememberMe ? localStorage : sessionStorage;

        storage.setItem("accessToken", accessToken);
        storage.setItem("refreshToken", refreshToken);

        setUser(user);
        return { success: true, user };
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed. Check your credentials.";
      setError(msg);
      return { success: false, message: msg };
    }
  };

  const register = async (formData, rememberMe = true) => {
    try {
      setError("");
      const res = await api.post("/api/auth/register", formData);

      if (res.data.success) {
        const { user, accessToken, refreshToken } = res.data;
        const storage = rememberMe ? localStorage : sessionStorage;

        storage.setItem("accessToken", accessToken);
        storage.setItem("refreshToken", refreshToken);

        setUser(user);
        return { success: true, user };
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed.";
      setError(msg);
      return { success: false, message: msg };
    }
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem("refreshToken") || sessionStorage.getItem("refreshToken");
    if (refreshToken) {
      try {
        await api.post("/api/auth/logout", { refreshToken });
      } catch (err) {
        console.error("Logout API call failed:", err);
      }
    }
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        setError,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        role: user?.role || "Guest"
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
