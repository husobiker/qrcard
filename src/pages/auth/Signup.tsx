import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/supabase/client'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import Footer from '@/components/Footer'
import { getBaseUrl } from '@/utils/url'

export default function Signup() {
  const { t, language, setLanguage } = useLanguage()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState<'tr' | 'en'>(language)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [messageType, setMessageType] = useState<'success' | 'error'>('error')
  const navigate = useNavigate()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    
    // Set language before processing to ensure messages are in the correct language
    setLanguage(selectedLanguage)

    // Sign up the user (with email confirmation disabled, auto-confirm)
    const baseUrl = getBaseUrl()
    // Ensure no whitespace in redirect URL
    const redirectUrl = `${baseUrl}/dashboard`.trim()
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    })

    if (authError) {
      // Check for specific error types
      const errorMessage = authError.message?.toLowerCase() || ''
      const errorCode = (authError as any).code || ''
      
      // Check for rate limit error (429)
      const isRateLimit = 
        authError.status === 429 || 
        errorCode === '429' ||
        errorMessage.includes('429') ||
        errorMessage.includes('rate limit') ||
        errorMessage.includes('too many requests')
      
      // Check for OTP expired error
      const isOtpExpired = 
        errorCode === 'otp_expired' ||
        errorMessage.includes('otp_expired') ||
        errorMessage.includes('expired') ||
        errorMessage.includes('invalid or has expired')
      
      if (isRateLimit) {
        setMessage(t('auth.signup.rateLimit'))
      } else if (isOtpExpired) {
        setMessage(t('auth.signup.otpExpired'))
      } else {
        setMessage(t('auth.signup.error'))
      }
      setMessageType('error')
      setLoading(false)
      return
    }

    if (authData.user) {
      // Try to create company record immediately
      // If email confirmation is enabled, we'll need to handle it differently
      let retries = 3
      let companyCreated = false
      
      while (retries > 0 && !companyCreated) {
        // Wait a bit for session to be established
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Get the current session
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          // Set language in context
          setLanguage(selectedLanguage)
          
          // Create company record using the user's ID
          const { error: companyError } = await supabase
            .from('companies')
            .insert({
              id: authData.user.id,
              name: companyName,
              language: selectedLanguage as 'tr' | 'en',
            } as any) as any

          if (!companyError) {
            companyCreated = true
            // Check if email is confirmed
            if (authData.user.email_confirmed_at) {
              setMessage(t('auth.signup.success'))
              setMessageType('success')
              setTimeout(() => {
                navigate('/dashboard')
              }, 1500)
            } else {
              // Email confirmation required
              setMessage(t('auth.signup.emailConfirmationRequired'))
              setMessageType('success')
              setTimeout(() => {
                navigate('/verify-email')
              }, 2000)
            }
            return
          } else {
            console.error('Company creation error:', companyError)
            // If RLS error, try again
            if (companyError.message.includes('row-level security')) {
              retries--
              continue
            } else {
              setMessage(t('auth.signup.companyCreationFailed').replace('{message}', companyError.message))
              setMessageType('error')
              setLoading(false)
              return
            }
          }
        } else {
          retries--
        }
      }
      
      // If we get here and no session, email confirmation is probably required
      if (!companyCreated) {
        // Check if email confirmation is required
        const { data: { user } } = await supabase.auth.getUser()
        if (user && user.email_confirmed_at) {
          // User is confirmed, try one more time
          const { error: companyError } = await supabase
            .from('companies')
            .insert({
              id: authData.user.id,
              name: companyName,
              language: selectedLanguage as 'tr' | 'en',
            } as any) as any
          
          if (!companyError) {
            setMessage(t('auth.signup.success'))
            setMessageType('success')
            setTimeout(() => {
              navigate('/dashboard')
            }, 1500)
            return
          }
        }
        
        setMessage(t('auth.signup.emailConfirmationRequired'))
        setMessageType('success')
        setLoading(false)
      }
    } else {
      setMessage(t('auth.signup.error'))
      setMessageType('error')
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
            setSelectedLanguage(newLang);
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
            {t('auth.signup.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
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
              <Label htmlFor="companyName">{t('auth.signup.companyName')}</Label>
              <Input
                id="companyName"
                type="text"
                placeholder="Acme Inc."
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.signup.email')}</Label>
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
              <Label htmlFor="password">{t('auth.signup.password')}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">{t('auth.signup.language')}</Label>
              <select
                id="language"
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value as 'tr' | 'en')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="tr">Türkçe</option>
                <option value="en">English</option>
              </select>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('auth.signup.loading') : t('auth.signup.submit')}
            </Button>
            <div className="text-center text-sm">
              {t('auth.signup.hasAccount')}{' '}
              <Link to="/login" className="text-primary hover:underline">
                {t('auth.signup.signin')}
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
      </div>
      <Footer />
    </div>
  )
}

