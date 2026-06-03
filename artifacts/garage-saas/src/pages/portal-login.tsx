import { useState } from "react";
import { useLocation } from "wouter";
import { usePortalLogin } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Car, Phone } from "lucide-react";

export default function PortalLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const loginMutation = usePortalLogin();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ data: { phone, password } }, {
      onSuccess: () => {
        setLocation("/portal/dashboard");
        window.location.reload();
      },
      onError: () => toast({ title: "بيانات الدخول غير صحيحة", variant: "destructive" }),
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background" dir="rtl">
      <div className="w-full max-w-md space-y-6 px-4">
        <div className="text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
            <Car className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">بوابة العميل</h1>
          <p className="text-muted-foreground mt-1">تابع سيارتك وفواتيرك</p>
        </div>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="phone">رقم الهاتف</Label>
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    dir="ltr"
                    className="pr-10"
                    placeholder="05xxxxxxxx"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    data-testid="input-portal-phone"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">كلمة المرور</Label>
                <Input
                  id="password"
                  type="password"
                  dir="ltr"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  data-testid="input-portal-password"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loginMutation.isPending} data-testid="button-portal-login">
                {loginMutation.isPending ? "جاري الدخول..." : "دخول"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          <button onClick={() => setLocation("/login")} className="text-primary hover:underline">دخول لوحة الإدارة</button>
        </p>
      </div>
    </div>
  );
}
