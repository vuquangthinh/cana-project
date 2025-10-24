import { expect } from "chai";
import { ethers, upgrades } from "hardhat";

describe("Token & Allocator", () => {
  it("enforces cap, mints allocations, and unlocks to wallets", async () => {
    const [owner, w1, w2] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("CanaToken");
    const cap = ethers.parseUnits("1000", 18);
    const token = await upgrades.deployProxy(Token, ["CanaToken", "CANA", cap], { kind: "uups" });
    await token.waitForDeployment();

    const Alloc = await ethers.getContractFactory("TokenAllocator");
    const allocator = await upgrades.deployProxy(Alloc, [await token.getAddress()], { kind: "uups" });
    await allocator.waitForDeployment();

    // Mint to allocator within cap
    await (await token.mint(await allocator.getAddress(), ethers.parseUnits("300", 18))).wait();
    await (await token.mint(owner.address, ethers.parseUnits("200", 18))).wait();

    // Setting allocations
    await (await allocator.setCategory(0, w1.address, ethers.parseUnits("100", 18))).wait();
    await (await allocator.setCategory(1, w2.address, ethers.parseUnits("50", 18))).wait();

    // Unlock
    await (await allocator.unlock(0)).wait();
    expect(await token.balanceOf(w1.address)).eq(ethers.parseUnits("100", 18));
    await (await allocator.unlock(1)).wait();
    expect(await token.balanceOf(w2.address)).eq(ethers.parseUnits("50", 18));

    // Cap enforcement: further mint exceeding cap should revert
    await expect(token.mint(owner.address, ethers.parseUnits("1000", 18))).to.be.reverted;
  });
});