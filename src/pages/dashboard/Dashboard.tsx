import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/contexts/LanguageContext'
import { supabase } from '@/supabase/client'
import { getCompanyByUserId, updateCompany, uploadCompanyLogo, uploadCompanyBackgroundImage } from '@/services/companyService'
import type { Company } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Save } from 'lucide-react'

export default function Dashboard() {
  const { user } = useAuth()
  const { t, setLanguage } = useLanguage()
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    website: '',
    tax_number: '',
    tax_office: '',
  })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [backgroundImageFile, setBackgroundImageFile] = useState<File | null>(null)
  const [backgroundImagePreview, setBackgroundImagePreview] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadCompany()
    } else {
      setLoading(false)
    }
  }, [user])

  const loadCompany = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      const companyData = await getCompanyByUserId(user.id)
      if (companyData) {
        setCompany(companyData)
        // Set language from company data
        if (companyData.language) {
          setLanguage(companyData.language)
        }
        setFormData({
          name: companyData.name || '',
          address: companyData.address || '',
          phone: companyData.phone || '',
          website: companyData.website || '',
          tax_number: companyData.tax_number || '',
          tax_office: companyData.tax_office || '',
        })
        setLogoPreview(companyData.logo_url)
        setBackgroundImagePreview(companyData.background_image_url)
      } else {
        // Company doesn't exist, create it
        console.log('Company not found, creating new company...')
        const { data, error } = await supabase
          .from('companies')
          .insert({
            id: user.id,
            name: 'My Company',
            language: 'tr' as 'tr' | 'en',
          } as any)
          .select()
          .single()
        
        if (data && !error) {
          setCompany(data)
          setFormData({
            name: (data as any).name || '',
            address: (data as any).address || '',
            phone: (data as any).phone || '',
            website: (data as any).website || '',
            tax_number: (data as any).tax_number || '',
            tax_office: (data as any).tax_office || '',
          })
        } else {
          console.error('Error creating company:', error)
        }
      }
    } catch (error) {
      console.error('Error loading company:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleBackgroundImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setBackgroundImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setBackgroundImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      alert('You must be logged in to save changes.')
      return
    }

    setSaving(true)

    try {
      // If company doesn't exist, create it first
      let currentCompany = company
      if (!currentCompany) {
        const { data: newCompany, error: createError } = await supabase
          .from('companies')
          .insert({
            id: user.id,
            name: formData.name || 'My Company',
            language: 'tr' as 'tr' | 'en',
          } as any)
          .select()
          .single()
        
        if (createError) {
          console.error('Error creating company:', createError)
          alert(`Failed to create company: ${createError.message}`)
          setSaving(false)
          return
        }
        currentCompany = newCompany
        setCompany(newCompany)
      }

      let logoUrl = currentCompany.logo_url
      let backgroundImageUrl = currentCompany.background_image_url

      if (logoFile) {
        const uploadedUrl = await uploadCompanyLogo(logoFile, currentCompany.id)
        if (uploadedUrl) {
          logoUrl = uploadedUrl
        }
      }

      if (backgroundImageFile) {
        const uploadedUrl = await uploadCompanyBackgroundImage(backgroundImageFile, currentCompany.id)
        if (uploadedUrl) {
          backgroundImageUrl = uploadedUrl
        }
      }

      const updated = await updateCompany(currentCompany.id, {
        ...formData,
        logo_url: logoUrl,
        background_image_url: backgroundImageUrl,
      })

      if (updated) {
        setCompany(updated)
        setLogoFile(null)
        setBackgroundImageFile(null)
        alert(t('dashboard.company.success'))
        // Reload to make sure everything is in sync
        await loadCompany()
      } else {
        alert('Failed to update company profile. Please check the console for errors.')
      }
    } catch (error) {
      console.error('Error saving company:', error)
      alert(`Failed to update company profile: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('dashboard.company.title')}</h1>
        <p className="text-muted-foreground">{t('dashboard.company.subtitle')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <span>{t('dashboard.company.details')}</span>
          </CardTitle>
          <CardDescription>{t('dashboard.company.update')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-6">
              <div className="flex items-center space-x-6">
                <div className="flex-shrink-0">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Company logo"
                      className="h-24 w-24 rounded-lg object-cover border"
                    />
                  ) : (
                    <div className="h-24 w-24 rounded-lg border flex items-center justify-center bg-muted">
                      <Building2 className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <Label htmlFor="logo">{t('dashboard.company.logo')}</Label>
                  <div className="mt-2">
                    <Input
                      id="logo"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="cursor-pointer"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('dashboard.company.logoDesc')}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <div className="flex-shrink-0">
                  {backgroundImagePreview ? (
                    <img
                      src={backgroundImagePreview}
                      alt="Background image"
                      className="h-32 w-48 rounded-lg object-cover border"
                    />
                  ) : (
                    <div className="h-32 w-48 rounded-lg border flex items-center justify-center bg-muted">
                      <span className="text-xs text-muted-foreground text-center px-2">{t('dashboard.company.background')}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <Label htmlFor="backgroundImage">{t('dashboard.company.background')}</Label>
                  <div className="mt-2">
                    <Input
                      id="backgroundImage"
                      type="file"
                      accept="image/*"
                      onChange={handleBackgroundImageChange}
                      className="cursor-pointer"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('dashboard.company.backgroundDesc')}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('dashboard.company.name')} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t('dashboard.company.phone')}</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">{t('dashboard.company.address')}</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">{t('dashboard.company.website')}</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://example.com"
              />
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-4">{t('dashboard.company.taxInfo')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tax_number">{t('dashboard.company.taxNumber')}</Label>
                  <Input
                    id="tax_number"
                    value={formData.tax_number}
                    onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
                    placeholder="1234567890"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax_office">{t('dashboard.company.taxOffice')}</Label>
                  <Input
                    id="tax_office"
                    value={formData.tax_office}
                    onChange={(e) => setFormData({ ...formData, tax_office: e.target.value })}
                    placeholder="Kadıköy Vergi Dairesi"
                  />
                </div>
              </div>
            </div>

            <Button type="submit" disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? t('dashboard.company.saving') : t('dashboard.company.save')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

