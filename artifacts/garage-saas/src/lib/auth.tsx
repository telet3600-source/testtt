import { createContext, useContext, useEffect } from "react";
import { useLocation } from "wouter";
import { useGetStaffMe, useStaffLogout, StaffUser } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

interface AuthContextType {
  user: StaffUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();
  const { data: user, isLoading } = useGetStaffMe({ query: { retry: false } });
  const logoutMutation = useStaffLogout();

  const logout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => { qc.clear(); window.location.href = "/login"; },
      onSettled: () => { qc.clear(); window.location.href = "/login"; },
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user: user ?? null, isLoading, isAuthenticated: !!user, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
