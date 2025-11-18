import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/supabase/client'
import { Button } from '@/components/ui/button'
import { LogOut, Users, Building2, Calendar, TrendingUp, BarChart3 } from 'lucide-react'
import Footer from './Footer'
import { useLanguage } from '@/contexts/LanguageContext'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate()
  const { language, setLanguage, t } = useLanguage()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="border-b">
        <div className="container mx-auto px-6 max-w-[1920px]">
          <div className="flex h-24 items-center justify-between">
            <div className="flex items-center space-x-12">
              <Link to="/dashboard" className="flex items-center">
                <img src="/logo.png" alt="QR Card" className="h-24 w-auto" />
              </Link>
              <div className="flex items-center space-x-4">
                <Link
                  to="/dashboard"
                  className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  <Building2 className="h-4 w-4" />
                  <span>{t('common.company')}</span>
                </Link>
                <Link
                  to="/dashboard/employees"
                  className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  <Users className="h-4 w-4" />
                  <span>{t('common.employees')}</span>
                </Link>
                <Link
                  to="/dashboard/calendar"
                  className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  <Calendar className="h-4 w-4" />
                  <span>{t('common.calendar')}</span>
                </Link>
                <Link
                  to="/dashboard/crm"
                  className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  <TrendingUp className="h-4 w-4" />
                  <span>{t('common.crm') || 'Satış Takibi'}</span>
                </Link>
                <Link
                  to="/dashboard/reports"
                  className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>{t('common.reports') || 'Raporlar'}</span>
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
                {t('common.logout')}
              </Button>
            </div>
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-8 flex-1">{children}</main>
      <Footer />
    </div>
  )
}

