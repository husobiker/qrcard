import { Link, useNavigate } from "react-router-dom";
import {
  getEmployeeSession,
  clearEmployeeSession,
} from "@/services/employeeAuthService";
import { useLanguage } from "@/contexts/LanguageContext";
import { LogOut, Calendar, User, TrendingUp, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";

interface EmployeeLayoutProps {
  children: React.ReactNode;
}

export default function EmployeeLayout({ children }: EmployeeLayoutProps) {
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const employee = getEmployeeSession();

  const handleLogout = () => {
    clearEmployeeSession();
    navigate("/employee-login");
  };

  if (!employee) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="border-b">
        <div className="container mx-auto px-6 max-w-[1920px]">
          <div className="flex h-24 items-center justify-between">
            <div className="flex items-center space-x-12">
              <Link to="/employee/dashboard" className="flex items-center">
                <img src="/logo.png" alt="QR Card" className="h-24 w-auto" />
              </Link>
              <div className="flex items-center space-x-4">
                <Link
                  to="/employee/dashboard"
                  className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  <User className="h-4 w-4" />
                  <span>{t("employee.nav.profile") || "Profilim"}</span>
                </Link>
                <Link
                  to="/employee/calendar"
                  className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  <Calendar className="h-4 w-4" />
                  <span>{t("employee.nav.calendar") || "Takvim"}</span>
                </Link>
                <Link
                  to="/employee/crm"
                  className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  <TrendingUp className="h-4 w-4" />
                  <span>{t("employee.nav.crm") || "Satış Takibi"}</span>
                </Link>
                <Link
                  to="/employee/reports"
                  className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>{t("employee.nav.reports") || "Raporlar"}</span>
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
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
              <Button variant="ghost" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                {t("common.logout") || "Çıkış"}
              </Button>
            </div>
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-8 flex-1">{children}</main>
      <Footer />
    </div>
  );
}
