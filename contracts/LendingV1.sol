//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract LendingV1 is Initializable, OwnableUpgradeable {

mapping(address => uint256) public deposits;
    mapping(address => uint256) public debts;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address initialOwner) public initializer {
        __Ownable_init(initialOwner);
    }

    function deposit() external payable {
        require(msg.value > 0, "Send some ETH");
        deposits[msg.sender] += msg.value;
    }

    function borrow(uint256 amount) external {
        require(amount > 0, "Amount must be above zero");
        require(debts[msg.sender] + amount <= deposits[msg.sender] / 2, "Over 50% limit");
        require(address(this).balance >= amount, "Not enough funds");
        debts[msg.sender] += amount;
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "Transfer failed");
    }

    function repay() external payable {
        require(msg.value > 0, "Send some ETH");
        require(msg.value <= debts[msg.sender], "More than you owe");
        debts[msg.sender] -= msg.value;
    }

    function withdraw(uint256 amount) external {
        require(deposits[msg.sender] >= amount, "Not enough deposited");
        require(deposits[msg.sender] - amount >= debts[msg.sender] * 2, "Debt needs this collateral");
        deposits[msg.sender] -= amount;
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "Transfer failed");
    }
}