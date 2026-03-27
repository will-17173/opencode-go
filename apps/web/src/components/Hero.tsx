import { motion } from 'framer-motion'
import { Github, Smartphone, Monitor } from 'lucide-react'
import { useTranslation } from 'react-i18next'

// TODO: 替换为实际 GitHub 仓库地址
const GITHUB_URL = 'https://github.com/YOUR_ORG/opencode-go'

export default function Hero() {
  const { t } = useTranslation()

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* 背景径向渐变光晕 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(99,102,241,0.15) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        {/* 设备图标装饰 */}
        <motion.div
          className="flex items-center justify-center gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Monitor className="w-8 h-8 text-indigo-400" />
          <div className="w-16 h-px bg-gradient-to-r from-indigo-500 to-violet-500" />
          <Smartphone className="w-7 h-7 text-violet-400" />
        </motion.div>

        {/* 标题 */}
        <motion.h1
          className="text-5xl md:text-7xl font-bold mb-4"
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #a5b4fc 50%, #c4b5fd 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {t('hero.title')}
        </motion.h1>

        {/* 副标题 */}
        <motion.p
          className="text-xl md:text-2xl text-indigo-300 font-medium mb-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {t('hero.subtitle')}
        </motion.p>

        {/* 描述 */}
        <motion.p
          className="text-base md:text-lg text-gray-400 max-w-2xl mx-auto mb-10"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {t('hero.description')}
        </motion.p>

        {/* CTA 按钮 */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white border border-indigo-500/50 hover:border-indigo-400 hover:bg-indigo-500/10 transition-all duration-200"
          >
            <Github className="w-5 h-5" />
            {t('hero.cta_github')}
          </a>
          <a
            href="#download"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            }}
          >
            {t('hero.cta_download')}
          </a>
        </motion.div>
      </div>
    </section>
  )
}
