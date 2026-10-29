import hre from "hardhat";
import { upgrades } from "@openzeppelin/hardhat-upgrades";

async function main() {
  // One connection, shared by everything below
  const connection = await hre.network.create();
  const { ethers } = connection;
  const upgradesApi = await upgrades(hre, connection);

  const [owner, user] = await ethers.getSigners();

  // 1. Deploy implementation V1 behind a Transparent proxy
  const V1 = await ethers.getContractFactory("LendingV1");
  const proxy: any = await upgradesApi.deployProxy(V1, [owner.address], {
    kind: "transparent",
  });
  await proxy.waitForDeployment();
  const proxyAddress = await proxy.getAddress();

  console.log("Proxy:", proxyAddress);
  console.log("Implementation V1:", await upgradesApi.erc1967.getImplementationAddress(proxyAddress));
  console.log("Proxy admin:", await upgradesApi.erc1967.getAdminAddress(proxyAddress));

  // 2. Use it: deposit 1 ETH, borrow 0.4 ETH
  await proxy.connect(user).deposit({ value: ethers.parseEther("1") });
  await proxy.connect(user).borrow(ethers.parseEther("0.4"));
  console.log("Deposit before upgrade:", ethers.formatEther(await proxy.deposits(user.address)));
  console.log("Debt before upgrade:", ethers.formatEther(await proxy.debts(user.address)));

  // 3. Upgrade to V2
  const V2 = await ethers.getContractFactory("LendingV2");
  const upgraded: any = await upgradesApi.upgradeProxy(proxyAddress, V2);
  console.log("Proxy after upgrade:", await upgraded.getAddress());
  console.log("Implementation V2:", await upgradesApi.erc1967.getImplementationAddress(proxyAddress));

  // 4. Check the old data is safe and the new function works
  console.log("Deposit after upgrade:", ethers.formatEther(await upgraded.deposits(user.address)));
  console.log("Debt after upgrade:", ethers.formatEther(await upgraded.debts(user.address)));
  console.log("Available to borrow (new in V2):", ethers.formatEther(await upgraded.availableToBorrow(user.address)));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});