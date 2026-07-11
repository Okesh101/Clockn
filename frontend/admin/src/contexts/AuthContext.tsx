import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import toast from "react-hot-toast";

import type { AdminUser, AuthResponse } from "../types";
import api from "../utils/axiosConfig";

interface AuthContextType {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const errorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === "object" && error !== null) {
    const maybeAxios = error as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    return maybeAxios.response?.data?.message || maybeAxios.message || fallback;
  }
  return fallback;
};

const isAdminUser = (user: AdminUser) =>
  user.roles?.some((role) => role.toLowerCase() === "admin") ?? false;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(
    () => !!localStorage.getItem("access_token"),
  );

  useEffect(() => {
    const handleLogout = () => setAdmin(null);
    window.addEventListener("auth:logout", handleLogout);

    let active = true;
    const token = localStorage.getItem("access_token");

    if (token) {
      (async () => {
        try {
          const { data } = await api.get("/auth/profile");
          if (!active) return;
          const profile = data.data as AdminUser;
          if (!isAdminUser(profile)) {
            throw new Error("Admin access required.");
          }
          setAdmin(profile);
          localStorage.setItem("admin", JSON.stringify(profile));
        } catch (error) {
          console.error("Failed to hydrate admin profile:", error);
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          localStorage.removeItem("admin");
          if (active) setAdmin(null);
        } finally {
          if (active) setLoading(false);
        }
      })();
    }

    return () => {
      active = false;
      window.removeEventListener("auth:logout", handleLogout);
    };
  }, []);

  const persistSession = (payload: AuthResponse) => {
    if (!isAdminUser(payload.teacher)) {
      throw new Error("This account does not have admin access.");
    }
    localStorage.setItem("access_token", payload.access_token);
    localStorage.setItem("refresh_token", payload.refresh_token);
    localStorage.setItem("admin", JSON.stringify(payload.teacher));
    setAdmin(payload.teacher);
  };

  const login = async (email: string, password: string) => {
    try {
      const { data } = await api.post<AuthResponse>("/auth/login", {
        email,
        password,
      });
      persistSession(data);
      toast.success(`Welcome back, ${data.teacher.firstname}!`);
    } catch (error) {
      const message = errorMessage(error, "Login failed");
      toast.error(message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem("refresh_token");
      await api.post(
        "/auth/logout",
        {},
        refreshToken ? { headers: { "X-Refresh-Token": refreshToken } } : {},
      );
    } catch (error) {
      console.warn("Logout request failed (ignored):", error);
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("admin");
      setAdmin(null);
      toast.success("Logged out successfully!");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        isAuthenticated: !!admin,
        loading,
        login,
        logout,
      }}
    >
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
