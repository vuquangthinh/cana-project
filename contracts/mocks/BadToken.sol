// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

// ERC20 that fails on transfer to test error path
contract BadToken is ERC20, Ownable {
    constructor() ERC20("BadToken", "BTKN") Ownable(msg.sender) {}

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function transfer(address, uint256) public override returns (bool) {
        return false;
    }
}