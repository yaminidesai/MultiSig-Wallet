# MultiSig Wallet

A secure Ethereum MultiSig Wallet built with **Solidity, Hardhat 3, and ethers.js**.

This project implements a **2-of-3 multisignature wallet**, where transactions require confirmation from at least two of the three wallet owners before they can be executed.

## Overview

A MultiSig Wallet improves security by requiring multiple authorized owners to approve a transaction instead of relying on a single private key.

For this project:

- **3 owners** are configured
- **2 confirmations** are required to execute a transaction
- Owners can submit, confirm, revoke, and execute transactions
- The wallet can receive and hold ETH
- Transactions cannot be executed more than once
- Only authorized owners can perform wallet operations

## Features

- 2-of-3 multisignature authorization
- ETH deposits
- Transaction submission
- Transaction confirmation
- Confirmation revocation
- Transaction execution
- Transaction and wallet balance queries
- Owner-only access control
- Protection against duplicate confirmations
- Protection against executing transactions twice
- Reentrancy protection using OpenZeppelin `ReentrancyGuard`
- Automated TypeScript tests using Mocha and ethers.js

## Smart Contract

The main contract is:

`contracts/MultiSigWallet.sol`

### Transaction Flow

```text
Owner submits transaction
        ↓
Owner confirmations
        ↓
2 confirmations reached
        ↓
Transaction can be executed
        ↓
ETH is transferred
```

For example, with three owners:

```text
Owner 1 ──┐
          ├── 2 confirmations ──→ Execute
Owner 2 ──┘

Owner 3 can also participate in the approval process.
```

## Security

The wallet uses several checks to protect transactions:

- Only registered owners can submit, confirm, revoke, or execute transactions.
- A transaction cannot be confirmed twice by the same owner.
- A transaction cannot be revoked after execution.
- A transaction cannot be executed without the required number of confirmations.
- An executed transaction cannot be executed again.
- `ReentrancyGuard` is used to protect the execution function from reentrancy attacks.
- Duplicate owners are rejected during deployment.
- The required confirmation count must be greater than zero and cannot exceed the number of owners.

## Project Structure

```text
MultiSig-Wallet/
├── contracts/
│   └── MultiSigWallet.sol
├── test/
│   └── MultiSigWallet.ts
├── scripts/
│   ├── deploy.ts
│   ├── fund.ts
│   └── send-op-tx.ts
├── hardhat.config.ts
├── package.json
├── tsconfig.json
├── README.md
└── .gitignore
```

## Tech Stack

- **Solidity**
- **Hardhat 3**
- **TypeScript**
- **ethers.js**
- **Mocha**
- **Chai**
- **OpenZeppelin Contracts**
- **Ethereum**

## Testing

The project includes automated tests covering:

- Wallet deployment
- Owner configuration
- Confirmation requirements
- ETH deposits
- Transaction submission
- Owner authorization
- Transaction confirmation
- Duplicate confirmation prevention
- Confirmation revocation
- Insufficient confirmation handling
- Transaction execution
- Double-execution prevention

Run the complete test suite with:

```bash
npx hardhat test
```

Current test suite:

```text
12 passing
```

## Local Deployment

Start a local Hardhat blockchain:

```bash
npx hardhat node
```

In another terminal, deploy the wallet:

```bash
npx hardhat run scripts/deploy.ts --network localhost
```

The deployment script creates a wallet with three local Hardhat accounts as owners and requires two confirmations.

## Funding the Wallet

After deployment, the wallet can receive ETH.

The included funding script sends 5 ETH from Owner 1 to the MultiSig Wallet:

```bash
npx hardhat run scripts/fund.ts --network localhost
```

## Example MultiSig Transaction

A local end-to-end test was performed using three wallet owners.

### Transaction 1

Owner 1 submitted a transaction to send **1 ETH** to Owner 3.

```text
Owner 1 → Submit
Owner 1 → Confirm
Owner 2 → Confirm
Owner 2 → Execute
```

The transaction executed successfully after reaching the required **2 confirmations**.

### Transaction 2

Owner 3 submitted a transaction to send **0.5 ETH** to Owner 3.

```text
Owner 3 → Submit
Owner 3 → Confirm
Owner 2 → Confirm
Owner 2 → Execute
```

This transaction also executed successfully after reaching the required **2 confirmations**.

The wallet balance changed:

```text
Initial balance: 5 ETH
Transaction 1:  -1 ETH
Transaction 2:  -0.5 ETH
Final balance:  3.5 ETH
```

The contract also correctly rejected an attempt to execute an already executed transaction.

## Learning Goals

This project was built to understand and demonstrate:

- Solidity smart contract development
- Ethereum transaction execution
- Multisignature authorization
- Smart contract access control
- ETH transfers using low-level calls
- Reentrancy protection
- Solidity testing
- Hardhat development workflows
- ethers.js contract interaction
- Local blockchain development and testing

## Future Improvements

Potential extensions include:

- Owner management
- Adding and removing owners through multisig approval
- Daily spending limits
- Transaction cancellation
- Event-based transaction history
- More comprehensive security testing
- Deployment to a public testnet
- Integration with a frontend interface
- Hardware wallet or external signer integration

## License

MIT
