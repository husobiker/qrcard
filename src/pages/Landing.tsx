import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useEffect, useRef, useState } from 'react'
import { 
  Building2, 
  Users, 
  Calendar, 
  Target, 
  TrendingUp, 
  Phone, 
  CheckCircle2,
  ArrowRight,
  QrCode,
  BarChart3,
  MessageSquare,
  DollarSign,
  FileText,
  Shield,
  Zap,
  Globe,
  Lock,
  EyeOff,
  Server,
  Clock,
  PieChart,
  UserCheck,
  Briefcase,
  LineChart,
  Award,
  Activity,
  Sparkles,
  Check,
  Building,
  User
} from 'lucide-react'

export default function Landing() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current)
      }
    }
  }, [])

  useEffect(() => {
    // Remove Spline viewer background and badge
    const removeSplineElements = () => {
      const splineViewers = document.querySelectorAll('spline-viewer')
      const splineViewersArray = Array.from(splineViewers)
      for (const splineViewer of splineViewersArray) {
        // Try to access shadow DOM
        const shadowRoot = (splineViewer as Element & { shadowRoot: ShadowRoot | null }).shadowRoot
        if (shadowRoot) {
          const canvas = shadowRoot.querySelector('canvas') as HTMLElement | null
          if (canvas) {
            canvas.style.background = 'transparent'
            canvas.style.backgroundColor = 'transparent'
          }
          // Remove any background divs
          const divs = shadowRoot.querySelectorAll('div')
          const divsArray = Array.from(divs)
          for (const div of divsArray) {
            const htmlDiv = div as HTMLElement
            if (htmlDiv.style.background || htmlDiv.style.backgroundColor) {
              htmlDiv.style.background = 'transparent'
              htmlDiv.style.backgroundColor = 'transparent'
            }
          }
          // Hide "Built with Spline" badge
          const badges = shadowRoot.querySelectorAll('a[href*="spline"], .spline-badge, [class*="badge"]')
          const badgesArray = Array.from(badges)
          for (const badge of badgesArray) {
            const htmlBadge = badge as HTMLElement
            htmlBadge.style.display = 'none'
            htmlBadge.style.visibility = 'hidden'
            htmlBadge.style.opacity = '0'
            htmlBadge.style.pointerEvents = 'none'
          }
        }
        // Also set on the element itself
        const htmlElement = splineViewer as HTMLElement
        htmlElement.style.background = 'transparent'
        htmlElement.style.backgroundColor = 'transparent'
      }
    }

    // Try immediately and after delays
    removeSplineElements()
    const timer = setTimeout(removeSplineElements, 500)
    const timer2 = setTimeout(removeSplineElements, 1000)
    const timer3 = setTimeout(removeSplineElements, 3000)

    return () => {
      clearTimeout(timer)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <img src="/logo.png" alt="QR Card Logo" className="h-14 md:h-16 w-auto object-contain" />
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Özellikler
            </a>
            <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Fiyatlandırma
            </a>
            <a href="#about" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Hakkında
            </a>
          </nav>
          <div className="flex items-center space-x-4">
            <Link to="/login">
              <Button variant="ghost">Giriş Yap</Button>
            </Link>
            <Link to="/signup">
              <Button>Ücretsiz Başla</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 md:py-20">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Side - Content */}
          <div className="text-left space-y-6 lg:space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-4 animate-pulse">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-600">Pazarlama Ekibi Yönetim Platformu</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-purple-600 via-purple-500 to-purple-400 bg-clip-text text-transparent">
                Pazarlama Ekibinizi
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-700 via-purple-600 to-purple-500 bg-clip-text text-transparent">
                Profesyonelce Yönetin
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
              CRM'den satış takibine, görev yönetiminden performans analizine kadar 
              <strong className="text-foreground"> tüm pazarlama süreçlerinizi tek platformda yönetin.</strong>
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/signup">
                <Button size="lg" className="w-full sm:w-auto group bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white border-0 shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 hover:scale-105 transition-all duration-200">
                  Ücretsiz Deneyin
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-purple-200 hover:border-purple-300 hover:bg-purple-50 hover:scale-105 transition-all duration-200">
                  Giriş Yap
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-6 pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-purple-600" />
                <span className="text-sm text-muted-foreground">Kredi kartı gerektirmez</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-purple-600" />
                <span className="text-sm text-muted-foreground">14 gün ücretsiz deneme</span>
              </div>
            </div>
          </div>

          {/* Right Side - 3D Spline Viewer */}
          <div className="relative w-full h-[300px] md:h-[400px] lg:h-[450px] overflow-hidden pointer-events-none">
            <spline-viewer 
              url="https://prod.spline.design/aXSPZ5MvXFGSgFKl/scene.splinecode"
              loading="lazy"
              style={{ 
                width: '100%', 
                height: '100%', 
                pointerEvents: 'none', 
                touchAction: 'none',
                background: 'transparent',
                backgroundColor: 'transparent'
              }}
            ></spline-viewer>
          </div>
        </div>
      </section>

      {/* Why QR Card Section */}
      <section className="container mx-auto px-4 py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Award className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Neden QR Card?</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Pazarlama Ekibiniz İçin Neden En İyi Seçim?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Tüm pazarlama süreçlerinizi tek platformda yönetin, verimliliği artırın ve satışlarınızı yükseltin
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <div className="group p-6 rounded-lg border bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Merkezi Ekip Yönetimi</h3>
              <p className="text-muted-foreground text-sm">
                Tüm pazarlama personellerinizi tek yerden yönetin. Çalışan bilgileri, görevler ve performans takibi tek platformda.
              </p>
            </div>

            <div className="group p-6 rounded-lg border bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Satış Performansı Takibi</h3>
              <p className="text-muted-foreground text-sm">
                Her çalışanın satış performansını gerçek zamanlı takip edin. Komisyon hesaplamaları otomatik yapılır.
              </p>
            </div>

            <div className="group p-6 rounded-lg border bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Detaylı Analitik Raporlar</h3>
              <p className="text-muted-foreground text-sm">
                Aylık trend grafikleri, performans raporları ve kapsamlı analitik ile veriye dayalı kararlar alın.
              </p>
            </div>

            <div className="group p-6 rounded-lg border bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Zaman Tasarrufu</h3>
              <p className="text-muted-foreground text-sm">
                Manuel işlemleri azaltın, otomatikleştirin. Pazarlama ekibiniz daha fazla satış odaklı çalışsın.
              </p>
            </div>

            <div className="group p-6 rounded-lg border bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Gerçek Zamanlı Takip</h3>
              <p className="text-muted-foreground text-sm">
                Lead durumları, randevular ve görevler anlık güncellenir. Ekip koordinasyonu artar.
              </p>
            </div>

            <div className="group p-6 rounded-lg border bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                <PieChart className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Hedef ve Görev Yönetimi</h3>
              <p className="text-muted-foreground text-sm">
                Performans hedefleri belirleyin, görevleri atayın ve ilerlemeyi takip edin.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20" ref={sectionRef}>
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Briefcase className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Tüm Özellikler</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Pazarlama Ekibiniz İçin Tüm Araçlar
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            İhtiyacınız olan her şey tek platformda
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className={`p-6 rounded-lg border bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${isVisible ? 'animate-in fade-in slide-in-from-bottom-4' : ''}`}>
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
              <QrCode className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Dijital Kartvizitler</h3>
            <p className="text-muted-foreground text-sm">
              Her çalışan için benzersiz QR kodlar oluşturun ve SEO dostu profil sayfaları sunun.
            </p>
          </div>

          {/* Feature 2 */}
          <div className={`p-6 rounded-lg border bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${isVisible ? 'animate-in fade-in slide-in-from-bottom-4 delay-100' : ''}`}>
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">CRM & Satış Takibi</h3>
            <p className="text-muted-foreground text-sm">
              Lead yönetimi, Kanban board, satış takibi ve müşteri ilişkileri yönetimi.
            </p>
          </div>

          {/* Feature 3 */}
          <div className={`p-6 rounded-lg border bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${isVisible ? 'animate-in fade-in slide-in-from-bottom-4 delay-200' : ''}`}>
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Randevu Sistemi</h3>
            <p className="text-muted-foreground text-sm">
              Müşteri randevu rezervasyonu, takvim görünümü ve randevu yönetimi.
            </p>
          </div>

          {/* Feature 4 */}
          <div className={`p-6 rounded-lg border bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${isVisible ? 'animate-in fade-in slide-in-from-bottom-4 delay-300' : ''}`}>
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Görev & Hedef Yönetimi</h3>
            <p className="text-muted-foreground text-sm">
              Görev takibi, performans hedefleri ve ilerleme raporlama.
            </p>
          </div>

          {/* Feature 5 */}
          <div className={`p-6 rounded-lg border bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${isVisible ? 'animate-in fade-in slide-in-from-bottom-4 delay-400' : ''}`}>
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Finansal Yönetim</h3>
            <p className="text-muted-foreground text-sm">
              Gelir/gider takibi, komisyon yönetimi ve finansal raporlar.
            </p>
          </div>

          {/* Feature 6 */}
          <div className={`p-6 rounded-lg border bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${isVisible ? 'animate-in fade-in slide-in-from-bottom-4 delay-500' : ''}`}>
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Müşteri İletişimi</h3>
            <p className="text-muted-foreground text-sm">
              İletişim kayıtları, müşteri geçmişi ve iletişim istatistikleri.
            </p>
          </div>

          {/* Feature 7 */}
          <div className={`p-6 rounded-lg border bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${isVisible ? 'animate-in fade-in slide-in-from-bottom-4 delay-600' : ''}`}>
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
              <Phone className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">IP Telefon Entegrasyonu</h3>
            <p className="text-muted-foreground text-sm">
              Web tabanlı arama yapma, arama geçmişi ve Sanal Santral entegrasyonu.
            </p>
          </div>

          {/* Feature 8 */}
          <div className={`p-6 rounded-lg border bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${isVisible ? 'animate-in fade-in slide-in-from-bottom-4 delay-700' : ''}`}>
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
              <LineChart className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Detaylı Raporlar</h3>
            <p className="text-muted-foreground text-sm">
              Kapsamlı analitik, aylık trend grafikleri ve performans raporları.
            </p>
          </div>

          {/* Feature 9 */}
          <div className={`p-6 rounded-lg border bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${isVisible ? 'animate-in fade-in slide-in-from-bottom-4 delay-800' : ''}`}>
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Güvenli & Güvenilir</h3>
            <p className="text-muted-foreground text-sm">
              Row Level Security, veri izolasyonu ve güvenli kimlik doğrulama.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-20 bg-muted/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Neden Kolay?</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Pazarlama Ekibiniz İçin Neden En Kolay Çözüm?
            </h2>
            <p className="text-muted-foreground">
              Karmaşık sistemlerle uğraşmayın, tek tıkla başlayın
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex items-start space-x-4 group p-4 rounded-lg hover:bg-card transition-all duration-300">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">5 Dakikada Başlayın</h3>
                <p className="text-muted-foreground text-sm">
                  Karmaşık kurulum yok. Hesap oluşturun, çalışan ekleyin ve hemen kullanmaya başlayın. Ekip üyeleriniz dakikalar içinde sisteme adapte olur.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 group p-4 rounded-lg hover:bg-card transition-all duration-300">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Tek Platform, Tüm İşlemler</h3>
                <p className="text-muted-foreground text-sm">
                  CRM, randevu, görev, finans, komisyon - hepsi tek yerde. Farklı sistemler arasında geçiş yapmayın, her şey bir arada.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 group p-4 rounded-lg hover:bg-card transition-all duration-300">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Otomatik Raporlama</h3>
                <p className="text-muted-foreground text-sm">
                  Manuel rapor hazırlamaya gerek yok. Tüm istatistikler otomatik hesaplanır ve görsel grafiklerle sunulur. Zamanınızı satışa ayırın.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 group p-4 rounded-lg hover:bg-card transition-all duration-300">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Her Yerden Erişim</h3>
                <p className="text-muted-foreground text-sm">
                  Web tabanlı platform, ofis, ev, sahada - nerede olursanız olun erişin. Mobil uygulama yakında gelecek.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 group p-4 rounded-lg hover:bg-card transition-all duration-300">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Sezgisel Arayüz</h3>
                <p className="text-muted-foreground text-sm">
                  Eğitim gerektirmez. Modern, temiz arayüz sayesinde ekip üyeleriniz ilk günden verimli çalışır. Drag & drop, tek tık işlemler.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 group p-4 rounded-lg hover:bg-card transition-all duration-300">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Büyüyen Ekibinizle Büyür</h3>
                <p className="text-muted-foreground text-sm">
                  1 kişiden 100 kişiye kadar. Sistem otomatik ölçeklenir. Ekstra maliyet yok, sadece ihtiyacınız kadar ödeyin.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto px-4 py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Fiyatlandırma</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Size Uygun Paketi Seçin
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Küçük ekiplerden büyük organizasyonlara kadar her ihtiyaca uygun paketler
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {/* Bireysel Paket */}
            <div className="relative p-6 rounded-xl border bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">Bireysel</span>
              </div>
              <h3 className="text-2xl font-bold mb-2">Tek Kart</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">75₺</span>
                <span className="text-muted-foreground">/ay</span>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">1 QR Card</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Dijital kartvizit</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Public profil sayfası</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Temel özellikler</span>
                </li>
              </ul>
              <Link to="/signup" className="block">
                <Button className="w-full" variant="outline">
                  Başla
                </Button>
              </Link>
            </div>

            {/* 15 QR Card Paket */}
            <div className="relative p-6 rounded-xl border-2 border-primary bg-gradient-to-br from-primary/5 to-primary/10 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute top-4 right-4">
                <span className="px-2 py-1 text-xs font-semibold bg-primary text-primary-foreground rounded-full">
                  Popüler
                </span>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <Building className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">Şirket</span>
              </div>
              <h3 className="text-2xl font-bold mb-2">15 QR Card</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">988₺</span>
                <span className="text-muted-foreground">/ay</span>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">15 QR Card</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Tüm özellikler</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Sınırsız lead & randevu</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Öncelikli destek</span>
                </li>
              </ul>
              <Link to="/signup" className="block">
                <Button className="w-full">
                  Başla
                </Button>
              </Link>
            </div>

            {/* 30 QR Card Paket */}
            <div className="relative p-6 rounded-xl border bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center gap-2 mb-4">
                <Building className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">Şirket</span>
              </div>
              <h3 className="text-2xl font-bold mb-2">30 QR Card</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">2.400₺</span>
                <span className="text-muted-foreground">/ay</span>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">30 QR Card</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Tüm özellikler</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Gelişmiş raporlama</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Özel entegrasyonlar</span>
                </li>
              </ul>
              <Link to="/signup" className="block">
                <Button className="w-full" variant="outline">
                  Başla
                </Button>
              </Link>
            </div>
          </div>

          {/* Sınırsız Paket */}
          <div className="max-w-2xl mx-auto">
            <div className="p-8 rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Building className="h-6 w-6 text-primary" />
                    <span className="text-sm font-medium text-muted-foreground">Kurumsal</span>
                  </div>
                  <h3 className="text-3xl font-bold mb-2">Sınırsız QR Card</h3>
                  <p className="text-muted-foreground">
                    Büyük ekipler ve organizasyonlar için
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">Özel Fiyat</div>
                  <div className="text-sm text-muted-foreground">İletişime geçin</div>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Sınırsız QR Card</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Tüm özellikler</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Özel API erişimi</span>
                  </li>
                </ul>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Özel entegrasyonlar</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">7/24 öncelikli destek</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Özel eğitim & onboarding</span>
                  </li>
                </ul>
              </div>
              <Link to="/signup" className="block">
                <Button size="lg" className="w-full">
                  İletişime Geçin
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-sm text-muted-foreground">
              Tüm paketler 14 gün ücretsiz deneme içerir. Kredi kartı gerektirmez.
            </p>
          </div>
        </div>
      </section>

      {/* Security & Privacy Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 rounded-2xl border-2 border-primary/20 p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
              <div className="flex-shrink-0">
                <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                  Verileriniz Tamamen Güvende
                </h2>
                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                  Tüm verileriniz endüstri standardı şifreleme yöntemleriyle korunur. 
                  <strong className="text-foreground"> Üçüncü şahıslar ve firmamız dahil hiç kimse verilerinize erişemez.</strong> 
                  Verileriniz sadece sizindir ve sadece siz yönetirsiniz.
                </p>
                <div className="grid sm:grid-cols-3 gap-4 mt-8">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Lock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Şifreli Depolama</p>
                      <p className="text-xs text-muted-foreground">Endüstri standardı</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <EyeOff className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Sıfır Erişim</p>
                      <p className="text-xs text-muted-foreground">Firmamız bile göremez</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Server className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Güvenli Altyapı</p>
                      <p className="text-xs text-muted-foreground">Supabase güvencesi</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-12 border hover:shadow-xl transition-all duration-300">
          <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Zap className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Pazarlama Ekibinizi Bugün Yönetmeye Başlayın
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Ücretsiz deneme ile tüm özellikleri keşfedin. Kredi kartı gerektirmez, 
            <strong className="text-foreground"> 5 dakikada başlayın.</strong>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" className="w-full sm:w-auto group hover:scale-105 transition-transform duration-200">
                Ücretsiz Hesap Oluştur
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto hover:scale-105 transition-transform duration-200">
                Zaten Hesabınız Var mı?
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <img src="/logo.png" alt="QR Card Logo" className="h-8 w-auto object-contain" />
              </div>
              <p className="text-sm text-muted-foreground">
                Pazarlama personellerinizi tek platformda yönetin.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Ürün</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground">Özellikler</a></li>
                <li><a href="#pricing" className="hover:text-foreground">Fiyatlandırma</a></li>
                <li><a href="#about" className="hover:text-foreground">Hakkında</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Şirket</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Hakkımızda</a></li>
                <li><a href="#" className="hover:text-foreground">Blog</a></li>
                <li><a href="#" className="hover:text-foreground">İletişim</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Yasal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Gizlilik Politikası</a></li>
                <li><a href="#" className="hover:text-foreground">Kullanım Şartları</a></li>
                <li><a href="#" className="hover:text-foreground">Çerez Politikası</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>© 2026 QR Card. Tüm hakları saklıdır. Made with ❤️ by Gözcu Yazılım</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

