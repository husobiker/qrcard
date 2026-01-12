import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { getCompanyByUserId } from "@/services/companyService";
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
import { User } from "lucide-react";

export default function Login() {
  const { t, language, setLanguage } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error">("error");
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in and set language
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        getCompanyByUserId(session.user.id).then((company) => {
          if (company?.language) {
            setLanguage(company.language);
          }
        });
      }
    });
  }, [setLanguage]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(t("auth.login.error"));
      setMessageType("error");
      setLoading(false);
    } else if (data.user) {
      // Load company and set language
      const company = await getCompanyByUserId(data.user.id);
      if (company?.language) {
        setLanguage(company.language);
      }
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100 relative">
      {/* Language Selector and Employee Login Button */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Link to="/employee-login">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <User className="h-4 w-4" />
            {t("auth.login.employeeLogin") || "Çalışan Girişi"}
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
              <img src="/crew.png" alt="QR Card" className="h-28 w-auto" />
            </div>
            <CardDescription className="text-center">
              {t("auth.login.subtitle")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {message && (
                <div
                  className={`p-3 text-sm rounded-md border ${
                    messageType === "success"
                      ? "text-green-700 bg-green-50 border-green-200"
                      : "text-red-600 bg-red-50 border-red-200"
                  }`}
                >
                  {message}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.login.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="company@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t("auth.login.password")}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t("auth.login.loading") : t("auth.login.submit")}
              </Button>
              <div className="text-center text-sm space-y-2">
                <Link
                  to="/forgot-password"
                  className="text-primary hover:underline"
                >
                  {t("auth.login.forgot")}
                </Link>
                <div>
                  {t("auth.login.noAccount")}{" "}
                  <Link to="/signup" className="text-primary hover:underline">
                    {t("auth.login.signup")}
                  </Link>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
