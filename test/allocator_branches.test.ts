import { expect } from "chai";
import { ethers, upgrades } from "hardhat";

describe("TokenAllocator branches", () => {
  it("reverts unlock with no wallet and no allocation", async () => {
    const [owner] = await ethers.getSigners();
    const BadToken = await ethers.getContractFactory("BadToken");
    const token = (await BadToken.deploy()) as any;
    await token.waitForDeployment();
    const Alloc = await ethers.getContractFactory("TokenAllocator");
    const allocator = (await upgrades.deployProxy(Alloc, [await token.getAddress()], { kind: "uups" })) as any;
    await allocator.waitForDeployment();

    // No wallet
    await expect(allocator.unlock(0)).to.be.revertedWith("No wallet");

    // Wallet set but no allocation
    await (await allocator.setCategory(0, owner.address, 0)).wait();
    await expect(allocator.unlock(0)).to.be.revertedWith("No allocation");
  });

  it("reverts unlock when token transfer fails", async () => {
    const [owner] = await ethers.getSigners();
    const BadToken = await ethers.getContractFactory("BadToken");
    const token = (await BadToken.deploy()) as any;
    await token.waitForDeployment();
    const Alloc = await ethers.getContractFactory("TokenAllocator");
    const allocator = (await upgrades.deployProxy(Alloc, [await token.getAddress()], { kind: "uups" })) as any;
    await allocator.waitForDeployment();

    // Mint tokens to allocator and set category
    await (await token.mint(await allocator.getAddress(), ethers.parseUnits("1", 18))).wait();
    await (await allocator.setCategory(0, owner.address, ethers.parseUnits("1", 18))).wait();
    await expect(allocator.unlock(0)).to.be.revertedWith("Token transfer failed");
  });
});