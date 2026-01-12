import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/supabase/client'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import Footer from '@/components/Footer'

export default function VerifyEmail() {
  const { t, language, setLanguage } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [messageType, setMessageType] = useState<'success' | 'error'>('error')
  const [email, setEmail] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Get current user email
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setEmail(user.email || null)
        // Check if already confirmed
        if (user.email_confirmed_at) {
          navigate('/dashboard')
        }
      } else {
        navigate('/login')
      }
    })
  }, [navigate])

  const handleResendEmail = async () => {
    if (!email) return

    setLoading(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      })

      if (error) {
        setMessage(t('auth.verify.resendError') || 'E-posta gönderilemedi. Lütfen tekrar deneyin.')
        setMessageType('error')
      } else {
        setMessage(t('auth.verify.resendSuccess') || 'Onay e-postası tekrar gönderildi. Lütfen e-postanızı kontrol edin.')
        setMessageType('success')
      }
    } catch (error) {
      setMessage(t('auth.verify.resendError') || 'Bir hata oluştu. Lütfen tekrar deneyin.')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckStatus = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email_confirmed_at) {
        navigate('/dashboard')
      } else {
        setMessage(t('auth.verify.notConfirmed') || 'E-posta henüz onaylanmadı. Lütfen e-postanızı kontrol edin.')
        setMessageType('error')
      }
    } catch (error) {
      setMessage(t('auth.verify.checkError') || 'Durum kontrol edilemedi. Lütfen tekrar deneyin.')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100 relative">
      {/* Language Selector */}
      <div className="absolute top-4 right-4 z-10">
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
              {t('auth.verify.title') || 'E-posta Onayı Gerekli'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {message && (
              <div className={`p-3 text-sm rounded-md border ${
                messageType === 'success' 
                  ? 'text-green-700 bg-green-50 border-green-200' 
                  : 'text-red-600 bg-red-50 border-red-200'
              }`}>
                {message}
              </div>
            )}
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                {t('auth.verify.description') || 'Hesabınızı kullanmaya başlamak için e-posta adresinizi onaylamanız gerekiyor.'}
              </p>
              {email && (
                <p className="text-sm font-medium text-gray-800">
                  {email}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Button 
                onClick={handleResendEmail} 
                className="w-full" 
                disabled={loading || !email}
              >
                {loading ? (t('auth.verify.sending') || 'Gönderiliyor...') : (t('auth.verify.resend') || 'E-postayı Tekrar Gönder')}
              </Button>
              <Button 
                onClick={handleCheckStatus} 
                variant="outline" 
                className="w-full" 
                disabled={loading}
              >
                {t('auth.verify.check') || 'Durumu Kontrol Et'}
              </Button>
            </div>
            <div className="text-center text-sm">
              <Link to="/login" className="text-primary hover:underline">
                {t('auth.verify.backToLogin') || 'Giriş sayfasına dön'}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  )
}

