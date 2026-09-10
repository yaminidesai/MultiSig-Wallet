import hre from "hardhat";

async function main() {
  const { ethers } = await hre.network.connect();

  const [owner1, owner2, owner3] = await ethers.getSigners();

  const wallet = await ethers.deployContract("MultiSigWallet", [
    [owner1.address, owner2.address, owner3.address],
    2,
  ]);

  await wallet.waitForDeployment();

  console.log("MultiSig Wallet deployed to:", await wallet.getAddress());
  console.log("Owner 1:", owner1.address);
  console.log("Owner 2:", owner2.address);
  console.log("Owner 3:", owner3.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});