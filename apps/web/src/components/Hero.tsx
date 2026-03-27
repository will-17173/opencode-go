import { motion } from 'framer-motion'
import { Github, ArrowRight, Smartphone, Wifi, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const GITHUB_URL = 'https://github.com/will-17173/opencode-go'

const ease = [0.16, 1, 0.3, 1] as const

export default function Hero() {
  const { t } = useTranslation()

  return (
    <section
      id="hero"
      className="relative overflow-hidden"
    >
      {/* 背景 */}
      <div className="absolute inset-0 pointer-events-none">
        {/* 左上角光晕 */}
        <div
          className="absolute"
          style={{
            top: '-10%',
            left: '-5%',
            width: '700px',
            height: '700px',
            background: 'radial-gradient(ellipse, rgba(99,102,241,0.15) 0%, transparent 65%)',
            filter: 'blur(60px)',
          }}
        />
        {/* 右下角蓝紫光 */}
        <div
          className="absolute"
          style={{
            bottom: '0%',
            right: '5%',
            width: '500px',
            height: '500px',
            background: 'radial-gradient(ellipse, rgba(139,92,246,0.1) 0%, transparent 65%)',
            filter: 'blur(80px)',
          }}
        />
        {/* 细网格 */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `linear-gradient(rgba(99,102,241,0.8) 1px, transparent 1px),
              linear-gradient(90deg, rgba(99,102,241,0.8) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
        {/* 顶部渐变遮罩 */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 120% 80% at 50% 120%, transparent 40%, #0a0a0f 80%)',
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12 py-16 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">

          {/* 左侧：文案区 */}
          <div>
            {/* 徽章 */}
            <motion.div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-8 text-xs font-medium"
              style={{
                background: 'rgba(99,102,241,0.1)',
                border: '1px solid rgba(99,102,241,0.25)',
                color: '#a5b4fc',
              }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: '#6366f1', boxShadow: '0 0 6px #6366f1' }}
              />
              OpenCode Mobile Companion
            </motion.div>

            {/* 主标题 */}
            <motion.h1
              className="font-bold tracking-tight mb-6"
              style={{ lineHeight: 1.08 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease }}
            >
              <span
                className="block text-5xl md:text-6xl lg:text-7xl"
                style={{ color: '#EDEDEF' }}
              >
                {t('hero.title')}
              </span>
              <span
                className="block text-3xl md:text-4xl lg:text-5xl mt-3"
                style={{
                  background: 'linear-gradient(135deg, #818cf8 0%, #c084fc 50%, #818cf8 100%)',
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
              className="text-lg leading-relaxed mb-10 max-w-lg"
              style={{ color: '#8A8F98' }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease }}
            >
              {t('hero.description')}
            </motion.p>

            {/* CTA 按钮 */}
            <motion.div
              className="flex flex-col sm:flex-row gap-3 mb-12"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease }}
            >
              <a
                href="#download"
                className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-white transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  boxShadow: '0 0 30px rgba(99,102,241,0.35), 0 4px 15px rgba(0,0,0,0.4)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 50px rgba(99,102,241,0.55), 0 4px 20px rgba(0,0,0,0.4)'
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
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-medium transition-all duration-200"
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

            {/* 关键特性三点 */}
            <motion.div
              className="flex flex-col gap-2.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.45, ease }}
            >
              {[t('hero.feat1'), t('hero.feat2'), t('hero.feat3')].map((feat) => (
                <div key={feat} className="flex items-center gap-2.5">
                  <div
                    className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)' }}
                  >
                    <Check className="w-2.5 h-2.5" style={{ color: '#818cf8' }} />
                  </div>
                  <span className="text-sm" style={{ color: '#6b7280' }}>{feat}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* 右侧：产品 UI 展示 */}
          <motion.div
            className="relative mt-8 lg:mt-0"
            style={{ paddingTop: '20px' }}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease }}
          >
            {/* 外层光晕 */}
            <div
              className="absolute pointer-events-none"
              style={{
                inset: '-40px',
                background: 'radial-gradient(ellipse 80% 70% at 60% 50%, rgba(99,102,241,0.12) 0%, transparent 70%)',
              }}
            />

            {/* 桌面端终端模拟 */}
            <div
              className="relative rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(13,13,20,0.9)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
                backdropFilter: 'blur(20px)',
              }}
            >
              {/* 窗口标题栏 */}
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
              >
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ background: '#ff5f57' }} />
                  <div className="w-3 h-3 rounded-full" style={{ background: '#febc2e' }} />
                  <div className="w-3 h-3 rounded-full" style={{ background: '#28c840' }} />
                </div>
                <div
                  className="text-xs px-3 py-1 rounded-md"
                  style={{ color: '#4a4a5a', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  opencode — ~/projects/my-app
                </div>
                <div className="flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5" style={{ color: '#4ade80' }} />
                  <span className="text-xs" style={{ color: '#4ade80' }}>已连接</span>
                </div>
              </div>

              {/* 终端内容 */}
              <div className="p-6" style={{ fontFamily: 'monospace' }}>
                {/* 对话行 */}
                <div className="space-y-4">
                  <div>
                    <div className="flex items-start gap-2 mb-1.5">
                      <span className="text-xs" style={{ color: '#4a4a5a' }}>user</span>
                    </div>
                    <div
                      className="rounded-xl px-4 py-2.5 text-sm inline-block max-w-xs"
                      style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.2)', color: '#c7d2fe' }}
                    >
                      帮我优化这个函数的性能
                    </div>
                  </div>

                  <div>
                    <div className="flex items-start gap-2 mb-1.5">
                      <span className="text-xs" style={{ color: '#4a4a5a' }}>assistant</span>
                    </div>
                    <div
                      className="rounded-xl px-4 py-3 text-sm"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#EDEDEF' }}
                    >
                      <p className="mb-3" style={{ color: '#9ca3af' }}>分析你的代码，发现两处优化点：</p>
                      <div
                        className="rounded-lg p-3 text-xs mb-3"
                        style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)', color: '#86efac', lineHeight: 1.7 }}
                      >
                        <span style={{ color: '#6b7280' }}>{'// Before'}</span><br />
                        <span style={{ color: '#f87171' }}>{'for (let i = 0; i < arr.length; i++) {'}</span><br />
                        <br />
                        <span style={{ color: '#6b7280' }}>{'// After (2.3x faster)'}</span><br />
                        <span style={{ color: '#86efac' }}>{'const len = arr.length'}</span><br />
                        <span style={{ color: '#86efac' }}>{'for (let i = 0; i < len; i++) {'}</span>
                      </div>
                      <p className="text-xs" style={{ color: '#6b7280' }}>缓存 length 属性减少 DOM 访问</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-start gap-2 mb-1.5">
                      <span className="text-xs" style={{ color: '#4a4a5a' }}>user</span>
                    </div>
                    <div
                      className="rounded-xl px-4 py-2.5 text-sm inline-block max-w-xs"
                      style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.2)', color: '#c7d2fe' }}
                    >
                      还有其他优化思路吗？
                    </div>
                  </div>

                  {/* 打字指示器 */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: '#6366f1' }}
                          animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                          transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity }}
                        />
                      ))}
                    </div>
                    <span className="text-xs" style={{ color: '#4a4a5a' }}>正在分析...</span>
                  </div>
                </div>
              </div>

              {/* 底部输入栏 */}
              <div
                className="flex items-center gap-3 px-4 py-3 mx-4 mb-4 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <span className="text-sm flex-1" style={{ color: '#4a4a5a', fontFamily: 'monospace' }}>
                  从手机发送的消息...
                </span>
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                >
                  <ArrowRight className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
            </div>

            {/* 悬浮手机卡片 */}
            <motion.div
              className="absolute rounded-2xl overflow-hidden"
              style={{
                width: '140px',
                bottom: '16px',
                right: '-16px',
                background: 'rgba(13,13,20,0.95)',
                border: '1px solid rgba(99,102,241,0.3)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5), 0 0 30px rgba(99,102,241,0.15)',
              }}
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              {/* 手机刘海 */}
              <div className="flex justify-center pt-2.5 pb-1">
                <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
              </div>
              <div className="px-3 pb-3">
                <div className="text-xs font-semibold mb-2" style={{ color: '#EDEDEF' }}>OpenCode Go</div>
                <div className="space-y-1.5">
                  <div className="rounded-lg px-2.5 py-2" style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.2)' }}>
                    <p className="text-xs" style={{ color: '#c7d2fe' }}>帮我优化性能</p>
                  </div>
                  <div className="rounded-lg px-2.5 py-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <p className="text-xs" style={{ color: '#9ca3af' }}>分析完成 ✓</p>
                  </div>
                </div>
                <div
                  className="mt-2 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <span className="text-xs flex-1" style={{ color: '#4a4a5a' }}>发消息...</span>
                </div>
              </div>
              <div className="flex justify-center pb-2">
                <div className="w-8 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }} />
              </div>
            </motion.div>

            {/* 连接状态标签 */}
            <motion.div
              className="absolute flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{
                top: '0px',
                right: '12px',
                background: 'rgba(13,13,20,0.95)',
                border: '1px solid rgba(74,222,128,0.3)',
                boxShadow: '0 8px 25px rgba(0,0,0,0.4)',
                zIndex: 10,
              }}
              animate={{ y: [0, 4, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            >
              <div className="w-2 h-2 rounded-full" style={{ background: '#4ade80', boxShadow: '0 0 8px #4ade80' }} />
              <span className="text-xs font-medium" style={{ color: '#4ade80' }}>LAN Connected</span>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
      `}</style>
    </section>
  )
}
