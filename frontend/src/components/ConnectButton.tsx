import { useEffect, useState } from 'react'

const BSC_TESTNET_PARAMS = {
  chainId: '0x61',
  chainName: 'Binance Smart Chain Testnet',
  nativeCurrency: { name: 'tBNB', symbol: 'tBNB', decimals: 18 },
  rpcUrls: ['https://bsc-testnet-rpc.publicnode.com'],
  blockExplorerUrls: ['https://testnet.bscscan.com'],
}

export default function ConnectButton() {
  const [account, setAccount] = useState<string | null>(null)
  const [chainId, setChainId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const ethereum = (window as any).ethereum
    if (!ethereum) return

    ethereum.request({ method: 'eth_accounts' })
      .then((accounts: string[]) => setAccount(accounts[0] ?? null))
      .catch(() => {})
    ethereum.request({ method: 'eth_chainId' })
      .then((cid: string) => setChainId(cid))
      .catch(() => {})

    const handleAccountsChanged = (accounts: string[]) => setAccount(accounts[0] ?? null)
    const handleChainChanged = (cid: string) => setChainId(cid)
    ethereum.on?.('accountsChanged', handleAccountsChanged)
    ethereum.on?.('chainChanged', handleChainChanged)
    return () => {
      ethereum.removeListener?.('accountsChanged', handleAccountsChanged)
      ethereum.removeListener?.('chainChanged', handleChainChanged)
    }
  }, [])

  const connect = async () => {
    setError(null)
    const ethereum = (window as any).ethereum
    if (!ethereum) {
      setError('Vui lòng cài MetaMask')
      return
    }
    try {
      const accounts: string[] = await ethereum.request({ method: 'eth_requestAccounts' })
      setAccount(accounts[0] ?? null)
      const cid: string = await ethereum.request({ method: 'eth_chainId' })
      setChainId(cid)
      if (cid !== BSC_TESTNET_PARAMS.chainId) {
        await switchToBsc()
      }
    } catch (e: any) {
      setError(e?.message || 'Không thể kết nối ví')
    }
  }

  const switchToBsc = async () => {
    const ethereum = (window as any).ethereum
    try {
      await ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: BSC_TESTNET_PARAMS.chainId }] })
      setChainId(BSC_TESTNET_PARAMS.chainId)
    } catch (switchError: any) {
      if (switchError?.code === 4902) {
        try {
          await ethereum.request({ method: 'wallet_addEthereumChain', params: [BSC_TESTNET_PARAMS] })
          setChainId(BSC_TESTNET_PARAMS.chainId)
        } catch (addError: any) {
          setError(addError?.message || 'Không thể thêm BSC Testnet')
        }
      } else {
        setError(switchError?.message || 'Không thể chuyển chain sang BSC Testnet')
      }
    }
  }

  const connected = Boolean(account)
  const onClick = connected ? switchToBsc : connect

  return (
    <div className="flex items-center gap-3">
      {error && <span className="text-red-300 text-sm">{error}</span>}
      <button onClick={onClick} className="px-3 py-2 rounded-md border border-white/30 bg-white/10 text-white hover:bg-white/20">
        {connected ? (chainId === BSC_TESTNET_PARAMS.chainId ? `Đã kết nối: ${short(account!)}` : 'Chuyển sang BSC Testnet') : 'Kết nối ví'}
      </button>
    </div>
  )
}

function short(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}