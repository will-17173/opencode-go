import { motion } from 'framer-motion'
import { Link2, Zap, ImageIcon, Eye, Clock, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const ICONS = [Link2, Zap, ImageIcon, Eye, Clock, RefreshCw]
const COLORS = ['#818cf8', '#a78bfa', '#60a5fa', '#34d399', '#f472b6', '#fb923c']

export default function Features() {
  const { t } = useTranslation()
  const items = t('features.items', { returnObjects: true }) as Array<{
    title: string
    description: string
  }>

  return (
    <section id="features" className="py-10 px-6 relative">
      {/* 背景光晕 */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '800px',
          height: '400px',
          background: 'radial-gradient(ellipse, rgba(99,102,241,0.06) 0%, transparent 70%)',
        }}
      />

      <div className="max-w-6xl mx-auto">
        {/* 标题区 */}
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
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.2)',
              color: '#818cf8',
            }}
          >
            {t('features.title')}
          </div>
          <h2
            className="text-3xl md:text-4xl font-bold"
            style={{ color: '#EDEDEF' }}
          >
            Everything you need,
            <br />
            <span style={{ color: '#8A8F98', fontWeight: 400 }}>on the device in your pocket.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item, i) => {
            const Icon = ICONS[i] ?? Zap
            const color = COLORS[i] ?? '#818cf8'
            const r = parseInt(color.slice(1, 3), 16)
            const g = parseInt(color.slice(3, 5), 16)
            const b = parseInt(color.slice(5, 7), 16)
            return (
              <motion.div
                key={i}
                className="relative rounded-2xl p-6 cursor-default"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
                }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget
                  el.style.background = 'rgba(255,255,255,0.05)'
                  el.style.borderColor = `rgba(${r},${g},${b},0.25)`
                  el.style.transform = 'translateY(-3px)'
                  el.style.boxShadow = `0 8px 30px rgba(0,0,0,0.3), 0 0 0 1px rgba(${r},${g},${b},0.1)`
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget
                  el.style.background = 'rgba(255,255,255,0.03)'
                  el.style.borderColor = 'rgba(255,255,255,0.07)'
                  el.style.transform = 'translateY(0)'
                  el.style.boxShadow = 'none'
                }}
              >
                {/* 图标 */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{
                    background: `rgba(${r},${g},${b},0.12)`,
                  }}
                >
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <h3
                  className="font-semibold mb-2 text-sm"
                  style={{ color: '#EDEDEF' }}
                >
                  {item.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
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
