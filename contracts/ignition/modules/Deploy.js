const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("SupplyChainModule", (m) => {
  const supplyChain = m.contract("SupplyChain");

  return { supplyChain };
});
