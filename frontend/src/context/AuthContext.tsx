import React, { createContext, useContext, useState, useEffect } from "react";

import { readApiError } from "../utils/apiError";

//matches sql schema
export interface User {
  user_id: number;
  username: string;
  contact_info?: string | null;
  campus_schedule?: string;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, password: string, contactInfo?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || "";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // check active session on initial load
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          method: "GET",
          credentials: "include", // send secure session cookies
        });
        if (response.ok) {
          const data = await response.json();
          setUser(data.user || null);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Failed to verify active session:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // send secure session cookies
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      if (response.ok && data.user) {
        setUser(data.user);
        return { success: true };
      }
      return { success: false, error: readApiError(data, "Login failed.") };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: "Network error during login." };
    }
  };

  const register = async (username: string, password: string, contactInfo?: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // send secure session cookies
        body: JSON.stringify({ username, password, contactInfo }),
      });

      const data = await response.json();
      if (response.ok && data.user) {
        setUser(data.user);
        return { success: true };
      }
      return { success: false, error: readApiError(data, "Registration failed.") };
    } catch (error) {
      console.error("Registration error:", error);
      return { success: false, error: "Network error during registration." };
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
