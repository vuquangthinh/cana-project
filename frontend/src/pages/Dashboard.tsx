import { useEffect, useState } from 'react'
import { claim, holderTokenId, totalLocked } from '../hooks/useContracts'

export default function Dashboard() {
  const [tokenId, setTokenId] = useState<bigint>(0n)
  const [locked, setLocked] = useState<bigint>(0n)
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    (async () => {
      const tid = await holderTokenId()
      setTokenId(tid)
      if (tid > 0n) setLocked(await totalLocked(tid))
    })()
  }, [])

  const onClaim = async () => {
    try {
      setStatus(null); setLoading(true)
      if (tokenId === 0n) { setStatus("You don't have an investor NFT"); return }
      await claim(tokenId)
      setStatus('Claim successful!')
      setLocked(await totalLocked(tokenId))
    } catch (e: any) {
      setStatus(e?.message || 'Failed to claim tokens')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Dashboard: Claim Tokens</h2>
      <div className="mb-4 p-4 rounded border bg-white dark:bg-gray-800">
        <div>Token ID: <b>{Number(tokenId)}</b></div>
        <div>Total tokens currently locked: <b>{Number(locked)}</b></div>
      </div>
      <button disabled={loading || tokenId === 0n} onClick={onClaim} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
        {loading ? 'Claiming...' : 'Claim'}
      </button>
      {status && <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">{status}</p>}
    </div>
  )
}