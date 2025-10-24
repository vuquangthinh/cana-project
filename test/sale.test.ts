import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("ICO Sale flow", () => {
  it("configures sale, mints allocations, buys with USDT, locks via NFT, and claims by epochs", async () => {
    const [owner, treasury, investor] = await ethers.getSigners();

    // Deploy token
    const Token = await ethers.getContractFactory("CanaToken");
    const cap = ethers.parseUnits("1000000000", 18);
    const token = (await upgrades.deployProxy(Token, ["CanaToken", "CANA", cap], { kind: "uups" })) as any;
    await token.waitForDeployment();

    // Deploy NFT
    const Nft = await ethers.getContractFactory("InvestorNFT");
    const nft = (await upgrades.deployProxy(Nft, ["CanaInvestor", "cINV"], { kind: "uups" })) as any;
    await nft.waitForDeployment();

    // Deploy USDT mock
    const Usdt = await ethers.getContractFactory("MockUSDT");
    const usdt = (await Usdt.connect(owner).deploy()) as any;
    await usdt.waitForDeployment();

    // Deploy SaleManager
    const Sale = await ethers.getContractFactory("SaleManager");
    const sale = (await upgrades.deployProxy(Sale, [await usdt.getAddress(), await token.getAddress(), await nft.getAddress(), treasury.address], { kind: "uups" })) as any;
    await sale.waitForDeployment();

    await (await nft.setSaleManager(await sale.getAddress())).wait();

    // Deploy allocator and mint allocations
    const Alloc = await ethers.getContractFactory("TokenAllocator");
    const allocator = (await upgrades.deployProxy(Alloc, [await token.getAddress()], { kind: "uups" })) as any;
    await allocator.waitForDeployment();

    const publicSaleBps = 1000n;
    const ecosystemBps = 3000n;
    const communityBps = 2000n;
    const teamBps = 1500n;
    const reserveBps = 2000n;
    const partnershipBps = 500n;
    const sumBps = publicSaleBps + ecosystemBps + communityBps + teamBps + reserveBps + partnershipBps;
    expect(sumBps).eq(10000n);

    const total = cap;
    const publicSaleAmt = (total * publicSaleBps) / 10000n;
    const ecoAmt = (total * ecosystemBps) / 10000n;
    const communityAmt = (total * communityBps) / 10000n;
    const teamAmt = (total * teamBps) / 10000n;
    const reserveAmt = (total * reserveBps) / 10000n;
    const partnershipAmt = (total * partnershipBps) / 10000n;

    await (await token.mint(await sale.getAddress(), publicSaleAmt)).wait();
    await (await token.mint(await allocator.getAddress(), ecoAmt + communityAmt + teamAmt + reserveAmt + partnershipAmt)).wait();

    await (await allocator.setCategory(0, owner.address, ecoAmt)).wait();
    await (await allocator.setCategory(1, owner.address, communityAmt)).wait();
    await (await allocator.setCategory(2, owner.address, teamAmt)).wait();
    await (await allocator.setCategory(3, owner.address, reserveAmt)).wait();
    await (await allocator.setCategory(4, owner.address, partnershipAmt)).wait();

    // Configure rounds and epochs
    const prices = [1_000_000n, 2_000_000n]; // 1 USDT per token, 2 USDT per token
    const roundAmts = [ethers.parseUnits("1000", 18), ethers.parseUnits("2000", 18)];
    await (await sale.configureRounds(prices, roundAmts, publicSaleAmt)).wait();

    const now = await time.latest();
    const epochs = [
      { startTime: BigInt(now + 100), bps: 3000 },
      { startTime: BigInt(now + 200), bps: 3000 },
      { startTime: BigInt(now + 300), bps: 4000 }
    ];
    await (await sale.configureClaimSchedule(epochs)).wait();
    await (await sale.openSale()).wait();

    // Investor buys in round 0 with USDT
    const usdtAmount = 500_000n; // 0.5 USDT => 0.5 token (given price 1 USDT/token)
    await (await usdt.connect(owner).transfer(investor.address, 1_000_000n)).wait();
    await (await usdt.connect(investor).approve(await sale.getAddress(), 1_000_000n)).wait();
    await (await sale.connect(investor).buy(usdtAmount)).wait();

    const tokenId = await (await nft.holderTokenId(investor.address));
    expect(tokenId).to.not.equal(0n);
    const locked = await nft.totalLocked(tokenId);
    expect(locked).eq(ethers.parseUnits("0.5", 18));

    // No claim before first epoch
    await expect(sale.connect(investor).claim(tokenId)).to.be.revertedWith("Nothing to claim");
    await time.increaseTo(Number(epochs[0].startTime));

    // Claim 30%
    await (await sale.connect(investor).claim(tokenId)).wait();
    const bal1 = await token.balanceOf(investor.address);
    expect(bal1).eq(locked * 3000n / 10000n);

    // Advance to second epoch and claim
    await time.increaseTo(Number(epochs[1].startTime));
    await (await sale.connect(investor).claim(tokenId)).wait();
    const bal2 = await token.balanceOf(investor.address);
    expect(bal2).eq(locked * 6000n / 10000n);

    // Final epoch
    await time.increaseTo(Number(epochs[2].startTime));
    await (await sale.connect(investor).claim(tokenId)).wait();
    const bal3 = await token.balanceOf(investor.address);
    expect(bal3).eq(locked);

    // Upgrade sale to V2
    const SaleV2 = await ethers.getContractFactory("SaleManagerV2");
    const upgraded = (await upgrades.upgradeProxy(await sale.getAddress(), SaleV2)) as any;
    await upgraded.waitForDeployment();
    const saleV2 = (await ethers.getContractAt("SaleManagerV2", await upgraded.getAddress())) as any;
    const version = await saleV2.version();
    expect(version).eq(2n);
    const initTx = await saleV2.initializeV2(owner.address);
    await initTx.wait();
    await expect(saleV2.initializeV2(owner.address)).to.be.reverted;
  });
  
  it("reverts buy when all rounds are sold out", async () => {
    const [owner, treasury, investor] = await ethers.getSigners();

    // Deploy token
    const Token = await ethers.getContractFactory("CanaToken");
    const cap = ethers.parseUnits("1000000000", 18);
    const token = (await upgrades.deployProxy(Token, ["CanaToken", "CANA", cap], { kind: "uups" })) as any;
    await token.waitForDeployment();

    // Deploy NFT
    const Nft = await ethers.getContractFactory("InvestorNFT");
    const nft = (await upgrades.deployProxy(Nft, ["CanaInvestor", "cINV"], { kind: "uups" })) as any;
    await nft.waitForDeployment();

    // Deploy USDT mock
    const Usdt = await ethers.getContractFactory("MockUSDT");
    const usdt = (await Usdt.connect(owner).deploy()) as any;
    await usdt.waitForDeployment();

    // Deploy SaleManager
    const Sale = await ethers.getContractFactory("SaleManager");
    const sale = (await upgrades.deployProxy(Sale, [await usdt.getAddress(), await token.getAddress(), await nft.getAddress(), treasury.address], { kind: "uups" })) as any;
    await sale.waitForDeployment();
    await (await nft.setSaleManager(await sale.getAddress())).wait();

    // Mint exactly total rounds supply to sale
    const round1 = ethers.parseUnits("1", 18);
    const round2 = ethers.parseUnits("2", 18);
    const totalSupplyForSale = round1 + round2;
    await (await token.mint(await sale.getAddress(), totalSupplyForSale)).wait();

    // Configure rounds and epochs
    const prices = [1_000_000n, 2_000_000n];
    const roundAmts = [round1, round2];
    await (await sale.configureRounds(prices, roundAmts, totalSupplyForSale)).wait();

    const now = await time.latest();
    const epochs = [
      { startTime: BigInt(now + 100), bps: 3000 },
      { startTime: BigInt(now + 200), bps: 3000 },
      { startTime: BigInt(now + 300), bps: 4000 },
    ];
    await (await sale.configureClaimSchedule(epochs)).wait();
    await (await sale.openSale()).wait();

    // Fund investor and approve
    await (await usdt.connect(owner).transfer(investor.address, 5_000_000n)).wait(); // 5 USDT total
    await (await usdt.connect(investor).approve(await sale.getAddress(), 5_000_000n)).wait();

    // Buy out round 0: price 1 USDT/token, need 1 USDT
    await (await sale.connect(investor).buy(1_000_000n)).wait();
    // Buy out round 1: price 2 USDT/token, need 4 USDT
    await (await sale.connect(investor).buy(4_000_000n)).wait();

    // Any further buy should revert: all rounds sold out
    await expect(sale.connect(investor).buy(1)).to.be.revertedWith("All rounds sold out");
  });
});