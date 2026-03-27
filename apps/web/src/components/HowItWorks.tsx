import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

export default function HowItWorks() {
  const { t } = useTranslation()
  const steps = t('how_it_works.steps', { returnObjects: true }) as Array<{
    title: string
    description: string
  }>

  return (
    <section id="how-it-works" className="py-10 px-6 relative">
      <div className="max-w-4xl mx-auto">
        {/* 标题 */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4"
            style={{
              background: 'rgba(139,92,246,0.1)',
              border: '1px solid rgba(139,92,246,0.2)',
              color: '#a78bfa',
            }}
          >
            {t('how_it_works.title')}
          </div>
          <h2
            className="text-3xl md:text-4xl font-bold"
            style={{ color: '#EDEDEF' }}
          >
            Up and running
            <br />
            <span style={{ color: '#b0b7c3', fontWeight: 400 }}>in five simple steps.</span>
          </h2>
        </motion.div>

        {/* 步骤列表 */}
        <div className="relative">
          {/* 左侧连接线 */}
          <div
            className="absolute hidden md:block"
            style={{
              left: '28px',
              top: '28px',
              bottom: '28px',
              width: '1px',
              background: 'linear-gradient(180deg, rgba(99,102,241,0.5) 0%, rgba(139,92,246,0.2) 100%)',
            }}
          />

          <div className="space-y-6">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                className="flex gap-6 items-start"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* 步骤编号圆圈 */}
                <div
                  className="relative z-10 flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg"
                  style={{
                    background: i === 0
                      ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                      : 'rgba(255,255,255,0.12)',
                    border: `1px solid ${i === 0 ? 'transparent' : 'rgba(255,255,255,0.13)'}`,
                    color: i === 0 ? '#fff' : '#b0b7c3',
                    boxShadow: i === 0 ? '0 0 20px rgba(99,102,241,0.4)' : 'none',
                  }}
                >
                  {i + 1}
                </div>

                {/* 内容 */}
                <div
                  className="flex-1 rounded-2xl p-5"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                  }}
                >
                  <h3
                    className="font-semibold mb-1"
                    style={{ color: '#EDEDEF' }}
                  >
                    {step.title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: '#b0b7c3' }}
                  >
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
