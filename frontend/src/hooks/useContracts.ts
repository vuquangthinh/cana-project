import { ethers } from 'ethers'
import contracts from '../config/contracts.json'

export type ContractsConfig = {
  chainId: number
  rpcUrl: string
  contracts: {
    SaleManager: { address: string, abi: any[] }
    InvestorNFT: { address: string, abi: any[] }
    CanaToken: { address: string, abi: any[] }
    USDT: { address: string, abi: any[] }
  }
}

const cfg = contracts as ContractsConfig

export function getProvider() {
  const ethereum = (window as any).ethereum
  if (ethereum) return new ethers.BrowserProvider(ethereum)
  return new ethers.JsonRpcProvider(cfg.rpcUrl)
}

export async function getSigner() {
  const provider = getProvider()
  try { return await (provider as ethers.BrowserProvider).getSigner() } catch { return null }
}

export async function saleManager(withSigner = true) {
  const provider = getProvider()
  const signer = withSigner ? await getSigner() : null
  return new ethers.Contract(cfg.contracts.SaleManager.address, cfg.contracts.SaleManager.abi, signer ?? provider)
}

export async function usdt(withSigner = true) {
  const provider = getProvider()
  const signer = withSigner ? await getSigner() : null
  return new ethers.Contract(cfg.contracts.USDT.address, cfg.contracts.USDT.abi, signer ?? provider)
}

export async function nft(withSigner = true) {
  const provider = getProvider()
  const signer = withSigner ? await getSigner() : null
  return new ethers.Contract(cfg.contracts.InvestorNFT.address, cfg.contracts.InvestorNFT.abi, signer ?? provider)
}

export async function token(withSigner = true) {
  const provider = getProvider()
  const signer = withSigner ? await getSigner() : null
  return new ethers.Contract(cfg.contracts.CanaToken.address, cfg.contracts.CanaToken.abi, signer ?? provider)
}

export async function approveAndBuy(usdt6Amount: bigint) {
  const sale = await saleManager(true)
  const u = await usdt(true)
  const approveTx = await u.approve(cfg.contracts.SaleManager.address, usdt6Amount)
  await approveTx.wait()
  const buyTx = await sale.buy(usdt6Amount)
  await buyTx.wait()
}

export async function claim(tokenId: bigint) {
  const sale = await saleManager(true)
  const tx = await sale.claim(tokenId)
  await tx.wait()
}

export async function holderTokenId(address?: string) {
  const n = await nft(false)
  const signer = address || (await getSigner())?.address
  if (!signer) return 0n
  return await n.holderTokenId(signer)
}

export async function roundInfo() {
  try {
    const sale = await saleManager(false)
    const idx: bigint = await sale.currentRoundIndex()
    try {
      const r = await sale.rounds(idx)
      return { index: idx, priceUSDT6PerToken: r.priceUSDT6PerToken as bigint, tokenAmount: r.tokenAmount as bigint, sold: r.sold as bigint }
    } catch {
      return { index: idx, priceUSDT6PerToken: 0n, tokenAmount: 0n, sold: 0n }
    }
  } catch {
    return { index: 0n, priceUSDT6PerToken: 0n, tokenAmount: 0n, sold: 0n }
  }
}

export async function totalLocked(tokenId: bigint) {
  const n = await nft(false)
  return await n.totalLocked(tokenId)
}

export async function tokenSymbol() {
  const t = await token(false)
  try { return await t.symbol() } catch { return 'GLC' }
}