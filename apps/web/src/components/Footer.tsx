import { Github } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const GITHUB_URL = 'https://github.com/will-17173/opencode-go'

export default function Footer() {
  const { t, i18n } = useTranslation()

  const switchLang = (lang: string) => {
    i18n.changeLanguage(lang)
    localStorage.setItem('lang', lang)
  }

  return (
    <footer
      className="py-8 px-6 relative"
      style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
    >
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Logo + 版权 */}
        <div className="flex items-center gap-3">
          <span className="font-semibold text-sm" style={{ color: '#EDEDEF' }}>OpenCode Go</span>
          <span style={{ color: '#4a4a5a' }}>·</span>
          <p className="text-sm" style={{ color: '#4a4a5a' }}>{t('footer.copyright')}</p>
        </div>

        <div className="flex items-center gap-5">
          {/* GitHub */}
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm transition-colors duration-200"
            style={{ color: '#8A8F98' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#EDEDEF' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#8A8F98' }}
          >
            <Github className="w-4 h-4" />
            {t('footer.github')}
          </a>

          {/* 分隔符 */}
          <div style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.1)' }} />

          {/* 语言切换 */}
          <div
            className="flex items-center rounded-lg overflow-hidden text-xs"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {(['zh', 'en'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => switchLang(lang)}
                className="px-3 py-1.5 transition-all duration-200"
                style={{
                  background: i18n.language === lang ? 'rgba(99,102,241,0.2)' : 'transparent',
                  color: i18n.language === lang ? '#818cf8' : '#8A8F98',
                  cursor: 'pointer',
                  border: 'none',
                }}
                onMouseEnter={(e) => {
                  if (i18n.language !== lang) {
                    e.currentTarget.style.color = '#EDEDEF'
                  }
                }}
                onMouseLeave={(e) => {
                  if (i18n.language !== lang) {
                    e.currentTarget.style.color = '#8A8F98'
                  }
                }}
              >
                {lang === 'zh' ? t('footer.lang_zh') : t('footer.lang_en')}
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
