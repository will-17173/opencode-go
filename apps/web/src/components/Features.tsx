import { motion } from 'framer-motion'
import { Link2, Zap, Image, Eye, History, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const ICONS = [Link2, Zap, Image, Eye, History, RefreshCw]

export default function Features() {
  const { t } = useTranslation()
  const items = t('features.items', { returnObjects: true }) as Array<{
    title: string
    description: string
  }>

  return (
    <section id="features" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          className="text-3xl md:text-4xl font-bold text-center text-white mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {t('features.title')}
        </motion.h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item, i) => {
            const Icon = ICONS[i] ?? Zap
            return (
              <motion.div
                key={i}
                className="group relative rounded-xl p-6 border transition-all duration-200 cursor-default"
                style={{
                  backgroundColor: '#111118',
                  borderColor: 'rgba(99,102,241,0.15)',
                }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                whileHover={{ y: -4 }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)'
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(99,102,241,0.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(99,102,241,0.15)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                  style={{ background: 'rgba(99,102,241,0.15)' }}>
                  <Icon className="w-5 h-5 text-indigo-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.description}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
