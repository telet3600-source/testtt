import { Link, useLocation } from "wouter";
import { usePortalAuth } from "@/lib/portal-auth";
import { Car, ClipboardList, DollarSign, Home, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/portal/dashboard", label: "الرئيسية", icon: Home },
  { href: "/portal/orders", label: "طلباتي", icon: ClipboardList },
  { href: "/portal/vehicles", label: "مركباتي", icon: Car },
  { href: "/portal/balance", label: "الرصيد", icon: DollarSign },
];

export function PortalLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { customer, logout } = usePortalAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      {/* Header */}
      <header className="border-b border-border bg-card/50 sticky top-0 z-10 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 h-14 max-w-2xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <Car className="h-5 w-5 text-primary" />
            <span className="font-bold text-sm">بوابة العميل</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:block">{customer?.fullName}</span>
            <Button variant="ghost" size="icon" onClick={logout} title="خروج">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full">
        {children}
      </main>

      {/* Bottom nav */}
      <nav className="border-t border-border bg-card/90 backdrop-blur-sm sticky bottom-0">
        <div className="flex max-w-2xl mx-auto">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = location === item.href || location.startsWith(item.href + "/");
            return (
              <Link key={item.href} href={item.href} className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-xs transition-colors ${isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
