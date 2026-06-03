import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { useStaffLogout } from "@workspace/api-client-react";
import { 
  LayoutDashboard, 
  Users, 
  Car, 
  ClipboardList, 
  FileText, 
  Wrench, 
  BarChart3, 
  Settings,
  LogOut,
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/dashboard", label: "الرئيسية", icon: LayoutDashboard },
  { href: "/orders", label: "الطلبات", icon: ClipboardList },
  { href: "/customers", label: "العملاء", icon: Users },
  { href: "/vehicles", label: "المركبات", icon: Car },
  { href: "/invoices", label: "الفواتير", icon: FileText },
  { href: "/technicians", label: "الفنيين", icon: Wrench },
  { href: "/reports", label: "التقارير", icon: BarChart3 },
  { href: "/settings", label: "الإعدادات", icon: Settings },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [location, setLocation] = useLocation();
  const logoutMutation = useStaffLogout();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/login");
    } else if (!isLoading && user?.role === "technician") {
      setLocation("/tech/orders");
    }
  }, [isAuthenticated, isLoading, setLocation, user]);

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        window.location.href = "/login";
      }
    });
  };

  if (isLoading || !isAuthenticated) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground" dir="rtl">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-l border-border bg-card md:flex">
        <div className="flex h-16 items-center justify-center border-b border-border px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/20">
              <Wrench className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-foreground">جراج برو</h1>
          </div>
        </div>
        
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {NAV_ITEMS.map((item) => {
            const isActive = location.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <div className={`flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}>
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>
        
        <div className="border-t border-border p-4">
          <div className="mb-4 flex items-center gap-3 px-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
              <span className="font-semibold text-secondary-foreground">
                {user?.fullName?.substring(0, 2).toUpperCase() || "م"}
              </span>
            </div>
            <div className="overflow-hidden">
              <p className="truncate text-sm font-medium text-foreground">{user?.fullName}</p>
              <p className="truncate text-xs text-muted-foreground">{user?.role === "admin" ? "مدير النظام" : "موظف"}</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="h-4 w-4" />
            تسجيل الخروج
          </Button>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 md:px-6">
          <div className="flex items-center gap-4 md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-bold">جراج برو</h1>
            </div>
          </div>
          
          <div className="hidden md:block">
            {/* Context-specific header content could go here */}
          </div>
          
          <div className="flex items-center gap-4">
            {/* Top nav actions like notifications could go here */}
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
