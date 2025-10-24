import { upgrades, ethers } from "hardhat";

async function main() {
  const SALE_PROXY = process.env.SALE_PROXY_ADDRESS;
  if (!SALE_PROXY) throw new Error("Set SALE_PROXY_ADDRESS in env");
  const SaleV2 = await ethers.getContractFactory("SaleManagerV2");
  const upgraded = await upgrades.upgradeProxy(SALE_PROXY, SaleV2);
  await upgraded.waitForDeployment();
  console.log("Sale upgraded:", await upgraded.getAddress());
  console.log("Version:", await (await ethers.getContractAt("SaleManagerV2", await upgraded.getAddress())).version());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});