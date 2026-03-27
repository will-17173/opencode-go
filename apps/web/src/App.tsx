import Hero from './components/Hero'
import Features from './components/Features'
import HowItWorks from './components/HowItWorks'
import UseCases from './components/UseCases'
import Download from './components/Download'
import Footer from './components/Footer'

export default function App() {
  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* 全局背景渐变 */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, #0a0a0f 0%, #050508 40%, #020203 100%)',
          zIndex: -1,
        }}
      />
      <Hero />
      <Features />
      <HowItWorks />
      <UseCases />
      <Download />
      <Footer />
    </div>
  )
}
