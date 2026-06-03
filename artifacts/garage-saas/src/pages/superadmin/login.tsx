import { useState } from "react";
import { useLocation } from "wouter";
import { useSuperAdminLogin } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Shield } from "lucide-react";

export default function SuperAdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const loginMutation = useSuperAdminLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ data: { email, password } }, {
      onSuccess: () => { setLocation("/superadmin/dashboard"); window.location.reload(); },
      onError: () => toast({ title: "بيانات غير صحيحة", variant: "destructive" }),
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background" dir="rtl">
      <Card className="w-full max-w-sm border-border/50">
        <CardHeader className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 mx-auto mb-3">
            <Shield className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>لوحة التحكم العليا</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5"><Label>البريد</Label><Input type="email" dir="ltr" value={email} onChange={e => setEmail(e.target.value)} data-testid="input-sa-email" /></div>
            <div className="space-y-1.5"><Label>كلمة المرور</Label><Input type="password" dir="ltr" value={password} onChange={e => setPassword(e.target.value)} data-testid="input-sa-password" /></div>
            <Button type="submit" className="w-full" disabled={loginMutation.isPending}>دخول</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
