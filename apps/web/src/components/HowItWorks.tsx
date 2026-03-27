import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

export default function HowItWorks() {
  const { t } = useTranslation()
  const steps = t('how_it_works.steps', { returnObjects: true }) as Array<{
    title: string
    description: string
  }>

  return (
    <section id="how-it-works" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.h2
          className="text-3xl md:text-4xl font-bold text-center text-white mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {t('how_it_works.title')}
        </motion.h2>

        {/* 步骤时间线 */}
        <div className="relative">
          {/* 连接线（桌面端横向） */}
          <div className="hidden md:block absolute top-6 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.4), transparent)' }} />

          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-4">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                className="flex flex-col items-center text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                {/* 步骤圆圈 */}
                <div
                  className="relative z-10 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm mb-4 border"
                  style={{
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    borderColor: 'rgba(139,92,246,0.5)',
                    boxShadow: '0 0 20px rgba(99,102,241,0.3)',
                  }}
                >
                  {i + 1}
                </div>
                <h3 className="text-white font-semibold text-sm mb-2">{step.title}</h3>
                <p className="text-gray-400 text-xs leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
