import { motion } from 'framer-motion'
import { Laptop, Monitor, Smartphone, Github, ExternalLink, Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const GITHUB_RELEASES = 'https://github.com/will-17173/opencode-go/releases'
const GITHUB_URL = 'https://github.com/will-17173/opencode-go'

export default function Download() {
  const { t } = useTranslation()

  const platforms = [
    { icon: Laptop, label: t('download.macos'), sub: 'Apple Silicon / Intel', href: GITHUB_RELEASES },
    { icon: Monitor, label: t('download.windows'), sub: 'Windows 10/11 x64', href: GITHUB_RELEASES },
    { icon: Smartphone, label: t('download.mobile'), sub: 'iOS & Android', href: GITHUB_RELEASES },
  ]

  return (
    <section id="download" className="py-10 px-6 relative">
      {/* 顶部分隔线 */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)' }}
      />

      <div className="max-w-3xl mx-auto">
        <motion.div
          className="relative rounded-3xl overflow-hidden p-10 md:p-14 text-center"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.13)',
          }}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* 背景渐变光效 */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(40,175,96,0.08) 0%, transparent 70%)',
            }}
          />

          {/* GitHub Star 徽章 */}
          <div className="relative z-10 flex justify-center mb-8">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#b0b7c3',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(250,204,21,0.4)'
                e.currentTarget.style.color = '#fbbf24'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                e.currentTarget.style.color = '#b0b7c3'
              }}
            >
              <Github className="w-4 h-4" />
              <Star className="w-3.5 h-3.5" />
              <span>Star on GitHub</span>
            </a>
          </div>

          <h2
            className="relative z-10 text-3xl md:text-4xl font-bold mb-3"
            style={{ color: '#EDEDEF' }}
          >
            {t('download.title')}
          </h2>
          <p
            className="relative z-10 mb-10"
            style={{ color: '#b0b7c3' }}
          >
            {t('download.description')}
          </p>

          {/* 平台按钮 */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            {platforms.map(({ icon: Icon, label, sub, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1.5 px-4 py-4 rounded-2xl transition-all duration-200"
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.13)',
                  color: '#EDEDEF',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(40,175,96,0.1)'
                  e.currentTarget.style.borderColor = 'rgba(40,175,96,0.4)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.12)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.13)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <Icon className="w-5 h-5" style={{ color: '#4ade80' }} />
                <span className="text-sm font-medium">{label}</span>
                <span className="text-xs" style={{ color: '#6b7280' }}>{sub}</span>
              </a>
            ))}
          </div>

          {/* 提示文字 */}
          <p
            className="relative z-10 text-sm flex items-center justify-center gap-1.5"
            style={{ color: '#6b7280' }}
          >
            {t('download.coming_soon')}
            <a
              href={GITHUB_RELEASES}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 transition-colors duration-200"
              style={{ color: '#28AF60' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#4ade80' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#28AF60' }}
            >
              {t('download.github_releases')}
              <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  )
}
