import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { PortalAuthProvider, usePortalAuth } from "@/lib/portal-auth";
import NotFound from "@/pages/not-found";

import Login from "@/pages/login";
import PortalLogin from "@/pages/portal-login";
import Track from "@/pages/track";
import { AdminLayout } from "@/components/layout/admin-layout";
import { PortalLayout } from "@/components/layout/portal-layout";

import Dashboard from "@/pages/admin/dashboard";
import Customers from "@/pages/admin/customers";
import CustomerDetail from "@/pages/admin/customer-detail";
import Orders from "@/pages/admin/orders";
import NewOrder from "@/pages/admin/new-order";
import OrderDetail from "@/pages/admin/order-detail";
import Invoices from "@/pages/admin/invoices";
import InvoiceDetail from "@/pages/admin/invoice-detail";
import Technicians from "@/pages/admin/technicians";
import Vehicles from "@/pages/admin/vehicles";
import Reports from "@/pages/admin/reports";

import PortalDashboard from "@/pages/portal/dashboard";
import PortalOrders from "@/pages/portal/orders";
import PortalOrderDetail from "@/pages/portal/order-detail";
import PortalVehicles from "@/pages/portal/vehicles";
import PortalVehicleHistory from "@/pages/portal/vehicle-history";
import PortalBalance from "@/pages/portal/balance";

import TechOrders from "@/pages/tech/orders";

import SuperAdminLogin from "@/pages/superadmin/login";
import SuperAdminDashboard from "@/pages/superadmin/dashboard";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <div className="dark min-h-screen bg-background text-foreground" dir="rtl">
      {children}
    </div>
  );
}

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  if (!isAuthenticated) { setLocation("/login"); return null; }
  return <>{children}</>;
}

function PortalGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = usePortalAuth();
  const [, setLocation] = useLocation();
  if (!isAuthenticated) { setLocation("/portal/login"); return null; }
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => { window.location.href = "/login"; return null; }} />

      <Route path="/login" component={Login} />
      <Route path="/portal/login" component={PortalLogin} />
      <Route path="/superadmin/login" component={SuperAdminLogin} />
      <Route path="/track/:token" component={Track} />

      <Route path="/superadmin/dashboard" component={SuperAdminDashboard} />
      <Route path="/tech/orders" component={TechOrders} />

      <Route path="/dashboard">
        <AdminGuard><AdminLayout><Dashboard /></AdminLayout></AdminGuard>
      </Route>
      <Route path="/customers/:id">
        {() => <AdminGuard><AdminLayout><CustomerDetail /></AdminLayout></AdminGuard>}
      </Route>
      <Route path="/customers">
        <AdminGuard><AdminLayout><Customers /></AdminLayout></AdminGuard>
      </Route>
      <Route path="/orders/new">
        <AdminGuard><AdminLayout><NewOrder /></AdminLayout></AdminGuard>
      </Route>
      <Route path="/orders/:id">
        {() => <AdminGuard><AdminLayout><OrderDetail /></AdminLayout></AdminGuard>}
      </Route>
      <Route path="/orders">
        <AdminGuard><AdminLayout><Orders /></AdminLayout></AdminGuard>
      </Route>
      <Route path="/invoices/:id">
        {() => <AdminGuard><AdminLayout><InvoiceDetail /></AdminLayout></AdminGuard>}
      </Route>
      <Route path="/invoices">
        <AdminGuard><AdminLayout><Invoices /></AdminLayout></AdminGuard>
      </Route>
      <Route path="/technicians">
        <AdminGuard><AdminLayout><Technicians /></AdminLayout></AdminGuard>
      </Route>
      <Route path="/vehicles">
        <AdminGuard><AdminLayout><Vehicles /></AdminLayout></AdminGuard>
      </Route>
      <Route path="/reports">
        <AdminGuard><AdminLayout><Reports /></AdminLayout></AdminGuard>
      </Route>

      <Route path="/portal/dashboard">
        <PortalGuard><PortalLayout><PortalDashboard /></PortalLayout></PortalGuard>
      </Route>
      <Route path="/portal/orders/:id">
        {() => <PortalGuard><PortalLayout><PortalOrderDetail /></PortalLayout></PortalGuard>}
      </Route>
      <Route path="/portal/orders">
        <PortalGuard><PortalLayout><PortalOrders /></PortalLayout></PortalGuard>
      </Route>
      <Route path="/portal/vehicles/:id">
        {() => <PortalGuard><PortalLayout><PortalVehicleHistory /></PortalLayout></PortalGuard>}
      </Route>
      <Route path="/portal/vehicles">
        <PortalGuard><PortalLayout><PortalVehicles /></PortalLayout></PortalGuard>
      </Route>
      <Route path="/portal/balance">
        <PortalGuard><PortalLayout><PortalBalance /></PortalLayout></PortalGuard>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AuthProvider>
              <PortalAuthProvider>
                <Router />
              </PortalAuthProvider>
            </AuthProvider>
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
