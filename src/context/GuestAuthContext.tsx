import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "../lib/api";

/**
 * Auth context for the guest/traveler side of the site — distinct from
 * the existing AuthContext (which, despite its generic name, is actually
 * the vendor session context) and AdminAuthContext. Guests authenticate
 * with a bearer JWT (see authenticateUser in the backend), not a cookie
 * session, so this context persists the token in localStorage itself
 * rather than relying on withCredentials.
 */

interface GuestUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
}

interface GuestAuthContextType {
  user: GuestUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: GuestUser) => void;
  logout: () => void;
}

const GuestAuthContext = createContext<GuestAuthContextType | undefined>(undefined);

const TOKEN_KEY = "prostayz_guest_token";

export const GuestAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<GuestUser | null>(null);
  const [loading, setLoading] = useState(true);

  const verify = async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get("/user/verify/me");
      if (data.success) {
        setUser(data.user);
      } else {
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
      }
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verify();
  }, []);

  const login = (token: string, userData: GuestUser) => {
    localStorage.setItem(TOKEN_KEY, token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  return (
    <GuestAuthContext.Provider value={{ user, loading, isAuthenticated: !!user, login, logout }}>
      {children}
    </GuestAuthContext.Provider>
  );
};

export const useGuestAuth = () => {
  const ctx = useContext(GuestAuthContext);
  if (!ctx) throw new Error("useGuestAuth must be used inside GuestAuthProvider");
  return ctx;
};
