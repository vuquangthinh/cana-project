import { useEffect, useMemo, useState } from 'react'
import { approveAndBuy, roundInfo, tokenSymbol } from '../hooks/useContracts'
import { parseUnits } from 'ethers'

export default function Landing() {
  const [usdtAmount, setUsdtAmount] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [round, setRound] = useState<{ index: bigint, priceUSDT6PerToken: bigint, tokenAmount: bigint, sold: bigint } | null>(null)
  const [symbol, setSymbol] = useState('GLC')

  useEffect(() => {
    (async () => {
      setRound(await roundInfo())
      try { setSymbol(await tokenSymbol()) } catch {}
    })()
  }, [])

  const onBuy = async () => {
    try {
      setStatus(null); setLoading(true)
      const amount6 = parseUnits(usdtAmount || '0', 6)
      await approveAndBuy(amount6)
      setStatus('Purchase successful!')
      setUsdtAmount('')
    } catch (e: any) {
      setStatus(e?.message || 'Failed to buy ICO')
    } finally {
      setLoading(false)
      setRound(await roundInfo())
    }
  }

  const tokensLeft = round ? (round.tokenAmount - round.sold) : 0n
  const stats = useMemo(() => {
    if (!round || round.tokenAmount === 0n) return { sold: 0, total: 0, pct: 0 }
    const soldNum = Number(round.sold)
    const totalNum = Number(round.tokenAmount)
    const pct = Math.min(100, Math.floor((soldNum / totalNum) * 100))
    return { sold: soldNum, total: totalNum, pct }
  }, [round])

  return (
    <div className="max-w-7xl mx-auto">
      <section className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white p-8 md:p-12 shadow-xl">
        <div className="grid md:grid-cols-2 gap-10 items-start">
          <div className="space-y-5">
            <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-300 via-cyan-300 to-teal-200">
              {symbol} Token Sale
            </h1>
            <p className="text-white/80 text-lg">Buy {symbol} tokens in the current ICO round. Connect your wallet, enter USDT amount (6 decimals), approve and purchase in one click.</p>
            <div className="flex items-center gap-4 text-sm text-white/70">
              <span>Secure purchase</span>
              <span>•</span>
              <span>Transparent vesting</span>
              <span>•</span>
              <span>Real-time stats</span>
            </div>
          </div>

          <div id="buy" className="p-6 rounded-2xl border border-white/10 shadow-lg bg-white/10 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-white/70">Current round</div>
                <div className="text-2xl font-semibold">{round ? `#${Number(round.index)}` : '—'}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-white/70">Price / {symbol}</div>
                <div className="text-2xl font-semibold">{round ? `${formatNumber(Number(round.priceUSDT6PerToken) / 1_000_000)} USDT` : '—'}</div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/80">Sold</span>
                <span className="text-sm font-medium">{formatNumber(stats.sold)} / {formatNumber(stats.total)}</span>
              </div>
              <div className="w-full h-3 rounded-full bg-white/20 overflow-hidden">
                <div className="h-3 bg-emerald-400" style={{ width: `${stats.pct}%` }} />
              </div>
              <div className="text-xs text-white/70">{stats.pct}% sold • {formatNumber(Number(tokensLeft))} {symbol} left</div>
            </div>

            <div className="mt-6">
              <label className="text-sm text-white/80">USDT amount (6 decimals)</label>
              <div className="mt-2 flex items-center gap-3">
                <input
                  className="flex-1 px-3 py-2 rounded-md border border-white/20 bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  placeholder="Enter USDT amount"
                  value={usdtAmount}
                  onChange={(e) => setUsdtAmount(e.target.value)}
                />
                <button
                  disabled={loading}
                  onClick={onBuy}
                  className="px-4 py-2 rounded-md bg-cyan-500 text-white hover:bg-cyan-400 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Buy ' + symbol + ' Now'}
                </button>
              </div>
              {status && <p className="mt-3 text-sm text-white/80">{status}</p>}
            </div>

            <div className="mt-6 text-xs text-white/60">
              By purchasing, you agree to the sale terms and understand claim schedules may apply.
            </div>
          </div>
        </div>

        {/* decorative gradient blur */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-cyan-400/20 blur-3xl rounded-full" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-indigo-500/20 blur-3xl rounded-full" />
      </section>


      {/* features section */}
      <section className="mt-10 grid md:grid-cols-3 gap-6">
        <div className="p-5 rounded-2xl border shadow-sm bg-white/70 dark:bg-gray-800/70 backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="inline-flex w-9 h-9 items-center justify-center rounded-full bg-indigo-600/10 text-indigo-600">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5"><path strokeWidth="1.5" d="M12 3l7 4v5c0 5-7 9-7 9s-7-4-7-9V7l7-4z"/></svg>
            </span>
            <div className="text-lg font-semibold">Audited Smart Contracts</div>
          </div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Battle-tested token & sale manager, transparent configuration and vesting.</p>
        </div>
        <div className="p-5 rounded-2xl border shadow-sm bg-white/70 dark:bg-gray-800/70 backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="inline-flex w-9 h-9 items-center justify-center rounded-full bg-cyan-600/10 text-cyan-600">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5"><path strokeWidth="1.5" d="M3 7h18M3 12h18M7 17h10"/></svg>
            </span>
            <div className="text-lg font-semibold">Secure Payments</div>
          </div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Approve and buy in one flow. USDT 6-decimals on BSC Testnet.</p>
        </div>
        <div className="p-5 rounded-2xl border shadow-sm bg-white/70 dark:bg-gray-800/70 backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="inline-flex w-9 h-9 items-center justify-center rounded-full bg-emerald-600/10 text-emerald-600">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5"><path strokeWidth="1.5" d="M4 18l4-4 3 3 7-7"/></svg>
            </span>
            <div className="text-lg font-semibold">Live Sale Stats</div>
          </div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Real-time sold/total tracking with clear progress and remaining supply.</p>
        </div>
      </section>

      {/* stats strip */}
      <section className="mt-8 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 shadow-lg">
        <div className="grid sm:grid-cols-3 gap-6 text-center">
          <div className="space-y-1">
            <div className="text-sm text-white/70">Price / {symbol}</div>
            <div className="text-2xl font-semibold">{round ? `${formatNumber(Number(round.priceUSDT6PerToken) / 1_000_000)} USDT` : '—'}</div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-white/70">Sold</div>
            <div className="text-2xl font-semibold">{formatNumber(stats.sold)}</div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-white/70">Remaining</div>
            <div className="text-2xl font-semibold">{formatNumber(Number(tokensLeft))}</div>
          </div>
        </div>
      </section>

      {/* CTA strip */}
      <section className="mt-12 relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-800 via-blue-800 to-cyan-800 text-white p-6 md:p-8 shadow-lg">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="text-2xl font-bold">Ready to join the {symbol} sale?</div>
            <p className="text-white/80 text-sm">Connect your wallet and purchase on BSC Testnet. Do not send mainnet funds.</p>
          </div>
          <a href="#buy" className="px-5 py-2 rounded-md bg-cyan-500 text-white hover:bg-cyan-400">Buy {symbol} Now</a>
        </div>
        <div className="absolute -right-24 -bottom-24 w-64 h-64 bg-white/10 blur-3xl rounded-full" />
      </section>

      {/* how it works */}
      <section className="mt-12 grid md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl border shadow-sm bg-white/80 dark:bg-gray-800/80 backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="inline-flex w-10 h-10 items-center justify-center rounded-full bg-indigo-600/10 text-indigo-600">1</span>
            <div className="text-lg font-semibold">Connect Wallet</div>
          </div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Use MetaMask and switch to BSC Testnet automatically.</p>
        </div>
        <div className="p-6 rounded-2xl border shadow-sm bg-white/80 dark:bg-gray-800/80 backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="inline-flex w-10 h-10 items-center justify-center rounded-full bg-cyan-600/10 text-cyan-600">2</span>
            <div className="text-lg font-semibold">Approve & Buy</div>
          </div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Enter USDT amount (6 decimals), approve and purchase.</p>
        </div>
        <div className="p-6 rounded-2xl border shadow-sm bg-white/80 dark:bg-gray-800/80 backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="inline-flex w-10 h-10 items-center justify-center rounded-full bg-emerald-600/10 text-emerald-600">3</span>
            <div className="text-lg font-semibold">Claim Vesting</div>
          </div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Follow schedule and claim tokens in Dashboard when unlocked.</p>
        </div>
      </section>

      {/* partners strip */}
      <section className="mt-12 rounded-2xl border bg-white/70 dark:bg-gray-800/70 backdrop-blur p-6">
        <div className="flex flex-wrap items-center justify-center gap-8 opacity-80">
          <div className="h-8 w-28 bg-gray-300 dark:bg-gray-700 rounded"></div>
          <div className="h-8 w-28 bg-gray-300 dark:bg-gray-700 rounded"></div>
          <div className="h-8 w-28 bg-gray-300 dark:bg-gray-700 rounded"></div>
          <div className="h-8 w-28 bg-gray-300 dark:bg-gray-700 rounded"></div>
          <div className="h-8 w-28 bg-gray-300 dark:bg-gray-700 rounded"></div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mt-12">
        <div className="rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur shadow-sm p-6">
          <h3 className="text-xl font-semibold mb-4">FAQ</h3>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            <details className="py-3 group" open>
              <summary className="cursor-pointer flex items-center justify-between">
                <span className="font-medium">Which network is supported?</span>
                <span className="text-gray-500 group-open:rotate-180 transition">⌄</span>
              </summary>
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">BSC Testnet only. Do not send mainnet funds.</div>
            </details>
            <details className="py-3 group">
              <summary className="cursor-pointer flex items-center justify-between">
                <span className="font-medium">How is vesting configured?</span>
                <span className="text-gray-500 group-open:rotate-180 transition">⌄</span>
              </summary>
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">Admin sets epochs with start times and basis points totalling 10000.</div>
            </details>
            <details className="py-3 group">
              <summary className="cursor-pointer flex items-center justify-between">
                <span className="font-medium">Can I buy with other tokens?</span>
                <span className="text-gray-500 group-open:rotate-180 transition">⌄</span>
              </summary>
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">USDT (6 decimals) is required for this sale.</div>
            </details>
          </div>
        </div>
      </section>

      {/* newsletter */}
      <section className="mt-12 relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 text-white p-6 md:p-8">
        <div className="grid md:grid-cols-2 gap-6 items-center">
          <div>
            <div className="text-2xl font-bold">Stay updated</div>
            <p className="text-white/80 text-sm">Subscribe for sale announcements and roadmap updates.</p>
          </div>
          <form className="flex items-center gap-3">
            <input type="email" className="flex-1 px-3 py-2 rounded-md border border-white/20 bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400" placeholder="Enter your email" />
            <button type="button" className="px-4 py-2 rounded-md bg-cyan-500 text-white hover:bg-cyan-400">Subscribe</button>
          </form>
        </div>
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-white/10 blur-3xl rounded-full" />
      </section>

      {/* roadmap */}
      <section className="mt-12 relative overflow-hidden rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur p-6">
        <h3 className="text-xl font-semibold mb-4">Roadmap</h3>
        <div className="absolute left-6 right-6 top-14 h-0.5 bg-gradient-to-r from-indigo-200 via-cyan-200 to-emerald-200" />
        <div className="grid md:grid-cols-5 gap-4">
          <div className="p-4 rounded-xl border bg-white/70 dark:bg-gray-800/70 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="inline-flex w-8 h-8 items-center justify-center rounded-full bg-indigo-600/10 text-indigo-600">1</span>
              <div className="font-semibold">Launch</div>
            </div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Token contracts deployed & initial config.</p>
          </div>
          <div className="p-4 rounded-xl border bg-white/70 dark:bg-gray-800/70 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="inline-flex w-8 h-8 items-center justify-center rounded-full bg-cyan-600/10 text-cyan-600">2</span>
              <div className="font-semibold">Private Sale</div>
            </div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Whitelist investors, vesting schedule defined.</p>
          </div>
          <div className="p-4 rounded-xl border bg-white/70 dark:bg-gray-800/70 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="inline-flex w-8 h-8 items-center justify-center rounded-full bg-emerald-600/10 text-emerald-600">3</span>
              <div className="font-semibold">Public Sale</div>
            </div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Open to all with transparent stats.</p>
          </div>
          <div className="p-4 rounded-xl border bg-white/70 dark:bg-gray-800/70 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="inline-flex w-8 h-8 items-center justify-center rounded-full bg-purple-600/10 text-purple-600">4</span>
              <div className="font-semibold">Listing</div>
            </div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Exchange listing and liquidity provision.</p>
          </div>
          <div className="p-4 rounded-xl border bg-white/70 dark:bg-gray-800/70 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="inline-flex w-8 h-8 items-center justify-center rounded-full bg-rose-600/10 text-rose-600">5</span>
              <div className="font-semibold">Staking</div>
            </div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Staking incentives and rewards.</p>
          </div>
        </div>
      </section>

      {/* token metrics */}
      <section className="mt-12 grid md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl border bg-white/80 dark:bg-gray-800/80 backdrop-blur shadow-sm">
          <h3 className="text-lg font-semibold mb-3">Token Allocation</h3>
          <ul className="space-y-3">
            <li>
              <div className="flex items-center justify-between text-sm"><span>Public Sale</span><span>40%</span></div>
              <div className="h-2 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden"><div className="h-2 bg-gradient-to-r from-cyan-500 to-emerald-500" style={{width:'40%'}} /></div>
            </li>
            <li>
              <div className="flex items-center justify-between text-sm"><span>Private Sale</span><span>20%</span></div>
              <div className="h-2 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden"><div className="h-2 bg-gradient-to-r from-indigo-500 to-blue-500" style={{width:'20%'}} /></div>
            </li>
            <li>
              <div className="flex items-center justify-between text-sm"><span>Team</span><span>20%</span></div>
              <div className="h-2 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden"><div className="h-2 bg-gradient-to-r from-purple-500 to-pink-500" style={{width:'20%'}} /></div>
            </li>
            <li>
              <div className="flex items-center justify-between text-sm"><span>Treasury</span><span>20%</span></div>
              <div className="h-2 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden"><div className="h-2 bg-gradient-to-r from-slate-500 to-gray-500" style={{width:'20%'}} /></div>
            </li>
          </ul>
        </div>
        <div className="p-6 rounded-2xl border bg-white/80 dark:bg-gray-800/80 backdrop-blur shadow-sm">
          <h3 className="text-lg font-semibold mb-3">Use of Funds</h3>
          <ul className="space-y-3">
            <li>
              <div className="flex items-center justify-between text-sm"><span>Development</span><span>35%</span></div>
              <div className="h-2 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden"><div className="h-2 bg-gradient-to-r from-cyan-500 to-emerald-500" style={{width:'35%'}} /></div>
            </li>
            <li>
              <div className="flex items-center justify-between text-sm"><span>Marketing</span><span>25%</span></div>
              <div className="h-2 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden"><div className="h-2 bg-gradient-to-r from-indigo-500 to-blue-500" style={{width:'25%'}} /></div>
            </li>
            <li>
              <div className="flex items-center justify-between text-sm"><span>Operations</span><span>20%</span></div>
              <div className="h-2 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden"><div className="h-2 bg-gradient-to-r from-purple-500 to-pink-500" style={{width:'20%'}} /></div>
            </li>
            <li>
              <div className="flex items-center justify-between text-sm"><span>Liquidity</span><span>20%</span></div>
              <div className="h-2 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden"><div className="h-2 bg-gradient-to-r from-slate-500 to-gray-500" style={{width:'20%'}} /></div>
            </li>
          </ul>
        </div>
      </section>

      {/* testimonials */}
      <section className="mt-12 grid md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl border bg-white/80 dark:bg-gray-800/80 backdrop-blur shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 text-white flex items-center justify-center font-semibold">A</div>
            <div>
              <div className="font-medium">Alex Nguyen</div>
              <div className="text-xs text-gray-500">Early investor</div>
            </div>
          </div>
          <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">"Clear interface, simple and transparent purchase flow."</p>
        </div>
        <div className="p-6 rounded-2xl border bg-white/80 dark:bg-gray-800/80 backdrop-blur shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 text-white flex items-center justify-center font-semibold">B</div>
            <div>
              <div className="font-medium">Binh Tran</div>
              <div className="text-xs text-gray-500">Community member</div>
            </div>
          </div>
          <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">"Real-time stats help me make quick decisions."</p>
        </div>
        <div className="p-6 rounded-2xl border bg-white/80 dark:bg-gray-800/80 backdrop-blur shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white flex items-center justify-center font-semibold">C</div>
            <div>
              <div className="font-medium">Chi Le</div>
              <div className="text-xs text-gray-500">Web3 enthusiast</div>
            </div>
          </div>
          <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">"Modern design with a seamless mobile experience."</p>
        </div>
      </section>

      {/* team */}
      <section className="mt-12">
        <h3 className="text-xl font-semibold mb-4">Team</h3>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { name: 'Thinh Vu', role: 'Project Lead' },
            { name: 'Lan Pham', role: 'Smart Contracts' },
            { name: 'Minh Do', role: 'Frontend' },
            { name: 'Hoa Nguyen', role: 'Marketing' }
          ].map((m) => (
            <div key={m.name} className="p-6 rounded-2xl border bg-white/80 dark:bg-gray-800/80 backdrop-blur shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500" />
                <div>
                  <div className="font-medium">{m.name}</div>
                  <div className="text-xs text-gray-500">{m.role}</div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3 text-gray-500">
                <a href="#" aria-label="Twitter" className="hover:text-cyan-600">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M23 3c-.8.6-2.1 1.2-3.1 1.3.9-.5 1.7-1.6 2-2.6-.9.6-2.4 1.2-3.4 1.4C17.7 2.4 16.4 2 15 2c-2.7 0-4.8 2.1-4.8 4.8 0 .4 0 .7.1 1-4-.2-7.5-2.1-9.9-5-.4.7-.6 1.6-.6 2.5 0 1.8 1 3.4 2.5 4.3-.7 0-1.6-.2-2.2-.6v.1c0 2.4 1.7 4.3 3.9 4.8-.4.1-.9.2-1.4.2-.3 0-.6 0-.9-.1.6 1.9 2.4 3.2 4.5 3.2-1.7 1.3-3.8 2.1-6.1 2.1h-1c2.2 1.4 4.8 2.2 7.6 2.2 9.1 0 14.1-7.5 14.1-14.1v-.6c1-.7 1.8-1.6 2.4-2.6z"/></svg>
                </a>
                <a href="#" aria-label="Telegram" className="hover:text-cyan-600">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M9.99 16.2L9.8 19c.4 0 .6-.2.8-.4l1.9-1.8 3.9 2.9c.7.4 1.3.2 1.5-.7L21.9 6c.2-.9-.3-1.2-1-.9L3.2 12.7c-.8.3-.8.8-.1 1l4.3 1.3 10-6.3-7.4 7.5z"/></svg>
                </a>
                <a href="#" aria-label="GitHub" className="hover:text-cyan-600">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 2C6.5 2 2 6.6 2 12.1c0 4.5 2.9 8.3 6.9 9.7.5.1.7-.2.7-.5v-2c-2.8.6-3.4-1.2-3.4-1.2-.5-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.6 1.1 1.6 1.1.9 1.6 2.4 1.1 3 .8.1-.7.4-1.1.7-1.3-2.2-.3-4.5-1.1-4.5-5 0-1.1.4-2 1.1-2.8-.1-.3-.5-1.4.1-2.8 0 0 .9-.3 2.9 1.1.8-.2 1.6-.3 2.4-.3s1.6.1 2.4.3c2-1.4 2.9-1.1 2.9-1.1.6 1.4.3 2.5.1 2.8.7.7 1.1 1.7 1.1 2.8 0 3.9-2.3 4.7-4.5 5 .4.3.7.9.7 1.8v2.7c0 .3.2.6.7.5 4-1.4 6.9-5.2 6.9-9.7C22 6.6 17.5 2 12 2z"/></svg>
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>
      </div>
    )
}

const formatNumber = (n: number) => new Intl.NumberFormat().format(n)