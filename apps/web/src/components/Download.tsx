import { motion } from 'framer-motion'
import { Laptop, Monitor, Smartphone, ExternalLink } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const GITHUB_RELEASES = 'https://github.com/will-17173/opencode-go/releases'

export default function Download() {
  const { t } = useTranslation()

  const platforms = [
    { icon: Laptop, label: t('download.macos'), href: GITHUB_RELEASES },
    { icon: Monitor, label: t('download.windows'), href: GITHUB_RELEASES },
    { icon: Smartphone, label: t('download.mobile'), href: GITHUB_RELEASES },
  ]

  return (
    <section id="download" className="py-24 px-6">
      <div className="max-w-3xl mx-auto text-center">
        {/* 渐变背景卡片 */}
        <motion.div
          className="rounded-2xl p-12 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.15) 100%)',
            border: '1px solid rgba(99,102,241,0.3)',
          }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {/* 背景光晕 */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(99,102,241,0.1), transparent)' }} />

          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {t('download.title')}
            </h2>
            <p className="text-gray-400 mb-10">
              {t('download.description')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              {platforms.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-white/20 text-white hover:border-indigo-400 hover:bg-indigo-500/10 transition-all duration-200 text-sm font-medium"
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </a>
              ))}
            </div>

            <p className="text-gray-500 text-sm flex items-center justify-center gap-1">
              {t('download.coming_soon')}
              <a
                href={GITHUB_RELEASES}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1"
              >
                {t('download.github_releases')}
                <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
