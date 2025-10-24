import { NavLink, Route, Routes } from 'react-router-dom'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'
import ConnectButton from './components/ConnectButton'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-white/10 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-teal-200">GLC ICO</span>
            <nav className="flex items-center gap-4">
              <NavLink to="/" className={({isActive}) => isActive ? 'text-cyan-300 font-medium' : 'text-white/80 hover:text-white'}>Landing</NavLink>
              <NavLink to="/dashboard" className={({isActive}) => isActive ? 'text-cyan-300 font-medium' : 'text-white/80 hover:text-white'}>Dashboard</NavLink>
              {/* Admin link hidden from navbar; accessible via direct URL */}
            </nav>
          </div>
          <ConnectButton />
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
      {/* Footer polished to match template aesthetics */}
      <footer className="border-t border-white/10 bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900 text-white">
        <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm">© 2025 GLC</span>
            <span className="text-white/60">• Built with care</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="px-2 py-1 rounded-full text-xs bg-white/10 border border-white/20">Network: BSC Testnet</span>
            <span className="hidden md:inline text-white/40">|</span>
            <a href="#" className="text-white/80 hover:text-white">Terms</a>
            <a href="#" className="text-white/80 hover:text-white">Privacy</a>
            <a href="#" className="text-white/80 hover:text-white">Support</a>
            <span className="hidden md:inline text-white/40">|</span>
            <a href="#" aria-label="Twitter" className="text-white/70 hover:text-cyan-300">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M23 3c-.8.6-2.1 1.2-3.1 1.3.9-.5 1.7-1.6 2-2.6-.9.6-2.4 1.2-3.4 1.4C17.7 2.4 16.4 2 15 2c-2.7 0-4.8 2.1-4.8 4.8 0 .4 0 .7.1 1-4-.2-7.5-2.1-9.9-5-.4.7-.6 1.6-.6 2.5 0 1.8 1 3.4 2.5 4.3-.7 0-1.6-.2-2.2-.6v.1c0 2.4 1.7 4.3 3.9 4.8-.4.1-.9.2-1.4.2-.3 0-.6 0-.9-.1.6 1.9 2.4 3.2 4.5 3.2-1.7 1.3-3.8 2.1-6.1 2.1h-1c2.2 1.4 4.8 2.2 7.6 2.2 9.1 0 14.1-7.5 14.1-14.1v-.6c1-.7 1.8-1.6 2.4-2.6z"/></svg>
            </a>
            <a href="#" aria-label="Telegram" className="text-white/70 hover:text-cyan-300">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M9.99 16.2L9.8 19c.4 0 .6-.2.8-.4l1.9-1.8 3.9 2.9c.7.4 1.3.2 1.5-.7L21.9 6c.2-.9-.3-1.2-1-.9L3.2 12.7c-.8.3-.8.8-.1 1l4.3 1.3 10-6.3-7.4 7.5z"/></svg>
            </a>
            <a href="#" aria-label="GitHub" className="text-white/70 hover:text-cyan-300">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 2C6.5 2 2 6.6 2 12.1c0 4.5 2.9 8.3 6.9 9.7.5.1.7-.2.7-.5v-2c-2.8.6-3.4-1.2-3.4-1.2-.5-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.6 1.1 1.6 1.1.9 1.6 2.4 1.1 3 .8.1-.7.4-1.1.7-1.3-2.2-.3-4.5-1.1-4.5-5 0-1.1.4-2 1.1-2.8-.1-.3-.5-1.4.1-2.8 0 0 .9-.3 2.9 1.1.8-.2 1.6-.3 2.4-.3s1.6.1 2.4.3c2-1.4 2.9-1.1 2.9-1.1.6 1.4.3 2.5.1 2.8.7.7 1.1 1.7 1.1 2.8 0 3.9-2.3 4.7-4.5 5 .4.3.7.9.7 1.8v2.7c0 .3.2.6.7.5 4-1.4 6.9-5.2 6.9-9.7C22 6.6 17.5 2 12 2z"/></svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
