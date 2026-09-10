import { expect } from "chai";
import hre from "hardhat";

describe("MultiSigWallet", function () {
  async function deployWallet() {
    const { ethers } = await hre.network.connect();

    const [owner1, owner2, owner3, nonOwner, recipient] =
      await ethers.getSigners();

    const wallet = await ethers.deployContract("MultiSigWallet", [
      [owner1.address, owner2.address, owner3.address],
      2,
    ]);

    await wallet.waitForDeployment();

    return {
      wallet,
      owner1,
      owner2,
      owner3,
      nonOwner,
      recipient,
      ethers,
    };
  }

  // =========================================
  // Deployment
  // =========================================

  describe("Deployment", function () {
    it("should create the correct owners", async function () {
      const { wallet, owner1, owner2, owner3 } =
        await deployWallet();

      expect(await wallet.isOwner(owner1.address)).to.equal(true);
      expect(await wallet.isOwner(owner2.address)).to.equal(true);
      expect(await wallet.isOwner(owner3.address)).to.equal(true);
    });

    it("should require 2 confirmations", async function () {
      const { wallet } = await deployWallet();

      expect(await wallet.required()).to.equal(2n);
    });

    it("should have 3 owners", async function () {
      const { wallet } = await deployWallet();

      expect(await wallet.owners(0)).to.not.equal(
        "0x0000000000000000000000000000000000000000"
      );

      expect(await wallet.owners(1)).to.not.equal(
        "0x0000000000000000000000000000000000000000"
      );

      expect(await wallet.owners(2)).to.not.equal(
        "0x0000000000000000000000000000000000000000"
      );
    });
  });

  // =========================================
  // Deposits
  // =========================================

  describe("Deposits", function () {
    it("should receive ETH", async function () {
      const { wallet, owner1, ethers } =
        await deployWallet();

      await owner1.sendTransaction({
        to: await wallet.getAddress(),
        value: ethers.parseEther("5"),
      });

      expect(await wallet.getBalance()).to.equal(
        ethers.parseEther("5")
      );
    });
  });

  // =========================================
  // Submit Transaction
  // =========================================

  describe("Submit Transaction", function () {
    it("should allow an owner to submit a transaction", async function () {
      const { wallet, owner1, recipient, ethers } =
        await deployWallet();

      await wallet
        .connect(owner1)
        .submitTransaction(
          recipient.address,
          ethers.parseEther("1"),
          "0x"
        );

      expect(await wallet.getTransactionCount()).to.equal(1n);
    });

    it("should reject a non-owner", async function () {
      const { wallet, nonOwner, recipient, ethers } =
        await deployWallet();

      await expect(
        wallet
          .connect(nonOwner)
          .submitTransaction(
            recipient.address,
            ethers.parseEther("1"),
            "0x"
          )
      ).to.be.revertedWith("Not an owner");
    });
  });

  // =========================================
  // Confirm Transaction
  // =========================================

  describe("Confirm Transaction", function () {
    async function setupTransaction() {
      const result = await deployWallet();

      const {
        wallet,
        owner1,
        recipient,
        ethers,
      } = result;

      await wallet
        .connect(owner1)
        .submitTransaction(
          recipient.address,
          ethers.parseEther("1"),
          "0x"
        );

      return result;
    }

    it("should allow an owner to confirm", async function () {
      const { wallet, owner1 } =
        await setupTransaction();

      await wallet
        .connect(owner1)
        .confirmTransaction(0);

      expect(
        await wallet.confirmations(0, owner1.address)
      ).to.equal(true);
    });

    it("should reject a non-owner", async function () {
      const { wallet, nonOwner } =
        await setupTransaction();

      await expect(
        wallet
          .connect(nonOwner)
          .confirmTransaction(0)
      ).to.be.revertedWith("Not an owner");
    });

    it("should reject duplicate confirmation", async function () {
      const { wallet, owner1 } =
        await setupTransaction();

      await wallet
        .connect(owner1)
        .confirmTransaction(0);

      await expect(
        wallet
          .connect(owner1)
          .confirmTransaction(0)
      ).to.be.revertedWith(
        "Transaction already confirmed"
      );
    });
  });

  // =========================================
  // Revoke Confirmation
  // =========================================

  describe("Revoke Confirmation", function () {
    it("should allow an owner to revoke confirmation", async function () {
      const {
        wallet,
        owner1,
        recipient,
        ethers,
      } = await deployWallet();

      await wallet
        .connect(owner1)
        .submitTransaction(
          recipient.address,
          ethers.parseEther("1"),
          "0x"
        );

      await wallet
        .connect(owner1)
        .confirmTransaction(0);

      await wallet
        .connect(owner1)
        .revokeConfirmation(0);

      expect(
        await wallet.confirmations(0, owner1.address)
      ).to.equal(false);
    });
  });

  // =========================================
  // Execute Transaction
  // =========================================

  describe("Execute Transaction", function () {
    async function setupConfirmedTransaction() {
      const result = await deployWallet();

      const {
        wallet,
        owner1,
        owner2,
        recipient,
        ethers,
      } = result;

      // Deposit 5 ETH
      await owner1.sendTransaction({
        to: await wallet.getAddress(),
        value: ethers.parseEther("5"),
      });

      // Submit transaction
      await wallet
        .connect(owner1)
        .submitTransaction(
          recipient.address,
          ethers.parseEther("1"),
          "0x"
        );

      // Owner 1 confirms
      await wallet
        .connect(owner1)
        .confirmTransaction(0);

      // Owner 2 confirms
      await wallet
        .connect(owner2)
        .confirmTransaction(0);

      return result;
    }

    it("should reject execution without enough confirmations", async function () {
      const {
        wallet,
        owner1,
        recipient,
        ethers,
      } = await deployWallet();

      await owner1.sendTransaction({
        to: await wallet.getAddress(),
        value: ethers.parseEther("5"),
      });

      await wallet
        .connect(owner1)
        .submitTransaction(
          recipient.address,
          ethers.parseEther("1"),
          "0x"
        );

      // Only one confirmation
      await wallet
        .connect(owner1)
        .confirmTransaction(0);

      await expect(
        wallet
          .connect(owner1)
          .executeTransaction(0)
      ).to.be.revertedWith(
        "Not enough confirmations"
      );
    });

   it("should execute after required confirmations and send ETH", async function () {
  const {
    wallet,
    owner1,
    recipient,
    ethers,
  } = await setupConfirmedTransaction();

  const balanceBefore = await ethers.provider.getBalance(
    recipient.address
  );

  await wallet
    .connect(owner1)
    .executeTransaction(0);

  const balanceAfter = await ethers.provider.getBalance(
    recipient.address
  );

  // Recipient should receive exactly 1 ETH
  expect(balanceAfter - balanceBefore).to.equal(
    ethers.parseEther("1")
  );

  // Transaction should be marked as executed
  const transaction =
    await wallet.getTransaction(0);

  expect(transaction.executed).to.equal(true);

  // Wallet should have 4 ETH remaining
  expect(await wallet.getBalance()).to.equal(
    ethers.parseEther("4")
  );
});
  });
});