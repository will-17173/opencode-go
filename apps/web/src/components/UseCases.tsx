import { motion } from 'framer-motion'
import { Train, Armchair, Camera } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const CONFIGS = [
  { icon: Train, color: '#818cf8', bg: 'rgba(129,140,248,0.1)' },
  { icon: Armchair, color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
  { icon: Camera, color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
]

export default function UseCases() {
  const { t } = useTranslation()
  const items = t('use_cases.items', { returnObjects: true }) as Array<{
    title: string
    description: string
  }>

  return (
    <section id="use-cases" className="py-10 px-6 relative">
      {/* 背景分隔线 */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)' }}
      />

      <div className="max-w-5xl mx-auto">
        {/* 标题 */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4"
            style={{
              background: 'rgba(96,165,250,0.1)',
              border: '1px solid rgba(96,165,250,0.2)',
              color: '#60a5fa',
            }}
          >
            {t('use_cases.title')}
          </div>
          <h2
            className="text-3xl md:text-4xl font-bold"
            style={{ color: '#EDEDEF' }}
          >
            Your workflow,
            <br />
            <span style={{ color: '#8A8F98', fontWeight: 400 }}>untethered from your desk.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {items.map((item, i) => {
            const { icon: Icon, color, bg } = CONFIGS[i] ?? CONFIGS[0]
            return (
              <motion.div
                key={i}
                className="relative rounded-2xl p-7 overflow-hidden"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* 卡片背景光晕 */}
                <div
                  className="absolute pointer-events-none"
                  style={{
                    top: '-20px',
                    right: '-20px',
                    width: '140px',
                    height: '140px',
                    background: `radial-gradient(ellipse, ${bg.replace('0.1)', '0.15)')} 0%, transparent 70%)`,
                  }}
                />

                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 relative z-10"
                  style={{ background: bg }}
                >
                  <Icon className="w-6 h-6" style={{ color }} />
                </div>
                <h3
                  className="font-semibold text-base mb-2 relative z-10"
                  style={{ color: '#EDEDEF' }}
                >
                  {item.title}
                </h3>
                <p
                  className="text-sm leading-relaxed relative z-10"
                  style={{ color: '#8A8F98' }}
                >
                  {item.description}
                </p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
