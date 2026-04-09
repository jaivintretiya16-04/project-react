const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const SupplyChain = await hre.ethers.getContractFactory("SupplyChain");
  const supplyChain = await SupplyChain.deploy();
  await supplyChain.waitForDeployment();
  const address = await supplyChain.getAddress();
  fs.writeFileSync("address.json", JSON.stringify({ address }));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
