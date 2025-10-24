// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";

contract InvestorNFT is Initializable, ERC721Upgradeable, OwnableUpgradeable, UUPSUpgradeable {
    address public saleManager;
    uint256 public nextId;

    mapping(address => uint256) public holderTokenId; // one NFT per holder
    mapping(uint256 => uint256) public totalLocked; // locked tokens associated with NFT

    event SaleManagerSet(address saleManager);
    event LockedIncreased(uint256 tokenId, uint256 amount, uint256 newTotal);

    function initialize(string memory name_, string memory symbol_) external initializer {
        __ERC721_init(name_, symbol_);
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        nextId = 1;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    function setSaleManager(address manager) external onlyOwner {
        saleManager = manager;
        emit SaleManagerSet(manager);
    }

    modifier onlySaleManager() {
        require(msg.sender == saleManager, "Not sale manager");
        _;
    }

    function mintIfNone(address to) external onlySaleManager returns (uint256 tokenId) {
        tokenId = holderTokenId[to];
        if (tokenId == 0) {
            tokenId = nextId++;
            holderTokenId[to] = tokenId;
            _mint(to, tokenId);
        }
    }

    function increaseLocked(uint256 tokenId, uint256 amount) external onlySaleManager {
        totalLocked[tokenId] += amount;
        emit LockedIncreased(tokenId, amount, totalLocked[tokenId]);
    }
}