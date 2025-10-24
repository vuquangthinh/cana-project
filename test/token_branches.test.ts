import { expect } from "chai";
import { ethers, upgrades } from "hardhat";

describe("CanaToken branches", () => {
  it("reverts mint when exceeding hard cap", async () => {
    const Token = await ethers.getContractFactory("CanaToken");
    const cap = ethers.parseUnits("10", 18);
    const token = (await upgrades.deployProxy(Token, ["CanaToken", "CANA", cap], { kind: "uups" })) as any;
    await token.waitForDeployment();

    await (await token.mint(await token.getAddress(), cap)).wait();
    await expect(token.mint(await token.getAddress(), 1n)).to.be.reverted;
  });
});