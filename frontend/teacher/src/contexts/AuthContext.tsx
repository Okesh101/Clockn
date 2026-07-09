// src/contexts/AuthContext.tsx
import {
  createContext,
  useState,
  useEffect,
  useContext,
  type ReactNode,
} from "react";
import type { Teacher, AuthResponse } from "../types";
import api from "../utils/axiosConfig";
import toast from "react-hot-toast";

interface AuthContextType {
  teacher: Teacher | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
  updateTeacher: (teacher: Teacher) => void;
  fetchMe: () => Promise<void>;
}

interface SignupData {
  email: string;
  phone: string;
  password: string;
  firstname: string;
  lastname: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMe = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await api.get("/auth/profile");
      if (response.data.status === "SUCCESS") {
        const teacherData = {
          ...response.data.data,
          created_at: response.data.data.created_at || new Date().toISOString(),
        };
        setTeacher(teacherData);
        localStorage.setItem("teacher", JSON.stringify(teacherData));
      }
    } catch (error) {
      console.error("Failed to fetch teacher:", error);
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("teacher");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();

    // Listen for logout events from axios interceptor
    const handleLogout = () => {
      setTeacher(null);
    };

    window.addEventListener("auth:logout", handleLogout);
    return () => {
      window.removeEventListener("auth:logout", handleLogout);
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post<AuthResponse>("/auth/login", {
        email,
        password,
      });

      if (response.data.status !== "SUCCESS") {
        throw new Error(response.data.message || "Login failed");
      }

      const { access_token, refresh_token, teacher } = response.data;
      localStorage.setItem("access_token", access_token);
      localStorage.setItem("refresh_token", refresh_token);
      localStorage.setItem("teacher", JSON.stringify(teacher));
      setTeacher(teacher);
      toast.success(`Welcome back, ${teacher.firstname}!`);
    } catch (error: any) {
      const message =
        error.response?.data?.message || error.message || "Login failed";
      toast.error(message);
      throw error;
    }
  };

  const signup = async (data: SignupData) => {
    try {
      const signupResponse = await api.post("/auth/register", data);
      if (
        signupResponse.data.status !== "CREATED" &&
        signupResponse.data.status !== "SUCCESS"
      ) {
        throw new Error(signupResponse.data.message || "Signup failed");
      }

      await login(data.email, data.password);
      toast.success("Account created successfully!");
    } catch (error: any) {
      const message =
        error.response?.data?.message || error.message || "Signup failed";
      toast.error(message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.log("Logout error (ignored):", error);
    }
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("teacher");
    setTeacher(null);
    toast.success("Logged out successfully!");
  };

  const updateTeacher = (updatedTeacher: Teacher) => {
    setTeacher(updatedTeacher);
    localStorage.setItem("teacher", JSON.stringify(updatedTeacher));
  };

  return (
    <AuthContext.Provider
      value={{
        teacher,
        isLoading,
        login,
        signup,
        logout,
        updateTeacher,
        fetchMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
