import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, saveToken, clearToken, loadToken } from "./api";

interface RegisterData {
  first_name: string;
  last_name?: string;
  email?: string;
  phone: string;
  country_code: string;
  password: string;
}

export type User = {
  id: string;
  first_name: string;
  email: string;
  role: string;
  created_at?: string;
};

type AuthState = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const token = await loadToken();
      console.log(token);
      if (!token) {
        setUser(null);
        return;
      }
      const me = await api<User>("/user/verify/me", { auth: true });
      setUser(me.user);
    } catch {
      await clearToken();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  const login = async (email: string, password: string) => {
    const res = await api<{ access_token: string; user: User }>("/user/login", {
      method: "POST",
      body: { email, password },
    });
    await saveToken(res.access_token);
    setUser(res.user);
  };

  const register = async (data: RegisterData) => {

    const res = await api<{
      access_token: string;
      refresh_token: string;
      user: User;
    }>("/user/register", {
      method: "POST",
      body: data,
    });

    await saveToken(res.access_token);

    setUser(res.user);
  };

  const logout = async () => {
    await clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
