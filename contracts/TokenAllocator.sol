// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract TokenAllocator is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    enum Category { Ecosystem, Community, Team, Reserve, Partnership }

    IERC20 public token;
    mapping(uint8 => address) public categoryWallet;
    mapping(uint8 => uint256) public categoryAllocation; // amount currently held for category

    event CategoryConfigured(uint8 indexed category, address wallet, uint256 allocation);
    event Unlocked(uint8 indexed category, address to, uint256 amount);

    function initialize(address token_) external initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        token = IERC20(token_);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    function setCategory(uint8 category, address wallet, uint256 allocation) external onlyOwner {
        categoryWallet[category] = wallet;
        categoryAllocation[category] = allocation;
        emit CategoryConfigured(category, wallet, allocation);
    }

    function unlock(uint8 category) external onlyOwner {
        address to = categoryWallet[category];
        uint256 amount = categoryAllocation[category];
        require(to != address(0), "No wallet");
        require(amount > 0, "No allocation");
        categoryAllocation[category] = 0;
        require(token.transfer(to, amount), "Token transfer failed");
        emit Unlocked(category, to, amount);
    }
}