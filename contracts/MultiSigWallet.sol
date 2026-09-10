// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract MultiSigWallet is ReentrancyGuard {
    // =========================
    // Transaction Structure
    // =========================

    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
    }

    // =========================
    // State Variables
    // =========================

    address[] public owners;

    mapping(address => bool) public isOwner;

    uint256 public required;

    Transaction[] public transactions;

    mapping(uint256 => mapping(address => bool)) public confirmations;

    // =========================
    // Events
    // =========================

    event Deposit(address indexed sender, uint256 amount);

    event SubmitTransaction(
        address indexed owner,
        uint256 indexed txIndex,
        address indexed to,
        uint256 value,
        bytes data
    );

    event ConfirmTransaction(address indexed owner, uint256 indexed txIndex);

    event RevokeConfirmation(address indexed owner, uint256 indexed txIndex);

    event ExecuteTransaction(address indexed owner, uint256 indexed txIndex);

    // =========================
    // Modifiers
    // =========================

    modifier onlyOwner() {
        require(isOwner[msg.sender], "Not an owner");
        _;
    }

    modifier transactionExists(uint256 txIndex) {
        require(txIndex < transactions.length, "Transaction does not exist");
        _;
    }

    modifier notExecuted(uint256 txIndex) {
        require(
            !transactions[txIndex].executed,
            "Transaction already executed"
        );
        _;
    }

    modifier notConfirmed(uint256 txIndex) {
        require(
            !confirmations[txIndex][msg.sender],
            "Transaction already confirmed"
        );
        _;
    }

    // =========================
    // Constructor
    // =========================

    constructor(address[] memory _owners, uint256 _required) {
        require(_owners.length > 0, "Owners required");

        require(
            _required > 0 && _required <= _owners.length,
            "Invalid requirement"
        );

        for (uint256 i = 0; i < _owners.length; i++) {
            address owner = _owners[i];

            require(owner != address(0), "Invalid owner");

            require(!isOwner[owner], "Owner not unique");

            isOwner[owner] = true;
            owners.push(owner);
        }

        required = _required;
    }

    // =========================
    // Receive ETH
    // =========================

    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }

    // =========================
    // Submit Transaction
    // =========================

    function submitTransaction(
        address to,
        uint256 value,
        bytes calldata data
    ) external onlyOwner {
        uint256 txIndex = transactions.length;

        transactions.push(
            Transaction({to: to, value: value, data: data, executed: false})
        );

        emit SubmitTransaction(msg.sender, txIndex, to, value, data);
    }

    // =========================
    // Confirm Transaction
    // =========================

    function confirmTransaction(
        uint256 txIndex
    )
        external
        onlyOwner
        transactionExists(txIndex)
        notExecuted(txIndex)
        notConfirmed(txIndex)
    {
        confirmations[txIndex][msg.sender] = true;

        emit ConfirmTransaction(msg.sender, txIndex);
    }

    // =========================
    // Revoke Confirmation
    // =========================

    function revokeConfirmation(
        uint256 txIndex
    ) external onlyOwner transactionExists(txIndex) notExecuted(txIndex) {
        require(
            confirmations[txIndex][msg.sender],
            "Transaction not confirmed"
        );

        confirmations[txIndex][msg.sender] = false;

        emit RevokeConfirmation(msg.sender, txIndex);
    }

    // =========================
    // Execute Transaction
    // =========================

    function executeTransaction(
        uint256 txIndex
    )
        external
        onlyOwner
        nonReentrant
        transactionExists(txIndex)
        notExecuted(txIndex)
    {
        require(
            getConfirmationCount(txIndex) >= required,
            "Not enough confirmations"
        );

        Transaction storage transaction = transactions[txIndex];

        transaction.executed = true;

        (bool success, ) = transaction.to.call{value: transaction.value}(
            transaction.data
        );

        require(success, "Transaction failed");

        emit ExecuteTransaction(msg.sender, txIndex);
    }

    // =========================
    // Count Confirmations
    // =========================

    function getConfirmationCount(
        uint256 txIndex
    ) public view transactionExists(txIndex) returns (uint256 count) {
        for (uint256 i = 0; i < owners.length; i++) {
            if (confirmations[txIndex][owners[i]]) {
                count++;
            }
        }
    }

    // =========================
    // Get Transaction
    // =========================

    function getTransaction(
        uint256 txIndex
    )
        external
        view
        transactionExists(txIndex)
        returns (address to, uint256 value, bytes memory data, bool executed)
    {
        Transaction storage transaction = transactions[txIndex];

        return (
            transaction.to,
            transaction.value,
            transaction.data,
            transaction.executed
        );
    }

    // =========================
    // Get Transaction Count
    // =========================

    function getTransactionCount() external view returns (uint256) {
        return transactions.length;
    }

    // =========================
    // Wallet Balance
    // =========================

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
