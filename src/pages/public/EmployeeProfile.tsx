import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getEmployeeByCompanyAndId,
  getEmployeeById,
} from "@/services/employeeService";
import { getCompanyByUserId } from "@/services/companyService";
import type { Employee, Company } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import Footer from "@/components/Footer";
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
import { trackView, trackClick } from "@/services/analyticsService";
import {
  createAppointment,
  getAvailableTimeSlots,
} from "@/services/appointmentService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { getEmployeePublicUrl } from "@/utils/url";

export default function EmployeeProfile() {
  const { companyId, employeeId } = useParams<{
    companyId: string;
    employeeId: string;
  }>();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [appointmentForm, setAppointmentForm] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    loadData();
  }, [companyId, employeeId]);

  useEffect(() => {
    // Only set language from company on first load if user hasn't manually changed it
    const languageManuallyChanged = localStorage.getItem(
      "languageManuallyChanged"
    );
    if (company?.language && !languageManuallyChanged) {
      setLanguage(company.language);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.language]); // Only run when company language changes, not on every render

  useEffect(() => {
    if (employee && company) {
      // Update meta tags for SEO
      document.title = `${employee.first_name} ${employee.last_name} - ${company.name} | QR Card`;

      const metaDescription = document.querySelector(
        'meta[name="description"]'
      );
      if (metaDescription) {
        metaDescription.setAttribute(
          "content",
          `${employee.first_name} ${employee.last_name} - ${
            employee.job_title || "Employee"
          } at ${company.name}. ${employee.about || "Digital business card."}`
        );
      } else {
        const meta = document.createElement("meta");
        meta.name = "description";
        meta.content = `${employee.first_name} ${employee.last_name} - ${
          employee.job_title || "Employee"
        } at ${company.name}. ${employee.about || "Digital business card."}`;
        document.head.appendChild(meta);
      }

      // OG Tags
      const setOGTag = (property: string, content: string) => {
        let meta = document.querySelector(`meta[property="${property}"]`);
        if (!meta) {
          meta = document.createElement("meta");
          meta.setAttribute("property", property);
          document.head.appendChild(meta);
        }
        meta.setAttribute("content", content);
      };

      setOGTag(
        "og:title",
        `${employee.first_name} ${employee.last_name} - ${company.name}`
      );
      setOGTag(
        "og:description",
        employee.about ||
          `${employee.first_name} ${employee.last_name} - ${
            employee.job_title || "Employee"
          } at ${company.name}`
      );
      setOGTag("og:type", "profile");
      if (employee.profile_image_url) {
        setOGTag("og:image", employee.profile_image_url);
      }
      if (company.logo_url) {
        setOGTag("og:image", company.logo_url);
      }
      const publicUrl =
        companyId && employeeId
          ? getEmployeePublicUrl(companyId, employeeId)
          : typeof window !== "undefined"
          ? window.location.href
          : "";
      setOGTag("og:url", publicUrl);
    }
  }, [employee, company]);

  const loadData = async () => {
    if (!employeeId) return;

    try {
      let employeeData: Employee | null = null;

      if (companyId) {
        // Try to find by company ID and employee ID
        employeeData = await getEmployeeByCompanyAndId(companyId, employeeId);
      } else {
        // Fallback: search by employee ID only
        employeeData = await getEmployeeById(employeeId);
      }

      if (employeeData) {
        setEmployee(employeeData);
        // Track view
        trackView(employeeData.id);
        // Try to get company info
        const companyData = await getCompanyByUserId(employeeData.company_id);
        if (companyData) {
          setCompany(companyData);
        }
      }
    } catch (error) {
      console.error("Error loading employee:", error);
    } finally {
      setLoading(false);
    }
  };

  const getWhatsAppUrl = (phone: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    return `https://wa.me/${cleanPhone}`;
  };

  const getPublicUrl = () => {
    if (companyId && employeeId) {
      return getEmployeePublicUrl(companyId, employeeId);
    }
    if (typeof window !== "undefined") {
      return window.location.href;
    }
    return "";
  };

  const generateVCard = () => {
    if (!employee) return "";

    const vcard = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `FN:${employee.first_name} ${employee.last_name}`,
      `N:${employee.last_name};${employee.first_name};;;`,
    ];

    if (employee.job_title) {
      vcard.push(`TITLE:${employee.job_title}`);
    }
    if (company?.name) {
      vcard.push(`ORG:${company.name}`);
    }
    if (employee.phone) {
      vcard.push(`TEL;TYPE=CELL:${employee.phone}`);
    }
    if (employee.email) {
      vcard.push(`EMAIL:${employee.email}`);
    }
    if (company?.address) {
      vcard.push(`ADR;TYPE=WORK:;;${company.address};;;;`);
    }
    if (company?.website) {
      vcard.push(`URL:${company.website}`);
    }
    if (employee.about) {
      vcard.push(`NOTE:${employee.about}`);
    }

    vcard.push("END:VCARD");
    return vcard.join("\n");
  };

  const downloadVCard = () => {
    if (!employee) return;

    const vcard = generateVCard();
    if (!vcard) return;

    const blob = new Blob([vcard], { type: "text/vcard" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${employee.first_name}_${employee.last_name}.vcf`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const shareProfile = async () => {
    if (!employee) return;

    const url = getPublicUrl();
    const title = `${employee.first_name} ${employee.last_name} - ${
      company?.name || "Digital Business Card"
    }`;
    const text = `Check out ${employee.first_name} ${employee.last_name}'s digital business card`;

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
    }
  };

  const socialLinks = employee?.social_links as {
    instagram?: string;
    linkedin?: string;
    facebook?: string;
    youtube?: string;
    whatsapp?: string;
  };

  const extraLinks = (employee?.extra_links || []) as Array<{
    title: string;
    url: string;
    icon?: string;
  }>;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="py-12 text-center">
            <h1 className="text-2xl font-bold mb-2">{t("profile.notFound")}</h1>
            <p className="text-muted-foreground">{t("profile.notFoundDesc")}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <Card className="max-w-3xl mx-auto overflow-hidden shadow-xl border-0 relative">
          {/* Language Selector */}
          <div className="absolute top-4 right-4 z-20">
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
          <CardContent className="p-0">
            {/* Top Section with Background Image */}
            <div
              className="relative min-h-[400px] flex items-center justify-center"
              style={
                company?.background_image_url
                  ? {
                      backgroundImage: `url(${company.background_image_url})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      backgroundRepeat: "no-repeat",
                    }
                  : {
                      background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    }
              }
            >
              {/* Overlay */}
              <div
                className={`absolute inset-0 ${
                  company?.background_image_url
                    ? "bg-white/85"
                    : "bg-gradient-to-br from-blue-600/90 to-indigo-700/90"
                }`}
              />

              <div className="relative z-10 w-full px-6 py-12 text-center">
                {/* Company Logo */}
                {company?.logo_url && (
                  <div className="mb-8">
                    <img
                      src={company.logo_url}
                      alt={company.name}
                      className="h-20 mx-auto object-contain drop-shadow-lg"
                    />
                  </div>
                )}

                {/* Profile Picture */}
                <div className="mb-6">
                  {employee.profile_image_url ? (
                    <img
                      src={employee.profile_image_url}
                      alt={`${employee.first_name} ${employee.last_name}`}
                      className="h-40 w-40 rounded-full mx-auto object-cover border-4 border-white shadow-2xl"
                    />
                  ) : (
                    <div className="h-40 w-40 rounded-full mx-auto bg-white/20 backdrop-blur-sm flex items-center justify-center border-4 border-white shadow-2xl">
                      <span className="text-5xl font-bold text-white">
                        {employee.first_name[0]}
                        {employee.last_name[0]}
                      </span>
                    </div>
                  )}
                </div>

                {/* Name and Title */}
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
                  {employee.first_name} {employee.last_name}
                </h1>

                {employee.job_title && (
                  <p className="text-xl md:text-2xl text-gray-700 font-medium mb-2">
                    {employee.job_title}
                  </p>
                )}

                {employee.department && (
                  <p className="text-lg text-gray-600 mb-4">
                    {employee.department}
                  </p>
                )}

                {company && (
                  <div className="flex items-center justify-center space-x-2 mt-4">
                    <Building2 className="h-5 w-5 text-gray-600" />
                    <span className="text-gray-700 font-medium">
                      {company.name}
                    </span>
                  </div>
                )}

                {/* Contact Buttons */}
                {(employee.phone || employee.email) && (
                  <div className="flex flex-wrap gap-3 justify-center mt-8">
                    {employee.phone && (
                      <a
                        href={`tel:${employee.phone}`}
                        onClick={() =>
                          employee && trackClick(employee.id, { type: "phone" })
                        }
                        className="inline-flex items-center justify-center rounded-lg bg-white/95 backdrop-blur-sm text-gray-900 font-medium px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 space-x-2 border border-gray-200"
                      >
                        <Phone className="h-5 w-5" />
                        <span>{t("profile.call")}</span>
                      </a>
                    )}
                    {employee.email && (
                      <a
                        href={`mailto:${employee.email}`}
                        onClick={() =>
                          employee && trackClick(employee.id, { type: "email" })
                        }
                        className="inline-flex items-center justify-center rounded-lg bg-white/95 backdrop-blur-sm text-gray-900 font-medium px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 space-x-2 border border-gray-200"
                      >
                        <Mail className="h-5 w-5" />
                        <span>{t("profile.email")}</span>
                      </a>
                    )}
                    {employee.phone && (
                      <a
                        href={getWhatsAppUrl(employee.phone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() =>
                          employee &&
                          trackClick(employee.id, { type: "whatsapp" })
                        }
                        className="inline-flex items-center justify-center rounded-lg bg-white/95 backdrop-blur-sm text-gray-900 font-medium px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 space-x-2 border border-gray-200"
                      >
                        <MessageCircle className="h-5 w-5" />
                        <span>{t("profile.whatsapp")}</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Section - About and below (normal background) */}
            <div className="bg-white px-8 md:px-12 py-8">
              {employee.about && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                    {t("profile.about")}
                  </h2>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {employee.about}
                  </p>
                </div>
              )}

              {/* Book Appointment */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  {t("profile.bookAppointment")}
                </h2>
                <button
                  onClick={() => setAppointmentDialogOpen(true)}
                  className="inline-flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
                >
                  <Calendar className="h-5 w-5" />
                  <span>{t("profile.scheduleAppointment")}</span>
                </button>
              </div>

              {/* Meeting Link */}
              {employee.meeting_link && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                    {t("profile.scheduleMeeting")}
                  </h2>
                  <a
                    href={employee.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
                  >
                    <MessageCircle className="h-5 w-5" />
                    <span>{t("profile.joinMeeting")}</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              )}

              {/* Files Section */}
              {(employee.cv_url ||
                employee.pdf_url ||
                employee.brochure_url ||
                employee.presentation_url) && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                    {t("profile.documents")}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {employee.cv_url && (
                      <a
                        href={employee.cv_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() =>
                          employee &&
                          trackClick(employee.id, { type: "file", file: "cv" })
                        }
                        className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Download className="h-5 w-5 text-gray-600" />
                        <span className="font-medium text-gray-700">
                          {t("profile.downloadCV")}
                        </span>
                        <ExternalLink className="h-4 w-4 text-gray-400 ml-auto" />
                      </a>
                    )}
                    {employee.pdf_url && (
                      <a
                        href={employee.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() =>
                          employee &&
                          trackClick(employee.id, { type: "file", file: "pdf" })
                        }
                        className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Download className="h-5 w-5 text-gray-600" />
                        <span className="font-medium text-gray-700">
                          {t("profile.downloadPDF")}
                        </span>
                        <ExternalLink className="h-4 w-4 text-gray-400 ml-auto" />
                      </a>
                    )}
                    {employee.brochure_url && (
                      <a
                        href={employee.brochure_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() =>
                          employee &&
                          trackClick(employee.id, {
                            type: "file",
                            file: "brochure",
                          })
                        }
                        className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Download className="h-5 w-5 text-gray-600" />
                        <span className="font-medium text-gray-700">
                          {t("profile.downloadBrochure")}
                        </span>
                        <ExternalLink className="h-4 w-4 text-gray-400 ml-auto" />
                      </a>
                    )}
                    {employee.presentation_url && (
                      <a
                        href={employee.presentation_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() =>
                          employee &&
                          trackClick(employee.id, {
                            type: "file",
                            file: "presentation",
                          })
                        }
                        className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Download className="h-5 w-5 text-gray-600" />
                        <span className="font-medium text-gray-700">
                          {t("profile.downloadPresentation")}
                        </span>
                        <ExternalLink className="h-4 w-4 text-gray-400 ml-auto" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Extra Links (Linktree style) */}
              {extraLinks.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                    {t("profile.links")}
                  </h2>
                  <div className="space-y-2">
                    {extraLinks.map((link, index) => (
                      <a
                        key={index}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() =>
                          employee &&
                          trackClick(employee.id, {
                            type: "extra_link",
                            title: link.title,
                          })
                        }
                        className="flex items-center justify-between gap-3 px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 group"
                      >
                        <span className="font-medium text-gray-700">
                          {link.title}
                        </span>
                        <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {(socialLinks?.instagram ||
                socialLinks?.linkedin ||
                socialLinks?.facebook ||
                socialLinks?.youtube ||
                socialLinks?.whatsapp) && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                    {t("profile.connect")}
                  </h2>
                  <div className="flex flex-wrap gap-4 justify-center">
                    {socialLinks.instagram && (
                      <a
                        href={socialLinks.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Instagram"
                        onClick={() =>
                          employee &&
                          trackClick(employee.id, {
                            type: "social",
                            platform: "instagram",
                          })
                        }
                        className="inline-flex items-center justify-center rounded-full h-14 w-14 bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110"
                      >
                        <Instagram className="h-6 w-6" />
                      </a>
                    )}
                    {socialLinks.linkedin && (
                      <a
                        href={socialLinks.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="LinkedIn"
                        onClick={() =>
                          employee &&
                          trackClick(employee.id, {
                            type: "social",
                            platform: "linkedin",
                          })
                        }
                        className="inline-flex items-center justify-center rounded-full h-14 w-14 bg-blue-600 text-white shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110"
                      >
                        <Linkedin className="h-6 w-6" />
                      </a>
                    )}
                    {socialLinks.facebook && (
                      <a
                        href={socialLinks.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Facebook"
                        onClick={() =>
                          employee &&
                          trackClick(employee.id, {
                            type: "social",
                            platform: "facebook",
                          })
                        }
                        className="inline-flex items-center justify-center rounded-full h-14 w-14 bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110"
                      >
                        <Facebook className="h-6 w-6" />
                      </a>
                    )}
                    {socialLinks.youtube && (
                      <a
                        href={socialLinks.youtube}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="YouTube"
                        onClick={() =>
                          employee &&
                          trackClick(employee.id, {
                            type: "social",
                            platform: "youtube",
                          })
                        }
                        className="inline-flex items-center justify-center rounded-full h-14 w-14 bg-red-600 text-white shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110"
                      >
                        <Youtube className="h-6 w-6" />
                      </a>
                    )}
                    {socialLinks.whatsapp && (
                      <a
                        href={getWhatsAppUrl(socialLinks.whatsapp)}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="WhatsApp"
                        onClick={() =>
                          employee &&
                          trackClick(employee.id, {
                            type: "social",
                            platform: "whatsapp",
                          })
                        }
                        className="inline-flex items-center justify-center rounded-full h-14 w-14 bg-green-500 text-white shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110"
                      >
                        <MessageCircle className="h-6 w-6" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* QR Code & Actions Section */}
              <div className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  {t("profile.shareSave")}
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* QR Code */}
                  <div className="flex flex-col items-center">
                    <div className="bg-white p-4 rounded-lg shadow-md mb-4">
                      <QRCode
                        value={getPublicUrl()}
                        size={180}
                        style={{
                          height: "auto",
                          maxWidth: "100%",
                          width: "100%",
                        }}
                        viewBox="0 0 256 256"
                      />
                    </div>
                    <p className="text-sm text-gray-600 text-center">
                      {t("profile.scanToSave")}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-3 justify-center">
                    <button
                      onClick={downloadVCard}
                      className="flex items-center justify-center gap-3 px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium"
                    >
                      <Download className="h-5 w-5" />
                      <span>{t("profile.downloadVCard")}</span>
                    </button>
                    <button
                      onClick={shareProfile}
                      className="flex items-center justify-center gap-3 px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium"
                    >
                      <Share2 className="h-5 w-5" />
                      <span>{t("profile.shareProfile")}</span>
                    </button>
                  </div>
                </div>
              </div>

              {company &&
                (company.address || company.phone || company.website) && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                      {t("profile.companyInfo")}
                    </h2>
                    <div className="space-y-3 text-gray-700">
                      {company.address && (
                        <div className="space-y-2">
                          <div className="flex items-start space-x-3">
                            <MapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                            <p className="leading-relaxed flex-1">
                              {company.address}
                            </p>
                          </div>
                          <div className="flex gap-2 ml-8">
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                company.address
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                              <Navigation className="h-4 w-4" />
                              <span>Google Maps</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                            <a
                              href={`https://yandex.com.tr/harita/?text=${encodeURIComponent(
                                company.address
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                            >
                              <MapPin className="h-4 w-4" />
                              <span>Yandex Maps</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </div>
                      )}
                      {company.phone && (
                        <div className="flex items-center space-x-3">
                          <Phone className="h-5 w-5 text-gray-400 flex-shrink-0" />
                          <a
                            href={`tel:${company.phone}`}
                            className="hover:text-primary transition-colors"
                          >
                            {company.phone}
                          </a>
                        </div>
                      )}
                      {company.website && (
                        <div className="flex items-center space-x-3">
                          <Globe className="h-5 w-5 text-gray-400 flex-shrink-0" />
                          <a
                            href={company.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline break-all"
                          >
                            {company.website}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />

      {/* Appointment Booking Dialog */}
      <Dialog
        open={appointmentDialogOpen}
        onOpenChange={setAppointmentDialogOpen}
      >
        <DialogContent
          onClose={() => setAppointmentDialogOpen(false)}
          className="max-w-2xl"
        >
          <DialogHeader>
            <DialogTitle>
              {t("profile.appointment.title")} - {employee?.first_name}{" "}
              {employee?.last_name}
            </DialogTitle>
            <DialogDescription>
              {t("profile.appointment.subtitle")}
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!employee || !selectedDate || !selectedTime) {
                alert(t("profile.appointment.fillAllFields") || "Please fill in all required fields");
                return;
              }

              if (!appointmentForm.customer_name || !appointmentForm.customer_email) {
                alert(t("profile.appointment.fillAllFields") || "Please fill in customer name and email");
                return;
              }

              setSubmitting(true);
              try {
                const appointmentDateTime = new Date(
                  `${selectedDate}T${selectedTime}`
                );

                if (isNaN(appointmentDateTime.getTime())) {
                  alert(t("profile.appointment.invalidDateTime") || "Invalid date or time");
                  setSubmitting(false);
                  return;
                }

                const appointment = await createAppointment({
                  employee_id: employee.id,
                  company_id: employee.company_id,
                  customer_name: appointmentForm.customer_name,
                  customer_email: appointmentForm.customer_email,
                  customer_phone: appointmentForm.customer_phone || undefined,
                  appointment_date: appointmentDateTime.toISOString(),
                  duration_minutes: employee.default_duration_minutes || 30,
                  notes: appointmentForm.notes || undefined,
                });

                if (appointment) {
                  alert(t("profile.appointment.success"));
                  setAppointmentDialogOpen(false);
                  setAppointmentForm({
                    customer_name: "",
                    customer_email: "",
                    customer_phone: "",
                    notes: "",
                  });
                  setSelectedDate("");
                  setSelectedTime("");
                } else {
                  alert(t("profile.appointment.error") || "Failed to create appointment. Please try again.");
                }
              } catch (error: any) {
                console.error("Error creating appointment:", error);
                alert(error?.message || t("profile.appointment.error") || "Failed to create appointment. Please try again.");
              } finally {
                setSubmitting(false);
              }
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("profile.appointment.date")}
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  value={selectedDate}
                  onChange={async (e) => {
                    setSelectedDate(e.target.value);
                    setSelectedTime("");
                    if (e.target.value && employee) {
                      setLoadingSlots(true);
                      const slots = await getAvailableTimeSlots(
                        employee.id,
                        e.target.value
                      );
                      setAvailableSlots(slots);
                      setLoadingSlots(false);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("profile.appointment.time")}
                </label>
                {loadingSlots ? (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    {t("profile.appointment.loadingTimes")}
                  </div>
                ) : availableSlots.length === 0 && selectedDate ? (
                  <div className="px-3 py-2 text-sm text-red-500">
                    {t("profile.appointment.noTimes")}
                  </div>
                ) : (
                  <select
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={!selectedDate || availableSlots.length === 0}
                  >
                    <option value="">{t("profile.appointment.time")}</option>
                    {availableSlots.map((slot) => {
                      const date = new Date(slot);
                      const timeString = `${date
                        .getHours()
                        .toString()
                        .padStart(2, "0")}:${date
                        .getMinutes()
                        .toString()
                        .padStart(2, "0")}`;
                      return (
                        <option key={slot} value={timeString}>
                          {timeString}
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("profile.appointment.name")}
              </label>
              <input
                type="text"
                value={appointmentForm.customer_name}
                onChange={(e) =>
                  setAppointmentForm({
                    ...appointmentForm,
                    customer_name: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("profile.appointment.email")}
              </label>
              <input
                type="email"
                value={appointmentForm.customer_email}
                onChange={(e) =>
                  setAppointmentForm({
                    ...appointmentForm,
                    customer_email: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("profile.appointment.phone")}
              </label>
              <input
                type="tel"
                value={appointmentForm.customer_phone}
                onChange={(e) =>
                  setAppointmentForm({
                    ...appointmentForm,
                    customer_phone: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("profile.appointment.notes")}
              </label>
              <textarea
                value={appointmentForm.notes}
                onChange={(e) =>
                  setAppointmentForm({
                    ...appointmentForm,
                    notes: e.target.value,
                  })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={() => setAppointmentDialogOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {t("profile.appointment.cancel")}
              </button>
              <button
                type="submit"
                disabled={submitting || !selectedDate || !selectedTime}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting
                  ? t("profile.appointment.booking")
                  : t("profile.appointment.book")}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
