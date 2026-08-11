import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { api } from "../api/client";
import type { Tenant, Owner, AuthResponse } from "../types";

interface AuthContextValue {
  token: string | null;
  tenant: Tenant | null;
  owner: Owner | null;
  tenantType: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStored<T>(key: string): T | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("easyapps_token"));
  const [tenant, setTenant] = useState<Tenant | null>(() => readStored<Tenant>("easyapps_tenant"));
  const [owner, setOwner] = useState<Owner | null>(() => readStored<Owner>("easyapps_owner"));
  const [tenantType, setTenantType] = useState<string | null>(() => localStorage.getItem("easyapps_type"));

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<AuthResponse>("/tenant-auth/email-login", { email, password });
    localStorage.setItem("easyapps_token", data.token);
    localStorage.setItem("easyapps_tenant", JSON.stringify(data.tenant));
    localStorage.setItem("easyapps_owner", JSON.stringify(data.owner));
    localStorage.setItem("easyapps_type", data.type || "");
    setToken(data.token);
    setTenant(data.tenant);
    setOwner(data.owner);
    setTenantType(data.type || "");
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("easyapps_token");
    localStorage.removeItem("easyapps_tenant");
    localStorage.removeItem("easyapps_owner");
    localStorage.removeItem("easyapps_type");
    setToken(null);
    setTenant(null);
    setOwner(null);
    setTenantType(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ token, tenant, owner, tenantType, isAuthenticated: !!token, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
