import { useEffect, useState } from "react";
import { getEmployeeSession } from "@/services/employeeAuthService";
import { getEmployeeById } from "@/services/employeeService";
import { getCompanyById } from "@/services/companyService";
import type { Employee, Company } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import {
  Phone,
  Mail,
  Instagram,
  Linkedin,
  Facebook,
  Youtube,
  MessageCircle,
  Building2,
  Download,
  Share2,
  MapPin,
  Globe,
  Navigation,
  ExternalLink,
  Calendar,
} from "lucide-react";
import QRCode from "react-qr-code";
import { useLanguage } from "@/contexts/LanguageContext";
import { getEmployeePublicUrl } from "@/utils/url";
import { Button } from "@/components/ui/button";

export default function EmployeeDashboard() {
  const { t } = useLanguage();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const sessionEmployee = getEmployeeSession();
    if (!sessionEmployee) {
      setLoading(false);
      return;
    }

    // Load full employee data
    const fullEmployee = await getEmployeeById(sessionEmployee.id);
    if (fullEmployee) {
      setEmployee(fullEmployee);
      
      // Load company data
      const companyData = await getCompanyById(fullEmployee.company_id);
      if (companyData) {
        setCompany(companyData);
      }
    }
    setLoading(false);
  };

  const getPublicUrl = () => {
    if (!employee || !company) return "";
    return getEmployeePublicUrl(company.id, employee.id);
  };

  const handleShare = async () => {
    const url = getPublicUrl();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${employee?.first_name} ${employee?.last_name}`,
          text: `${employee?.first_name} ${employee?.last_name} - ${company?.name}`,
          url: url,
        });
      } catch (error) {
        // User cancelled or error occurred
        navigator.clipboard.writeText(url);
      }
    } else {
      navigator.clipboard.writeText(url);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!employee || !company) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center text-red-600">
          {t("employee.dashboard.notFound") || "Employee not found"}
        </div>
      </div>
    );
  }

  const publicUrl = getPublicUrl();
  const socialLinks = employee.social_links || {};

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {t("employee.dashboard.title") || "My Profile"}
        </h1>
        <p className="text-gray-600 mt-2">
          {t("employee.dashboard.subtitle") || "View your digital business card"}
        </p>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Profile Image */}
            <div className="flex-shrink-0">
              {employee.profile_image_url ? (
                <img
                  src={employee.profile_image_url}
                  alt={`${employee.first_name} ${employee.last_name}`}
                  className="w-32 h-32 rounded-full object-cover shadow-lg"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-4xl text-gray-400">
                    {employee.first_name.charAt(0)}
                    {employee.last_name.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            {/* Employee Info */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">
                {employee.first_name} {employee.last_name}
              </h2>
              {employee.job_title && (
                <p className="text-lg text-gray-600 mt-1">{employee.job_title}</p>
              )}
              {employee.department && (
                <p className="text-sm text-gray-500 mt-1">{employee.department}</p>
              )}

              {/* Contact Info */}
              <div className="mt-4 space-y-2">
                {employee.phone && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone className="h-4 w-4" />
                    <a href={`tel:${employee.phone}`} className="hover:text-blue-600">
                      {employee.phone}
                    </a>
                  </div>
                )}
                {employee.email && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Mail className="h-4 w-4" />
                    <a href={`mailto:${employee.email}`} className="hover:text-blue-600">
                      {employee.email}
                    </a>
                  </div>
                )}
              </div>

              {/* Social Links */}
              {(socialLinks.instagram ||
                socialLinks.linkedin ||
                socialLinks.facebook ||
                socialLinks.youtube ||
                socialLinks.whatsapp) && (
                <div className="mt-4 flex gap-2">
                  {socialLinks.instagram && (
                    <a
                      href={socialLinks.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-pink-100 text-pink-600 rounded-lg hover:bg-pink-200 transition-colors"
                    >
                      <Instagram className="h-5 w-5" />
                    </a>
                  )}
                  {socialLinks.linkedin && (
                    <a
                      href={socialLinks.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      <Linkedin className="h-5 w-5" />
                    </a>
                  )}
                  {socialLinks.facebook && (
                    <a
                      href={socialLinks.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      <Facebook className="h-5 w-5" />
                    </a>
                  )}
                  {socialLinks.youtube && (
                    <a
                      href={socialLinks.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      <Youtube className="h-5 w-5" />
                    </a>
                  )}
                  {socialLinks.whatsapp && (
                    <a
                      href={`https://wa.me/${socialLinks.whatsapp.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                    >
                      <MessageCircle className="h-5 w-5" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* About Section */}
          {employee.about && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t("profile.about") || "About"}
              </h3>
              <p className="text-gray-700 whitespace-pre-line">{employee.about}</p>
            </div>
          )}

          {/* Company Info */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">{company.name}</h3>
            </div>
            {company.address && (
              <div className="flex items-start gap-2 text-gray-600 mt-2">
                <MapPin className="h-4 w-4 mt-0.5" />
                <span>{company.address}</span>
              </div>
            )}
            {company.phone && (
              <div className="flex items-center gap-2 text-gray-600 mt-2">
                <Phone className="h-4 w-4" />
                <span>{company.phone}</span>
              </div>
            )}
            {company.website && (
              <div className="flex items-center gap-2 text-gray-600 mt-2">
                <Globe className="h-4 w-4" />
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-600 flex items-center gap-1"
                >
                  {company.website}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* QR Code Card */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {t("employee.dashboard.qrCode") || "Your QR Code"}
          </h3>
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <QRCode value={publicUrl} size={200} />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-2">
                {t("employee.dashboard.qrDescription") || "Share this QR code to let people access your digital business card"}
              </p>
              <div className="bg-gray-50 p-3 rounded-lg mb-4">
                <p className="text-xs text-gray-500 mb-1">Public URL:</p>
                <p className="text-sm text-gray-900 break-all">{publicUrl}</p>
              </div>
              <Button onClick={handleShare} className="w-full md:w-auto">
                <Share2 className="h-4 w-4 mr-2" />
                {t("employee.dashboard.share") || "Share"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

