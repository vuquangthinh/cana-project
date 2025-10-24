import { useState } from 'react'
import { saleManager } from '../hooks/useContracts'

export default function Admin() {
  const [roundPrices, setRoundPrices] = useState('')
  const [roundAmounts, setRoundAmounts] = useState('')
  const [epochsStartTimes, setEpochsStartTimes] = useState('')
  const [epochsBps, setEpochsBps] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onConfigureRounds = async () => {
    setStatus(null); setLoading(true)
    try {
      const prices = JSON.parse(roundPrices || '[]')
      const amounts = JSON.parse(roundAmounts || '[]')
      const sale = await saleManager(true)
      const tx = await sale.configureRounds(prices, amounts)
      await tx.wait()
      setStatus('Cấu hình rounds thành công')
    } catch (e: any) {
      setStatus(e?.message || 'Lỗi cấu hình rounds')
    } finally { setLoading(false) }
  }

  const onConfigureEpochs = async () => {
    setStatus(null); setLoading(true)
    try {
      const starts = JSON.parse(epochsStartTimes || '[]')
      const bps = JSON.parse(epochsBps || '[]')
      const sale = await saleManager(true)
      const tx = await sale.configureClaimSchedule(starts, bps)
      await tx.wait()
      setStatus('Cấu hình epochs thành công')
    } catch (e: any) {
      setStatus(e?.message || 'Lỗi cấu hình epochs')
    } finally { setLoading(false) }
  }

  const onOpenSale = async () => {
    setStatus(null); setLoading(true)
    try {
      const sale = await saleManager(true)
      const tx = await sale.openSale()
      await tx.wait()
      setStatus('Đã mở sale')
    } catch (e: any) {
      setStatus(e?.message || 'Lỗi mở sale')
    } finally { setLoading(false) }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-semibold">Admin: Setup & Cài đặt</h2>

      <section className="p-4 rounded border bg-white dark:bg-gray-800">
        <h3 className="font-medium mb-3">Configure Rounds</h3>
        <div className="grid grid-cols-1 gap-3">
          <textarea className="px-3 py-2 rounded border" rows={3} placeholder='pricesUSDT6PerToken (vd: [1000000, 2000000])' value={roundPrices} onChange={(e) => setRoundPrices(e.target.value)} />
          <textarea className="px-3 py-2 rounded border" rows={3} placeholder='tokenAmounts (vd: [1000000, 2000000])' value={roundAmounts} onChange={(e) => setRoundAmounts(e.target.value)} />
          <button disabled={loading} onClick={onConfigureRounds} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Lưu rounds</button>
        </div>
      </section>

      <section className="p-4 rounded border bg-white dark:bg-gray-800">
        <h3 className="font-medium mb-3">Configure Claim Schedule</h3>
        <div className="grid grid-cols-1 gap-3">
          <textarea className="px-3 py-2 rounded border" rows={3} placeholder='startTimes epoch (Unix time, vd: [1729100000, 1729700000])' value={epochsStartTimes} onChange={(e) => setEpochsStartTimes(e.target.value)} />
          <textarea className="px-3 py-2 rounded border" rows={3} placeholder='bps từng epoch (tổng 10000, vd: [2500, 7500])' value={epochsBps} onChange={(e) => setEpochsBps(e.target.value)} />
          <button disabled={loading} onClick={onConfigureEpochs} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Lưu epochs</button>
        </div>
      </section>

      <section className="p-4 rounded border bg-white dark:bg-gray-800">
        <h3 className="font-medium mb-3">Open Sale</h3>
        <button disabled={loading} onClick={onOpenSale} className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700">Mở bán</button>
      </section>

      {status && <p className="text-sm text-gray-700 dark:text-gray-300">{status}</p>}
    </div>
  )
}