import hre from "hardhat";

async function main() {
  const { ethers } = await hre.network.connect();

  const [owner1] = await ethers.getSigners();

  const walletAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  const tx = await owner1.sendTransaction({
    to: walletAddress,
    value: ethers.parseEther("5"),
  });

  await tx.wait();

  console.log("Sent 5 ETH from Owner 1 to MultiSig Wallet");
  console.log("Transaction:", tx.hash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});