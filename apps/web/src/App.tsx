import { useTranslation } from 'react-i18next'
import Hero from './components/Hero'
import Features from './components/Features'
import HowItWorks from './components/HowItWorks'
import UseCases from './components/UseCases'
import Download from './components/Download'
import Footer from './components/Footer'

function LangSwitch() {
  const { i18n, t } = useTranslation()
  const switchLang = (lang: string) => {
    i18n.changeLanguage(lang)
    localStorage.setItem('lang', lang)
  }
  return (
    <div
      className="fixed top-4 right-5 z-50 flex items-center rounded-lg overflow-hidden text-xs"
      style={{ border: '1px solid rgba(255,255,255,0.13)', background: 'rgba(10,10,15,0.8)', backdropFilter: 'blur(12px)' }}
    >
      {(['zh', 'en'] as const).map((lang) => (
        <button
          key={lang}
          onClick={() => switchLang(lang)}
          className="px-3 py-1.5 transition-all duration-200"
          style={{
            background: i18n.language === lang ? 'rgba(40,175,96,0.2)' : 'transparent',
            color: i18n.language === lang ? '#4ade80' : '#b0b7c3',
            cursor: 'pointer',
            border: 'none',
          }}
          onMouseEnter={(e) => { if (i18n.language !== lang) e.currentTarget.style.color = '#EDEDEF' }}
          onMouseLeave={(e) => { if (i18n.language !== lang) e.currentTarget.style.color = '#b0b7c3' }}
        >
          {lang === 'zh' ? t('footer.lang_zh') : t('footer.lang_en')}
        </button>
      ))}
    </div>
  )
}

export default function App() {
  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* 全局背景渐变 */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, #0a0a0f 0%, #050508 40%, #020203 100%)',
          zIndex: -1,
        }}
      />
      <LangSwitch />
      <Hero />
      <Features />
      <HowItWorks />
      <UseCases />
      <Download />
      <Footer />
    </div>
  )
}
