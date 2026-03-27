import Hero from './components/Hero'
import Features from './components/Features'
import HowItWorks from './components/HowItWorks'
import UseCases from './components/UseCases'
import Download from './components/Download'
import Footer from './components/Footer'

export default function App() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0a0a0f' }}>
      <Hero />
      <Features />
      <HowItWorks />
      <UseCases />
      <Download />
      <Footer />
    </div>
  )
}
