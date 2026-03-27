import { motion } from 'framer-motion'
import { Github, ArrowRight, Terminal, Smartphone } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const GITHUB_URL = 'https://github.com/will-17173/opencode-go'

export default function Hero() {
  const { t } = useTranslation()

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* 背景光晕层 */}
      <div className="absolute inset-0 pointer-events-none">
        {/* 中心主光晕 */}
        <div
          className="absolute"
          style={{
            top: '20%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '600px',
            height: '500px',
            background: 'radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
        {/* 左侧紫光 */}
        <div
          className="absolute"
          style={{
            top: '30%',
            left: '10%',
            width: '300px',
            height: '300px',
            background: 'radial-gradient(ellipse, rgba(139,92,246,0.08) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
        {/* 右侧蓝光 */}
        <div
          className="absolute"
          style={{
            top: '40%',
            right: '10%',
            width: '250px',
            height: '250px',
            background: 'radial-gradient(ellipse, rgba(59,130,246,0.08) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
      </div>

      {/* 细网格背景 */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `linear-gradient(rgba(99,102,241,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.1) 1px, transparent 1px)`,
          backgroundSize: '80px 80px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black 0%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black 0%, transparent 100%)',
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        {/* 徽章 */}
        <motion.div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 text-sm font-medium"
          style={{
            background: 'rgba(99,102,241,0.12)',
            border: '1px solid rgba(99,102,241,0.3)',
            color: '#a5b4fc',
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>OpenCode Mobile Companion</span>
        </motion.div>

        {/* 主标题 */}
        <motion.h1
          className="font-bold tracking-tight mb-6"
          style={{ lineHeight: 1.1 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <span
            className="block text-5xl md:text-7xl lg:text-8xl"
            style={{ color: '#EDEDEF' }}
          >
            {t('hero.title')}
          </span>
          <span
            className="block text-3xl md:text-4xl lg:text-5xl mt-2"
            style={{
              background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 50%, #818cf8 100%)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'shimmer 4s linear infinite',
            }}
          >
            {t('hero.subtitle')}
          </span>
        </motion.h1>

        {/* 描述 */}
        <motion.p
          className="text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
          style={{ color: '#8A8F98' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          {t('hero.description')}
        </motion.p>

        {/* CTA 按钮 */}
        <motion.div
          className="flex flex-col sm:flex-row gap-3 justify-center items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* 主按钮 */}
          <a
            href="#download"
            className="group relative inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-white transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              boxShadow: '0 0 30px rgba(99,102,241,0.35), 0 4px 15px rgba(0,0,0,0.4)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 0 45px rgba(99,102,241,0.5), 0 4px 20px rgba(0,0,0,0.4)'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 0 30px rgba(99,102,241,0.35), 0 4px 15px rgba(0,0,0,0.4)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <Smartphone className="w-4 h-4" />
            {t('hero.cta_download')}
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </a>

          {/* 次要按钮 */}
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-medium transition-all duration-200"
            style={{
              color: '#EDEDEF',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
            }}
          >
            <Github className="w-4 h-4" />
            {t('hero.cta_github')}
          </a>
        </motion.div>

        {/* 设备连接示意 */}
        <motion.div
          className="mt-20 flex items-center justify-center gap-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* 桌面端 */}
          <div
            className="flex flex-col items-center gap-3 px-6 py-4 rounded-2xl"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <div className="text-3xl" style={{ lineHeight: 1 }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2"/>
                <path d="M8 21h8M12 17v4"/>
              </svg>
            </div>
            <div>
              <div className="text-xs font-semibold" style={{ color: '#EDEDEF' }}>Desktop</div>
              <div className="text-xs" style={{ color: '#4a4a5a' }}>OpenCode + Electron</div>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400" style={{ boxShadow: '0 0 6px #4ade80' }} />
              <span className="text-xs" style={{ color: '#4ade80' }}>Running</span>
            </div>
          </div>

          {/* 连接线动画 */}
          <div className="flex items-center gap-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: '#6366f1' }}
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{
                  duration: 1.5,
                  delay: i * 0.15,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>

          {/* 手机端 */}
          <div
            className="flex flex-col items-center gap-3 px-6 py-4 rounded-2xl"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <svg width="32" height="40" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="2"/>
              <path d="M12 18h.01"/>
            </svg>
            <div>
              <div className="text-xs font-semibold" style={{ color: '#EDEDEF' }}>Mobile</div>
              <div className="text-xs" style={{ color: '#4a4a5a' }}>Flutter App</div>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" style={{ boxShadow: '0 0 6px #818cf8' }} />
              <span className="text-xs" style={{ color: '#818cf8' }}>Connected</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* shimmer 动画 */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
      `}</style>
    </section>
  )
}
