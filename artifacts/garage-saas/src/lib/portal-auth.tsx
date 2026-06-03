import { createContext, useContext } from "react";
import { useGetPortalMe, usePortalLogout, PortalCustomer } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

interface PortalAuthContextType {
  customer: PortalCustomer | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => void;
}

const PortalAuthContext = createContext<PortalAuthContextType | undefined>(undefined);

export function PortalAuthProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();
  const { data: customer, isLoading } = useGetPortalMe({ query: { retry: false } });
  const logoutMutation = usePortalLogout();

  const logout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => { qc.clear(); window.location.href = "/portal/login"; },
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
    <PortalAuthContext.Provider value={{ customer: customer ?? null, isLoading, isAuthenticated: !!customer, logout }}>
      {children}
    </PortalAuthContext.Provider>
  );
}

export function usePortalAuth() {
  const context = useContext(PortalAuthContext);
  if (context === undefined) throw new Error("usePortalAuth must be used within a PortalAuthProvider");
  return context;
}
