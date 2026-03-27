import { motion } from 'framer-motion'
import { Train, Armchair, Camera } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const ICONS = [Train, Armchair, Camera]

export default function UseCases() {
  const { t } = useTranslation()
  const items = t('use_cases.items', { returnObjects: true }) as Array<{
    title: string
    description: string
  }>

  return (
    <section id="use-cases" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.h2
          className="text-3xl md:text-4xl font-bold text-center text-white mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {t('use_cases.title')}
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((item, i) => {
            const Icon = ICONS[i] ?? Camera
            return (
              <motion.div
                key={i}
                className="rounded-xl p-8 border text-center"
                style={{
                  backgroundColor: '#111118',
                  borderColor: 'rgba(139,92,246,0.2)',
                  background: 'linear-gradient(135deg, #111118 0%, #13101f 100%)',
                }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
                  style={{ background: 'rgba(139,92,246,0.15)' }}>
                  <Icon className="w-7 h-7 text-violet-400" />
                </div>
                <h3 className="text-white font-semibold text-lg mb-3">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.description}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
