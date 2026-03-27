import { Github } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const GITHUB_URL = 'https://github.com/will-17173/opencode-go'

export default function Footer() {
  const { t } = useTranslation()

  return (
    <footer
      className="py-8 px-6 relative"
      style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
    >
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Logo + 版权 */}
        <div className="flex items-center gap-3">
          <span className="font-semibold text-sm" style={{ color: '#EDEDEF' }}>OpenCode Go</span>
          <span style={{ color: '#6b7280' }}>·</span>
          <p className="text-sm" style={{ color: '#6b7280' }}>{t('footer.copyright')}</p>
        </div>

        {/* GitHub */}
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm transition-colors duration-200"
          style={{ color: '#b0b7c3' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#EDEDEF' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#b0b7c3' }}
        >
          <Github className="w-4 h-4" />
          {t('footer.github')}
        </a>
      </div>
    </footer>
  )
}
