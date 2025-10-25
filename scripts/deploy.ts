import { ethers, upgrades } from "hardhat";
import dotenv from "dotenv";
dotenv.config();

function toWeiTokens(n: string | number) {
  return ethers.parseUnits(String(n), 18);
}

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const name = process.env.TOKEN_NAME || "CanaToken";
  const symbol = process.env.TOKEN_SYMBOL || "CANA";
  const capWhole = BigInt(process.env.TOKEN_CAP || "1000000000");
  const cap = capWhole * 10n ** 18n;

  // Deploy Token
  const Token = await ethers.getContractFactory("CanaToken");
  const token = await upgrades.deployProxy(Token, [name, symbol, cap], {
    kind: "uups"
  });
  await token.waitForDeployment();
  console.log("Token:", await token.getAddress());

  // Deploy NFT
  const Nft = await ethers.getContractFactory("InvestorNFT");
  const nft = await upgrades.deployProxy(Nft, ["CanaInvestor", "cINV"], {
    kind: "uups"
  });
  await nft.waitForDeployment();
  console.log("NFT:", await nft.getAddress());

  // Deploy SaleManager
  const treasury = process.env.TREASURY_WALLET || deployer.address;
  const usdtAddr = process.env.USDT_ADDRESS || ethers.ZeroAddress;
  const Sale = await ethers.getContractFactory("SaleManager");
  const sale = await upgrades.deployProxy(Sale, [usdtAddr, await token.getAddress(), await nft.getAddress(), treasury], {
    kind: "uups"
  });
  await sale.waitForDeployment();
  console.log("Sale:", await sale.getAddress());

  // Wire NFT -> sale manager
  const nftTx = await nft.setSaleManager(await sale.getAddress());
  await nftTx.wait();

  // Deploy TokenAllocator
  const Alloc = await ethers.getContractFactory("TokenAllocator");
  const allocator = await upgrades.deployProxy(Alloc, [await token.getAddress()], { kind: "uups" });
  await allocator.waitForDeployment();
  console.log("Allocator:", await allocator.getAddress());

  // Read allocation percentages
  const bps = (key: string, fallback: number | bigint) => BigInt(process.env[key] || String(fallback));
  const PUBLIC_BPS = bps("PUBLIC_SALE_BPS", 1000n);
  const ECOSYSTEM_BPS = bps("ECOSYSTEM_BPS", 3000n);
  const COMMUNITY_BPS = bps("COMMUNITY_BPS", 2000n);
  const TEAM_BPS = bps("TEAM_BPS", 1500n);
  const RESERVE_BPS = bps("RESERVE_BPS", 2000n);
  const PARTNERSHIP_BPS = bps("PARTNERSHIP_BPS", 500n);

  const sum = PUBLIC_BPS + ECOSYSTEM_BPS + COMMUNITY_BPS + TEAM_BPS + RESERVE_BPS + PARTNERSHIP_BPS;
  if (sum !== 10000n) throw new Error("Allocation BPS must sum to 10000");

  const total = cap; // cap as total minted cap reference
  const publicSaleAmount = (total * PUBLIC_BPS) / 10000n;
  const ecoAmount = (total * ECOSYSTEM_BPS) / 10000n;
  const communityAmount = (total * COMMUNITY_BPS) / 10000n;
  const teamAmount = (total * TEAM_BPS) / 10000n;
  const reserveAmount = (total * RESERVE_BPS) / 10000n;
  const partnershipAmount = (total * PARTNERSHIP_BPS) / 10000n;

  // Mint allocations (public sale to sale, others to allocator)
  await (await token.mint(await sale.getAddress(), publicSaleAmount)).wait();
  await (await token.mint(await allocator.getAddress(), ecoAmount + communityAmount + teamAmount + reserveAmount + partnershipAmount)).wait();

  // Configure allocator wallets and allocations
  const addr = (key: string) => (ethers.isAddress(process.env[key] || "") ? (process.env[key] as string) : ethers.ZeroAddress);
  await (await allocator.setCategory(0, addr("ECOSYSTEM_WALLET"), ecoAmount)).wait();
  await (await allocator.setCategory(1, addr("COMMUNITY_WALLET"), communityAmount)).wait();
  await (await allocator.setCategory(2, addr("TEAM_WALLET"), teamAmount)).wait();
  await (await allocator.setCategory(3, addr("RESERVE_WALLET"), reserveAmount)).wait();
  await (await allocator.setCategory(4, addr("PARTNERSHIP_WALLET"), partnershipAmount)).wait();

  console.log("Allocations minted and configured.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});