import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { authenticateEmployee, setEmployeeSession } from "@/services/employeeAuthService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import Footer from "@/components/Footer";
import { Building2 } from "lucide-react";

export default function EmployeeLogin() {
  const { t, language, setLanguage } = useLanguage();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error'>('error');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const employee = await authenticateEmployee(username, password);

    if (!employee) {
      setMessage(t("auth.employeeLogin.invalid") || "Geçersiz kullanıcı adı veya şifre");
      setMessageType('error');
      setLoading(false);
      return;
    }

    // Store employee session
    setEmployeeSession(employee);
    
    // Navigate to employee dashboard
    navigate("/employee/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100 relative">
      {/* Language Selector and Company Login Button */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Link to="/login">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            {t("auth.employeeLogin.companyLogin") || "Şirket Girişi"}
          </Button>
        </Link>
        <select
          value={language}
          onChange={(e) => {
            const newLang = e.target.value as "tr" | "en";
            setLanguage(newLang);
          }}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          <option value="tr">🇹🇷 TR</option>
          <option value="en">🇬🇧 EN</option>
        </select>
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <img src="/logo.png" alt="QR Card" className="h-28 w-auto" />
            </div>
            <CardDescription className="text-center">
              {t("auth.employeeLogin.subtitle") || "Çalışan hesabınıza giriş yapın"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {message && (
                <div className={`p-3 text-sm rounded-md border ${
                  messageType === 'success' 
                    ? 'text-green-700 bg-green-50 border-green-200' 
                    : 'text-red-600 bg-red-50 border-red-200'
                }`}>
                  {message}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="username">{t("auth.employeeLogin.username") || "Kullanıcı Adı"}</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="kullaniciadi"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t("auth.employeeLogin.password") || "Şifre"}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (t("auth.employeeLogin.loading") || "Giriş yapılıyor...") : (t("auth.employeeLogin.submit") || "Giriş Yap")}
              </Button>
              <div className="text-center text-sm">
                <Link to="/login" className="text-primary hover:underline">
                  {t("auth.employeeLogin.backToCompany") || "Şirket girişine dön"}
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}

