import { expect } from "chai";
import { ethers, upgrades } from "hardhat";

describe("InvestorNFT", () => {
  it("mints once per holder and tracks locked amount via sale manager", async () => {
    const [owner, holder, saleAdmin] = await ethers.getSigners();
    const Nft = await ethers.getContractFactory("InvestorNFT");
    const nft = (await upgrades.deployProxy(Nft, ["CanaInvestor", "cINV"], { kind: "uups" })) as any;
    await nft.waitForDeployment();
    await (await nft.setSaleManager(saleAdmin.address)).wait();

    // only sale manager can mint and increase locked
    const mintTx = await nft.connect(saleAdmin).mintIfNone(holder.address);
    await mintTx.wait();
    const tokenId = await nft.holderTokenId(holder.address);
    expect(tokenId).not.eq(0n);

    // mint again should return same id and not create new token
    const tokenId2 = await nft.connect(saleAdmin).mintIfNone.staticCall(holder.address);
    expect(tokenId2).eq(tokenId);

    await (await nft.connect(saleAdmin).increaseLocked(tokenId, ethers.parseUnits("10", 18))).wait();
    expect(await nft.totalLocked(tokenId)).eq(ethers.parseUnits("10", 18));

    await expect(nft.increaseLocked(tokenId, 1)).to.be.revertedWith("Not sale manager");
  });
});