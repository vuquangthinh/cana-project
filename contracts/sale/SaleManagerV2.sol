// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {SaleManager} from "../SaleManager.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract SaleManagerV2 is SaleManager {
    function version() external pure returns (uint256) {
        return 2;
    }

    // Optional reinitializer to satisfy upgrades plugin validation
    /// @custom:oz-upgrades-validate-as-initializer
    function initializeV2(address newOwner) external reinitializer(2) {
        __Ownable_init(newOwner);
    }
}