import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { getCompanyByUserId } from "@/services/companyService";
import {
  getEmployeesByCompany,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  uploadEmployeePhoto,
} from "@/services/employeeService";
import {
  getEmployeeSipSettings,
  createEmployeeSipSettings,
  updateEmployeeSipSettings,
} from "@/services/sipSettingsService";
import type {
  Employee,
  EmployeeFormData,
  SocialLinks,
  AvailableHours,
} from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Edit,
  Trash2,
  QrCode,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import QRCodeGenerator from "@/components/QRCodeGenerator";
import {
  getAppointmentsByEmployee,
  updateAppointmentStatus,
  deleteAppointment,
} from "@/services/appointmentService";
import type { Appointment } from "@/types";
import { getEmployeePublicUrl } from "@/utils/url";

export default function Employees() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const defaultAvailableHours: AvailableHours = {
    monday: { enabled: true, start: "09:00", end: "17:00" },
    tuesday: { enabled: true, start: "09:00", end: "17:00" },
    wednesday: { enabled: true, start: "09:00", end: "17:00" },
    thursday: { enabled: true, start: "09:00", end: "17:00" },
    friday: { enabled: true, start: "09:00", end: "17:00" },
    saturday: { enabled: false, start: "09:00", end: "17:00" },
    sunday: { enabled: false, start: "09:00", end: "17:00" },
  };

  const [formData, setFormData] = useState<EmployeeFormData>({
    first_name: "",
    last_name: "",
    job_title: "",
    department: "",
    phone: "",
    email: "",
    about: "",
    social_links: {},
    available_hours: defaultAvailableHours,
    default_duration_minutes: 30,
    password: "",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<{
    [key: string]: Appointment[];
  }>({});
  const [showAppointments, setShowAppointments] = useState<string | null>(null);
  const [newEmployeeCredentials, setNewEmployeeCredentials] = useState<{
    username: string;
    password: string;
  } | null>(null);
  const [sipSettings, setSipSettings] = useState({
    sip_username: "",
    sip_password: "",
    extension: "",
    sip_server: "",
    sip_port: 5060,
    webrtc_enabled: false,
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    const company = await getCompanyByUserId(user.id);
    if (company) {
      setCompanyId(company.id);
      const employeesData = await getEmployeesByCompany(company.id);
      setEmployees(employeesData);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      first_name: "",
      last_name: "",
      job_title: "",
      department: "",
      phone: "",
      email: "",
      about: "",
      social_links: {},
      available_hours: defaultAvailableHours,
      default_duration_minutes: 30,
      password: "",
    });
    setPhotoFile(null);
    setPhotoPreview(null);
    setEditingEmployee(null);
    setSipSettings({
      sip_username: "",
      sip_password: "",
      extension: "",
      sip_server: "",
      sip_port: 5060,
      webrtc_enabled: false,
    });
  };

  const handleOpenDialog = async (employee?: Employee) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        first_name: employee.first_name,
        last_name: employee.last_name,
        job_title: employee.job_title || "",
        department: employee.department || "",
        phone: employee.phone || "",
        email: employee.email || "",
        about: employee.about || "",
        social_links: (employee.social_links as SocialLinks) || {},
        available_hours:
          (employee.available_hours as AvailableHours) || defaultAvailableHours,
        default_duration_minutes: employee.default_duration_minutes || 30,
        password: "", // Don't populate password field for security
      });
      setPhotoPreview(employee.profile_image_url);
      
      // Load SIP settings
      const sip = await getEmployeeSipSettings(employee.id);
      if (sip) {
        setSipSettings({
          sip_username: sip.sip_username,
          sip_password: "", // Don't populate password for security
          extension: sip.extension || "",
          sip_server: sip.sip_server || "",
          sip_port: sip.sip_port || 5060,
          webrtc_enabled: sip.webrtc_enabled,
        });
      } else {
        setSipSettings({
          sip_username: "",
          sip_password: "",
          extension: "",
          sip_server: "",
          sip_port: 5060,
          webrtc_enabled: false,
        });
      }
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;

    try {
      let profileImageUrl = editingEmployee?.profile_image_url || null;

      if (photoFile && editingEmployee) {
        const uploadedUrl = await uploadEmployeePhoto(
          photoFile,
          editingEmployee.id
        );
        if (uploadedUrl) {
          profileImageUrl = uploadedUrl;
        }
      }

      if (editingEmployee) {
        const updated = await updateEmployee(editingEmployee.id, {
          ...formData,
          profile_image_url: profileImageUrl,
        });
        if (updated) {
          // Save/update SIP settings
          if (sipSettings.sip_username) {
            const existingSip = await getEmployeeSipSettings(editingEmployee.id);
            if (existingSip) {
              await updateEmployeeSipSettings(editingEmployee.id, {
                employee_id: editingEmployee.id,
                sip_username: sipSettings.sip_username,
                sip_password: sipSettings.sip_password || existingSip.sip_password,
                extension: sipSettings.extension,
                sip_server: sipSettings.sip_server,
                sip_port: sipSettings.sip_port,
                webrtc_enabled: sipSettings.webrtc_enabled,
              });
            } else {
              await createEmployeeSipSettings(companyId, {
                employee_id: editingEmployee.id,
                sip_username: sipSettings.sip_username,
                sip_password: sipSettings.sip_password,
                extension: sipSettings.extension,
                sip_server: sipSettings.sip_server,
                sip_port: sipSettings.sip_port,
                webrtc_enabled: sipSettings.webrtc_enabled,
              });
            }
          }
          await loadData();
          setDialogOpen(false);
          resetForm();
        }
      } else {
        const newEmployee = await createEmployee(companyId, formData);
        if (newEmployee) {
          if (photoFile) {
            const uploadedUrl = await uploadEmployeePhoto(
              photoFile,
              newEmployee.id
            );
            if (uploadedUrl) {
              await updateEmployee(newEmployee.id, {
                profile_image_url: uploadedUrl,
              });
            }
          }
          // Save SIP settings if provided
          if (sipSettings.sip_username) {
            await createEmployeeSipSettings(companyId, {
              employee_id: newEmployee.id,
              sip_username: sipSettings.sip_username,
              sip_password: sipSettings.sip_password,
              extension: sipSettings.extension,
              sip_server: sipSettings.sip_server,
              sip_port: sipSettings.sip_port,
              webrtc_enabled: sipSettings.webrtc_enabled,
              api_endpoint: sipSettings.api_endpoint,
              api_key: sipSettings.api_key,
              api_secret: sipSettings.api_secret,
            });
          }
          await loadData();
          setDialogOpen(false);
          // Store credentials for QR modal
          setNewEmployeeCredentials({
            username: newEmployee.username || "",
            password: formData.password || "",
          });
          setSelectedEmployee(newEmployee);
          setQrDialogOpen(true);
          resetForm();
        }
      }
    } catch (error: any) {
      console.error("Error saving employee:", error);
      alert(`Failed to save employee: ${error?.message || "Unknown error"}`);
    }
  };

  const handleDelete = async (employee: Employee) => {
    if (
      !confirm(
        `Are you sure you want to delete ${employee.first_name} ${employee.last_name}?`
      )
    ) {
      return;
    }

    const success = await deleteEmployee(employee.id);
    if (success) {
      await loadData();
    } else {
      alert("Failed to delete employee");
    }
  };

  const getPublicUrl = (employee: Employee) => {
    if (!companyId) return "";
    return getEmployeePublicUrl(companyId, employee.id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {t("dashboard.employees.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("dashboard.employees.subtitle")}
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          {t("dashboard.employees.add")}
        </Button>
      </div>

      {employees.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              {t("dashboard.employees.empty")}
            </p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              {t("dashboard.employees.addFirst")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((employee) => (
            <Card key={employee.id}>
              <CardHeader>
                <div className="flex items-center space-x-4">
                  {employee.profile_image_url ? (
                    <img
                      src={employee.profile_image_url}
                      alt={`${employee.first_name} ${employee.last_name}`}
                      className="h-16 w-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-2xl font-bold">
                        {employee.first_name[0]}
                        {employee.last_name[0]}
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {employee.first_name} {employee.last_name}
                    </CardTitle>
                    <CardDescription>
                      {employee.job_title}
                      {employee.department && ` • ${employee.department}`}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedEmployee(employee);
                      setQrDialogOpen(true);
                    }}
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    {t("dashboard.employees.qr")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const apts = await getAppointmentsByEmployee(employee.id);
                      setAppointments({ ...appointments, [employee.id]: apts });
                      setShowAppointments(
                        showAppointments === employee.id ? null : employee.id
                      );
                    }}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    {t("dashboard.employees.appointments")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDialog(employee)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    {t("dashboard.employees.edit")}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(employee)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Appointments List */}
      {showAppointments && appointments[showAppointments] && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {t("dashboard.employees.appointmentsFor")}{" "}
              {employees.find((e) => e.id === showAppointments)?.first_name}{" "}
              {employees.find((e) => e.id === showAppointments)?.last_name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {appointments[showAppointments].length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                {t("dashboard.employees.noAppointments")}
              </p>
            ) : (
              <div className="space-y-3">
                {appointments[showAppointments].map((apt) => {
                  const date = new Date(apt.appointment_date);
                  const statusColors = {
                    pending: "bg-yellow-100 text-yellow-800",
                    confirmed: "bg-green-100 text-green-800",
                    cancelled: "bg-red-100 text-red-800",
                    completed: "bg-blue-100 text-blue-800",
                  };
                  const statusLabels = {
                    pending: t("dashboard.employees.status.pending"),
                    confirmed: t("dashboard.employees.status.confirmed"),
                    cancelled: t("dashboard.employees.status.cancelled"),
                    completed: t("dashboard.employees.status.completed"),
                  };
                  return (
                    <div key={apt.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {date.toLocaleDateString()}{" "}
                              {date.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                statusColors[apt.status]
                              }`}
                            >
                              {
                                statusLabels[
                                  apt.status as keyof typeof statusLabels
                                ]
                              }
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">
                            <strong>
                              {t("dashboard.employees.customer")}:
                            </strong>{" "}
                            {apt.customer_name}
                          </p>
                          <p className="text-sm text-muted-foreground mb-1">
                            <strong>{t("dashboard.employees.email")}:</strong>{" "}
                            {apt.customer_email}
                          </p>
                          {apt.customer_phone && (
                            <p className="text-sm text-muted-foreground mb-1">
                              <strong>{t("dashboard.employees.phone")}:</strong>{" "}
                              {apt.customer_phone}
                            </p>
                          )}
                          {apt.notes && (
                            <p className="text-sm text-muted-foreground mt-2">
                              <strong>{t("dashboard.employees.notes")}:</strong>{" "}
                              {apt.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          {apt.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                  await updateAppointmentStatus(
                                    apt.id,
                                    "confirmed"
                                  );
                                  const apts = await getAppointmentsByEmployee(
                                    apt.employee_id
                                  );
                                  setAppointments({
                                    ...appointments,
                                    [apt.employee_id]: apts,
                                  });
                                }}
                                className="text-green-600"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                {t("dashboard.employees.confirm")}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                  await updateAppointmentStatus(
                                    apt.id,
                                    "cancelled"
                                  );
                                  const apts = await getAppointmentsByEmployee(
                                    apt.employee_id
                                  );
                                  setAppointments({
                                    ...appointments,
                                    [apt.employee_id]: apts,
                                  });
                                }}
                                className="text-red-600"
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                {t("dashboard.employees.cancel")}
                              </Button>
                            </>
                          )}
                          {apt.status === "confirmed" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                await updateAppointmentStatus(
                                  apt.id,
                                  "completed"
                                );
                                const apts = await getAppointmentsByEmployee(
                                  apt.employee_id
                                );
                                setAppointments({
                                  ...appointments,
                                  [apt.employee_id]: apts,
                                });
                              }}
                              className="text-blue-600"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              {t("dashboard.employees.markComplete")}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              if (
                                confirm(t("dashboard.employees.deleteConfirm"))
                              ) {
                                await deleteAppointment(apt.id);
                                const apts = await getAppointmentsByEmployee(
                                  apt.employee_id
                                );
                                setAppointments({
                                  ...appointments,
                                  [apt.employee_id]: apts,
                                });
                              }
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            {t("dashboard.employees.deleteAppointment")}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          onClose={() => setDialogOpen(false)}
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle>
              {editingEmployee
                ? t("employee.form.edit")
                : t("employee.form.title")}
            </DialogTitle>
            <DialogDescription>
              {editingEmployee
                ? t("employee.form.edit")
                : t("employee.form.title")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="flex items-center space-x-4">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Profile preview"
                  className="h-24 w-24 rounded-full object-cover border"
                />
              ) : (
                <div className="h-24 w-24 rounded-full border flex items-center justify-center bg-muted">
                  <span className="text-2xl">👤</span>
                </div>
              )}
              <div className="flex-1">
                <Label htmlFor="photo">{t("employee.form.photo")}</Label>
                <Input
                  id="photo"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="mt-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">
                  {t("employee.form.firstName")} *
                </Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) =>
                    setFormData({ ...formData, first_name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">
                  {t("employee.form.lastName")} *
                </Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) =>
                    setFormData({ ...formData, last_name: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="job_title">{t("employee.form.jobTitle")}</Label>
                <Input
                  id="job_title"
                  value={formData.job_title}
                  onChange={(e) =>
                    setFormData({ ...formData, job_title: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">
                  {t("employee.form.department")}
                </Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) =>
                    setFormData({ ...formData, department: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">{t("employee.form.phone")}</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t("employee.form.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="about">{t("employee.form.about")}</Label>
              <Textarea
                id="about"
                value={formData.about}
                onChange={(e) =>
                  setFormData({ ...formData, about: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t("employee.form.password")}</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder={
                  editingEmployee ? t("employee.form.passwordPlaceholder") : ""
                }
              />
              {editingEmployee && (
                <p className="text-xs text-muted-foreground">
                  {t("employee.form.passwordHint")}
                </p>
              )}
            </div>

            <div className="space-y-4">
              <Label>{t("employee.form.social")}</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="instagram">
                    {t("employee.form.instagram")}
                  </Label>
                  <Input
                    id="instagram"
                    type="url"
                    placeholder="https://instagram.com/username"
                    value={formData.social_links?.instagram || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        social_links: {
                          ...formData.social_links,
                          instagram: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedin">
                    {t("employee.form.linkedin")}
                  </Label>
                  <Input
                    id="linkedin"
                    type="url"
                    placeholder="https://linkedin.com/in/username"
                    value={formData.social_links?.linkedin || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        social_links: {
                          ...formData.social_links,
                          linkedin: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="facebook">
                    {t("employee.form.facebook")}
                  </Label>
                  <Input
                    id="facebook"
                    type="url"
                    placeholder="https://facebook.com/username"
                    value={formData.social_links?.facebook || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        social_links: {
                          ...formData.social_links,
                          facebook: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="youtube">{t("employee.form.youtube")}</Label>
                  <Input
                    id="youtube"
                    type="url"
                    placeholder="https://youtube.com/@username"
                    value={formData.social_links?.youtube || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        social_links: {
                          ...formData.social_links,
                          youtube: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">
                    {t("employee.form.whatsapp")}
                  </Label>
                  <Input
                    id="whatsapp"
                    type="tel"
                    placeholder="+1234567890"
                    value={formData.social_links?.whatsapp || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        social_links: {
                          ...formData.social_links,
                          whatsapp: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Available Hours Section */}
            <div className="space-y-4 border-t pt-4">
              <Label className="text-base font-semibold">
                {t("dashboard.employees.availableHours")}
              </Label>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm font-medium mb-2">
                  <span>{t("dashboard.employees.defaultDuration")}</span>
                  <Input
                    type="number"
                    min="15"
                    max="240"
                    step="15"
                    value={formData.default_duration_minutes || 30}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        default_duration_minutes:
                          parseInt(e.target.value) || 30,
                      })
                    }
                    className="w-24"
                  />
                </div>
                {[
                  "monday",
                  "tuesday",
                  "wednesday",
                  "thursday",
                  "friday",
                  "saturday",
                  "sunday",
                ].map((day) => {
                  const dayName =
                    t(`calendar.${day}.full`) ||
                    t(`calendar.${day}`) ||
                    day.charAt(0).toUpperCase() + day.slice(1);
                  const daySchedule = formData.available_hours?.[day] || {
                    enabled: false,
                    start: "09:00",
                    end: "17:00",
                  };
                  return (
                    <div
                      key={day}
                      className="flex items-center gap-4 p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-2 w-24">
                        <input
                          type="checkbox"
                          checked={daySchedule.enabled}
                          onChange={(e) => {
                            const newHours = formData.available_hours
                              ? { ...formData.available_hours }
                              : defaultAvailableHours;
                            newHours[day] = {
                              ...daySchedule,
                              enabled: e.target.checked,
                            };
                            setFormData({
                              ...formData,
                              available_hours: newHours,
                            });
                          }}
                          className="w-4 h-4"
                        />
                        <Label className="text-sm font-medium">{dayName}</Label>
                      </div>
                      {daySchedule.enabled && (
                        <>
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-muted-foreground">
                              Start
                            </Label>
                            <Input
                              type="time"
                              value={daySchedule.start}
                              onChange={(e) => {
                                const newHours = formData.available_hours
                                  ? { ...formData.available_hours }
                                  : defaultAvailableHours;
                                newHours[day] = {
                                  ...daySchedule,
                                  start: e.target.value,
                                };
                                setFormData({
                                  ...formData,
                                  available_hours: newHours,
                                });
                              }}
                              className="w-32"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-muted-foreground">
                              End
                            </Label>
                            <Input
                              type="time"
                              value={daySchedule.end}
                              onChange={(e) => {
                                const newHours = formData.available_hours
                                  ? { ...formData.available_hours }
                                  : defaultAvailableHours;
                                newHours[day] = {
                                  ...daySchedule,
                                  end: e.target.value,
                                };
                                setFormData({
                                  ...formData,
                                  available_hours: newHours,
                                });
                              }}
                              className="w-32"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SIP Settings Section */}
            <div className="space-y-4 border-t pt-4">
              <Label className="text-base font-semibold">
                IP Telefon Ayarları
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sip_username">SIP Kullanıcı Adı</Label>
                  <Input
                    id="sip_username"
                    value={sipSettings.sip_username}
                    onChange={(e) =>
                      setSipSettings({
                        ...sipSettings,
                        sip_username: e.target.value,
                      })
                    }
                    placeholder="sip_username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sip_password">SIP Şifre</Label>
                  <Input
                    id="sip_password"
                    type="password"
                    value={sipSettings.sip_password}
                    onChange={(e) =>
                      setSipSettings({
                        ...sipSettings,
                        sip_password: e.target.value,
                      })
                    }
                    placeholder={editingEmployee ? "Değiştirmek için yeni şifre girin" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="extension">Extension</Label>
                  <Input
                    id="extension"
                    value={sipSettings.extension}
                    onChange={(e) =>
                      setSipSettings({
                        ...sipSettings,
                        extension: e.target.value,
                      })
                    }
                    placeholder="1001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sip_server">SIP Sunucu</Label>
                  <Input
                    id="sip_server"
                    value={sipSettings.sip_server}
                    onChange={(e) =>
                      setSipSettings({
                        ...sipSettings,
                        sip_server: e.target.value,
                      })
                    }
                    placeholder="sip.example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sip_port">SIP Port</Label>
                  <Input
                    id="sip_port"
                    type="number"
                    value={sipSettings.sip_port}
                    onChange={(e) =>
                      setSipSettings({
                        ...sipSettings,
                        sip_port: parseInt(e.target.value) || 5060,
                      })
                    }
                    placeholder="5060"
                  />
                </div>
                <div className="space-y-2 flex items-center">
                  <input
                    id="webrtc_enabled"
                    type="checkbox"
                    checked={sipSettings.webrtc_enabled}
                    onChange={(e) =>
                      setSipSettings({
                        ...sipSettings,
                        webrtc_enabled: e.target.checked,
                      })
                    }
                    className="mr-2"
                  />
                  <Label htmlFor="webrtc_enabled" className="cursor-pointer">
                    WebRTC Aktif
                  </Label>
                </div>
              </div>
              
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  resetForm();
                }}
              >
                {t("employee.form.cancel")}
              </Button>
              <Button type="submit">{t("employee.form.save")}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent
          onClose={() => {
            setQrDialogOpen(false);
            setNewEmployeeCredentials(null);
          }}
        >
          <DialogHeader>
            <DialogTitle>QR Code</DialogTitle>
            <DialogDescription>
              Share this QR code for {selectedEmployee?.first_name}{" "}
              {selectedEmployee?.last_name}
            </DialogDescription>
          </DialogHeader>
          {selectedEmployee && (
            <>
              <QRCodeGenerator
                url={getPublicUrl(selectedEmployee)}
                employeeName={`${selectedEmployee.first_name} ${selectedEmployee.last_name}`}
                employeeId={selectedEmployee.id}
              />
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  {t("employee.credentials.title") || "Çalışan Giriş Bilgileri"}
                </h4>
                <div className="space-y-2">
                  <div>
                    <span className="text-xs font-medium text-gray-600">
                      {t("auth.employeeLogin.username") || "Kullanıcı Adı"}:{" "}
                    </span>
                    <span className="text-sm font-mono text-gray-900 bg-white px-2 py-1 rounded border">
                      {selectedEmployee.username ||
                        newEmployeeCredentials?.username ||
                        "-"}
                    </span>
                  </div>
                  {newEmployeeCredentials?.password ? (
                    <div>
                      <span className="text-xs font-medium text-gray-600">
                        {t("auth.employeeLogin.password") || "Şifre"}:{" "}
                      </span>
                      <span className="text-sm font-mono text-gray-900 bg-white px-2 py-1 rounded border">
                        {newEmployeeCredentials.password}
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-xs font-medium text-gray-600">
                        {t("auth.employeeLogin.password") || "Şifre"}:{" "}
                      </span>
                      <span className="text-xs text-gray-500 italic">
                        {t("employee.credentials.passwordNotAvailable") ||
                          "Şifre güvenlik nedeniyle saklanmıştır. Çalışan şifresini unutursa yeni şifre belirleyebilirsiniz."}
                      </span>
                    </div>
                  )}
                  {newEmployeeCredentials?.password && (
                    <p className="text-xs text-gray-500 mt-3">
                      {t("employee.credentials.note") ||
                        "Bu bilgileri çalışanınızla paylaşın. Şifre bir daha gösterilmeyecektir."}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
