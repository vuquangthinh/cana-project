import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const Mock = await ethers.getContractFactory("MockUSDT");
  const mock = await Mock.deploy();
  await mock.waitForDeployment();

  const addr = await mock.getAddress();
  console.log("MockUSDT:", addr);

  const decimals = await mock.decimals();
  console.log("Decimals:", decimals);

  const bal = await mock.balanceOf(deployer.address);
  console.log("Deployer USDT balance:", bal.toString());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});