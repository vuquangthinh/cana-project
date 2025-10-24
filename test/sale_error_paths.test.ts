import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("SaleManager error paths", () => {
  it("reverts buy when USDT transferFrom fails", async () => {
    const [owner, treasury, investor] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("CanaToken");
    const cap = ethers.parseUnits("1000000000", 18);
    const token = (await upgrades.deployProxy(Token, ["CanaToken", "CANA", cap], { kind: "uups" })) as any;
    await token.waitForDeployment();
    const Nft = await ethers.getContractFactory("InvestorNFT");
    const nft = (await upgrades.deployProxy(Nft, ["CanaInvestor", "cINV"], { kind: "uups" })) as any;
    await nft.waitForDeployment();
    const BadUsdt = await ethers.getContractFactory("BadUSDT");
    const usdt = (await BadUsdt.deploy()) as any;
    await usdt.waitForDeployment();
    const Sale = await ethers.getContractFactory("SaleManager");
    const sale = (await upgrades.deployProxy(Sale, [await usdt.getAddress(), await token.getAddress(), await nft.getAddress(), treasury.address], { kind: "uups" })) as any;
    await sale.waitForDeployment();
    await (await nft.setSaleManager(await sale.getAddress())).wait();

    await (await token.mint(await sale.getAddress(), ethers.parseUnits("1", 18))).wait();
    await (await sale.configureRounds([1_000_000n], [ethers.parseUnits("1", 18)], ethers.parseUnits("1", 18))).wait();
    const now = await time.latest();
    await (await sale.configureClaimSchedule([{ startTime: BigInt(now + 100), bps: 10000 }])).wait();
    await (await sale.openSale()).wait();

    // Fund investor and approve
    await (await usdt.connect(owner).transfer(investor.address, 1_000_000n)).wait();
    await (await usdt.connect(investor).approve(await sale.getAddress(), 1_000_000n)).wait();

    await expect(sale.connect(investor).buy(1_000_000n)).to.be.revertedWith("USDT transfer failed");
  });

  it("reverts claim when token transfer fails", async () => {
    const [owner, treasury, investor] = await ethers.getSigners();
    const BadToken = await ethers.getContractFactory("BadToken");
    const badToken = (await BadToken.deploy()) as any;
    await badToken.waitForDeployment();
    const Nft = await ethers.getContractFactory("InvestorNFT");
    const nft = (await upgrades.deployProxy(Nft, ["CanaInvestor", "cINV"], { kind: "uups" })) as any;
    await nft.waitForDeployment();
    const Usdt = await ethers.getContractFactory("MockUSDT");
    const usdt = (await Usdt.deploy()) as any;
    await usdt.waitForDeployment();
    const Sale = await ethers.getContractFactory("SaleManager");
    const sale = (await upgrades.deployProxy(Sale, [await usdt.getAddress(), await badToken.getAddress(), await nft.getAddress(), treasury.address], { kind: "uups" })) as any;
    await sale.waitForDeployment();
    await (await nft.setSaleManager(await sale.getAddress())).wait();

    // Mint tokens to sale and configure
    await (await badToken.mint(await sale.getAddress(), ethers.parseUnits("1", 18))).wait();
    await (await sale.configureRounds([1_000_000n], [ethers.parseUnits("1", 18)], ethers.parseUnits("1", 18))).wait();
    const now = await time.latest();
    await (await sale.configureClaimSchedule([{ startTime: BigInt(now + 100), bps: 10000 }])).wait();
    await (await sale.openSale()).wait();

    // Buy to lock tokens
    await (await usdt.connect(owner).transfer(investor.address, 1_000_000n)).wait();
    await (await usdt.connect(investor).approve(await sale.getAddress(), 1_000_000n)).wait();
    await (await sale.connect(investor).buy(1_000_000n)).wait();

    const tokenId = await nft.holderTokenId(investor.address);
    await time.increase(200);
    await expect(sale.connect(investor).claim(tokenId)).to.be.revertedWith("Token transfer failed");
  });

  it("reverts claim when not owner and when no locked", async () => {
    const [owner, treasury, investor, other] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("CanaToken");
    const cap = ethers.parseUnits("1000000000", 18);
    const token = (await upgrades.deployProxy(Token, ["CanaToken", "CANA", cap], { kind: "uups" })) as any;
    await token.waitForDeployment();
    const Nft = await ethers.getContractFactory("InvestorNFT");
    const nft = (await upgrades.deployProxy(Nft, ["CanaInvestor", "cINV"], { kind: "uups" })) as any;
    await nft.waitForDeployment();
    const Usdt = await ethers.getContractFactory("MockUSDT");
    const usdt = (await Usdt.deploy()) as any;
    await usdt.waitForDeployment();
    const Sale = await ethers.getContractFactory("SaleManager");
    const sale = (await upgrades.deployProxy(Sale, [await usdt.getAddress(), await token.getAddress(), await nft.getAddress(), treasury.address], { kind: "uups" })) as any;
    await sale.waitForDeployment();
    await (await nft.setSaleManager(await sale.getAddress())).wait();

    await (await sale.configureRounds([1_000_000n], [ethers.parseUnits("1", 18)], ethers.parseUnits("1", 18))).wait();
    const now = await time.latest();
    await (await sale.configureClaimSchedule([{ startTime: BigInt(now + 100), bps: 10000 }])).wait();
    await (await sale.openSale()).wait();

    // Mint an NFT manually via saleManager role and attempt claim with non-owner
    await (await nft.connect(owner).setSaleManager(owner.address)).wait();
    const tokenId = await nft.connect(owner).mintIfNone.staticCall(investor.address);
    await (await nft.connect(owner).mintIfNone(investor.address)).wait();
    await expect(sale.connect(other).claim(tokenId)).to.be.revertedWith("Not owner");

    // Claim with owner but no locked should revert
    await expect(sale.connect(investor).claim(tokenId)).to.be.revertedWith("No locked");
  });
});