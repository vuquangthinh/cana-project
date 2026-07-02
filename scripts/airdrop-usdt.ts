import { ethers } from "hardhat";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const usdtAddr = process.env.USDT_ADDRESS;
  if (!usdtAddr) throw new Error("USDT_ADDRESS not set in .env");

  const recipient = process.env.AIRDROP_RECIPIENT || (process.argv[2] || "").trim() || "0x99651FFA7110cb5298aad59e15C12F20E674ebB1";
  const amountStr = process.env.AIRDROP_AMOUNT_USDT || (process.argv[3] || "").trim() || "100000"; // 100k USDT
  if (!ethers.isAddress(recipient)) throw new Error(`Invalid recipient: ${recipient}`);

  const usdt = await ethers.getContractAt("MockUSDT", usdtAddr);
  const decimals = await usdt.decimals();
  console.log("USDT address:", usdtAddr, "decimals:", decimals.toString());

  const amount = ethers.parseUnits(amountStr, 6);
  console.log(`Transferring ${amountStr} USDT (${amount.toString()} units) to`, recipient);

  const tx = await usdt.transfer(recipient, amount);
  console.log("Tx:", tx.hash);
  await tx.wait();

  const bal = await usdt.balanceOf(recipient);
  console.log("Recipient USDT balance:", bal.toString());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});