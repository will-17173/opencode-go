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
    <footer className="py-10 px-6 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-gray-500 text-sm">{t('footer.copyright')}</p>

        <div className="flex items-center gap-6">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white transition-colors flex items-center gap-1.5 text-sm"
          >
            <Github className="w-4 h-4" />
            {t('footer.github')}
          </a>

          {/* 语言切换 */}
          <div className="flex items-center gap-1 text-sm">
            <button
              onClick={() => switchLang('zh')}
              className={`px-2 py-1 rounded transition-colors ${
                i18n.language === 'zh'
                  ? 'text-white bg-indigo-500/20 border border-indigo-500/40'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {t('footer.lang_zh')}
            </button>
            <span className="text-gray-600">/</span>
            <button
              onClick={() => switchLang('en')}
              className={`px-2 py-1 rounded transition-colors ${
                i18n.language === 'en'
                  ? 'text-white bg-indigo-500/20 border border-indigo-500/40'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {t('footer.lang_en')}
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}
