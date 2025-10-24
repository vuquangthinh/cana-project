import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("SaleManager branches", () => {
  it("reverts openSale before configuration", async () => {
    const [owner, treasury] = await ethers.getSigners();
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

    await expect(sale.openSale()).to.be.revertedWith("Rounds/epochs not set");
  });

  it("reverts configureRounds with invalid input", async () => {
    const [owner, treasury] = await ethers.getSigners();
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

    const prices = [1_000_000n];
    const roundAmts = [ethers.parseUnits("1", 18), ethers.parseUnits("2", 18)];
    await expect(sale.configureRounds(prices, roundAmts, ethers.parseUnits("3", 18))).to.be.revertedWith("Invalid input");
  });

  it("reverts configureClaimSchedule with invalid epochs", async () => {
    const [owner, treasury] = await ethers.getSigners();
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

    await expect(sale.configureClaimSchedule([])).to.be.revertedWith("No epochs");
    const now = await time.latest();
    const badEpochs = [
      { startTime: BigInt(now + 100), bps: 5000 },
      { startTime: BigInt(now + 200), bps: 4000 }
    ];
    await expect(sale.configureClaimSchedule(badEpochs)).to.be.revertedWith("Epochs must sum to 100% (10000 bps)");
  });

  it("reverts buy with zero usdt", async () => {
    const [owner, treasury, investor] = await ethers.getSigners();
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

    const prices = [1_000_000n];
    const roundAmts = [ethers.parseUnits("1", 18)];
    await (await token.mint(await sale.getAddress(), roundAmts[0])).wait();
    await (await sale.configureRounds(prices, roundAmts, roundAmts[0])).wait();
    const now = await time.latest();
    const epochs = [
      { startTime: BigInt(now + 100), bps: 10000 },
    ];
    await (await sale.configureClaimSchedule(epochs)).wait();
    await (await sale.openSale()).wait();

    await expect(sale.connect(investor).buy(0)).to.be.revertedWith("Zero usdt");
  });
});