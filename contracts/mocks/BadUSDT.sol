// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// ERC20 6-decimals that fails on transferFrom to test error path
contract BadUSDT is ERC20 {
    constructor() ERC20("BadUSDT", "BUSDT") {
        _mint(msg.sender, 1_000_000_000 * 10 ** uint256(decimals()));
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function transferFrom(address, address, uint256) public override returns (bool) {
        return false;
    }
}