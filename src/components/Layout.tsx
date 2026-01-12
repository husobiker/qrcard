import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/supabase/client";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  Users,
  Building2,
  Calendar,
  TrendingUp,
  BarChart3,
  CheckSquare,
  Target,
  DollarSign,
  MessageSquare,
  Percent,
  Phone,
  ChevronDown,
  ChevronUp,
  Car,
} from "lucide-react";
import Footer from "./Footer";
import { useLanguage } from "@/contexts/LanguageContext";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, setLanguage, t } = useLanguage();
  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({
    sales: false,
    tasks: false,
    financial: false,
  });
  const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const toggleMenu = (menuKey: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [menuKey]: !prev[menuKey],
    }));
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      Object.keys(menuRefs.current).forEach((key) => {
        if (
          menuRefs.current[key] &&
          !menuRefs.current[key]?.contains(event.target as Node)
        ) {
          setOpenMenus((prev) => ({
            ...prev,
            [key]: false,
          }));
        }
      });
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="border-b">
        <div className="container mx-auto px-6 max-w-[1920px]">
          <div className="flex h-24 items-center justify-between">
            <div className="flex items-center space-x-12">
              <Link to="/dashboard" className="flex items-center">
                <img src="/crew.png" alt="QR Card" className="h-24 w-auto" />
              </Link>
              <div className="flex items-center space-x-2">
                {/* Genel */}
                <Link
                  to="/dashboard"
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive("/dashboard")
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Building2 className="h-4 w-4" />
                  <span>{t("common.company")}</span>
                </Link>
                <Link
                  to="/dashboard/employees"
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive("/dashboard/employees")
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Users className="h-4 w-4" />
                  <span>{t("common.employees")}</span>
                </Link>
                <Link
                  to="/dashboard/calendar"
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive("/dashboard/calendar")
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Calendar className="h-4 w-4" />
                  <span>{t("common.calendar")}</span>
                </Link>
                <Link
                  to="/dashboard/vehicles"
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive("/dashboard/vehicles")
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Car className="h-4 w-4" />
                  <span>Araç Takip</span>
                </Link>

                {/* Satış & Müşteri */}
                <div
                  ref={(el) => (menuRefs.current["sales"] = el)}
                  className="relative group"
                >
                  <button
                    onClick={() => toggleMenu("sales")}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive("/dashboard/crm") ||
                      isActive("/dashboard/communications") ||
                      isActive("/dashboard/call-logs")
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <TrendingUp className="h-4 w-4" />
                    <span>Satış & Müşteri</span>
                    {openMenus.sales ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </button>
                  {openMenus.sales && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[200px] z-50">
                      <Link
                        to="/dashboard/crm"
                        className={`flex items-center space-x-2 px-4 py-2 text-sm transition-colors ${
                          isActive("/dashboard/crm")
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        <TrendingUp className="h-4 w-4" />
                        <span>{t("common.crm") || "Satış Takibi"}</span>
                      </Link>
                      <Link
                        to="/dashboard/communications"
                        className={`flex items-center space-x-2 px-4 py-2 text-sm transition-colors ${
                          isActive("/dashboard/communications")
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        <MessageSquare className="h-4 w-4" />
                        <span>İletişim</span>
                      </Link>
                      <Link
                        to="/dashboard/call-logs"
                        className={`flex items-center space-x-2 px-4 py-2 text-sm transition-colors ${
                          isActive("/dashboard/call-logs")
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        <Phone className="h-4 w-4" />
                        <span>Arama Geçmişi</span>
                      </Link>
                    </div>
                  )}
                </div>

                {/* Görevler & Hedefler */}
                <div
                  ref={(el) => (menuRefs.current["tasks"] = el)}
                  className="relative group"
                >
                  <button
                    onClick={() => toggleMenu("tasks")}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive("/dashboard/tasks") ||
                      isActive("/dashboard/goals")
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <CheckSquare className="h-4 w-4" />
                    <span>Görevler & Hedefler</span>
                    {openMenus.tasks ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </button>
                  {openMenus.tasks && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[200px] z-50">
                      <Link
                        to="/dashboard/tasks"
                        className={`flex items-center space-x-2 px-4 py-2 text-sm transition-colors ${
                          isActive("/dashboard/tasks")
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        <CheckSquare className="h-4 w-4" />
                        <span>Görevler</span>
                      </Link>
                      <Link
                        to="/dashboard/goals"
                        className={`flex items-center space-x-2 px-4 py-2 text-sm transition-colors ${
                          isActive("/dashboard/goals")
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        <Target className="h-4 w-4" />
                        <span>Hedefler</span>
                      </Link>
                    </div>
                  )}
                </div>

                {/* Finansal */}
                <div
                  ref={(el) => (menuRefs.current["financial"] = el)}
                  className="relative group"
                >
                  <button
                    onClick={() => toggleMenu("financial")}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive("/dashboard/transactions") ||
                      isActive("/dashboard/commissions")
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <DollarSign className="h-4 w-4" />
                    <span>Finansal</span>
                    {openMenus.financial ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </button>
                  {openMenus.financial && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[200px] z-50">
                      <Link
                        to="/dashboard/transactions"
                        className={`flex items-center space-x-2 px-4 py-2 text-sm transition-colors ${
                          isActive("/dashboard/transactions")
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        <DollarSign className="h-4 w-4" />
                        <span>İşlemler</span>
                      </Link>
                      <Link
                        to="/dashboard/commissions"
                        className={`flex items-center space-x-2 px-4 py-2 text-sm transition-colors ${
                          isActive("/dashboard/commissions")
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        <Percent className="h-4 w-4" />
                        <span>Komisyon</span>
                      </Link>
                    </div>
                  )}
                </div>

                {/* Raporlar */}
                <Link
                  to="/dashboard/reports"
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive("/dashboard/reports")
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>{t("common.reports") || "Raporlar"}</span>
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
                {t("common.logout")}
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
