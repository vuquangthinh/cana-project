// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {InvestorNFT} from "./InvestorNFT.sol";

contract SaleManager is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    struct Round {
        uint256 priceUSDT6PerToken; // USDT (6 decimals) per 1 token (18 decimals)
        uint256 tokenAmount;        // tokens in 18 decimals
        uint256 sold;               // tokens sold in this round
    }

    struct Epoch {
        uint64 startTime; // epoch start
        uint16 bps;       // percentage in basis points
    }

    IERC20 public usdt; // 6 decimals
    IERC20 public token; // CANA token (18 decimals)
    InvestorNFT public nft;
    address public treasury;

    Round[] public rounds;
    Epoch[] public epochs;

    bool public saleOpened; // when true, rounds/epochs cannot be modified
    uint256 public totalSaleSupply; // optional cap for total sale supply

    mapping(uint256 => uint256) public claimedByTokenId; // amount already claimed per NFT

    event ConfigSet(address usdt, address token, address nft, address treasury);
    event RoundsConfigured(uint256 roundCount, uint256 totalTokens);
    event EpochsConfigured(uint256 epochCount);
    event SaleOpened();
    event Purchased(address indexed buyer, uint256 usdtPaid, uint256 tokenAmount, uint256 roundIndex, uint256 tokenId);
    event Claimed(address indexed claimer, uint256 tokenId, uint256 amount);

    function initialize(address usdt_, address token_, address nft_, address treasury_) external initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        usdt = IERC20(usdt_);
        token = IERC20(token_);
        nft = InvestorNFT(nft_);
        treasury = treasury_;
        emit ConfigSet(usdt_, token_, nft_, treasury_);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // Admin configuration before opening sale
    function configureRounds(uint256[] memory pricesUSDT6, uint256[] memory tokenAmounts, uint256 saleSupply) external onlyOwner {
        require(!saleOpened, "Sale already opened");
        require(pricesUSDT6.length == tokenAmounts.length && pricesUSDT6.length > 0, "Invalid input");
        delete rounds;
        uint256 total;
        for (uint256 i = 0; i < pricesUSDT6.length; i++) {
            rounds.push(Round({priceUSDT6PerToken: pricesUSDT6[i], tokenAmount: tokenAmounts[i], sold: 0}));
            total += tokenAmounts[i];
        }
        totalSaleSupply = saleSupply;
        require(total <= saleSupply, "Rounds exceed sale supply");
        emit RoundsConfigured(pricesUSDT6.length, total);
    }

    function configureClaimSchedule(Epoch[] memory newEpochs) external onlyOwner {
        require(!saleOpened, "Sale already opened");
        require(newEpochs.length > 0, "No epochs");
        delete epochs;
        uint256 totalBps;
        for (uint256 i = 0; i < newEpochs.length; i++) {
            epochs.push(newEpochs[i]);
            totalBps += newEpochs[i].bps;
        }
        require(totalBps == 10000, "Epochs must sum to 100% (10000 bps)");
        emit EpochsConfigured(newEpochs.length);
    }

    function openSale() external onlyOwner {
        require(!saleOpened, "Sale already opened");
        require(rounds.length > 0 && epochs.length > 0, "Rounds/epochs not set");
        saleOpened = true;
        emit SaleOpened();
    }

    function currentRoundIndex() public view returns (uint256) {
        for (uint256 i = 0; i < rounds.length; i++) {
            if (rounds[i].sold < rounds[i].tokenAmount) return i;
        }
        revert("All rounds sold out");
    }

    function buy(uint256 usdtAmount) external {
        require(saleOpened, "Sale not opened");
        uint256 idx = currentRoundIndex();
        Round storage r = rounds[idx];
        require(usdtAmount > 0, "Zero usdt");
        // tokens (18d) = usdtAmount (6d) * 1e18 / priceUSDT6
        uint256 tokensToBuy = (usdtAmount * 1e18) / r.priceUSDT6PerToken;
        require(tokensToBuy > 0, "Too little USDT");
        require(r.sold + tokensToBuy <= r.tokenAmount, "Round sold out");

        // pull USDT to treasury
        require(usdt.transferFrom(msg.sender, treasury, usdtAmount), "USDT transfer failed");

        // mint NFT if needed and record lock
        uint256 tokenId = nft.mintIfNone(msg.sender);
        nft.increaseLocked(tokenId, tokensToBuy);

        r.sold += tokensToBuy;
        emit Purchased(msg.sender, usdtAmount, tokensToBuy, idx, tokenId);
    }

    function totalEligibleBps() public view returns (uint256 bps) {
        for (uint256 i = 0; i < epochs.length; i++) {
            if (block.timestamp >= epochs[i].startTime) {
                bps += epochs[i].bps;
            }
        }
    }

    function claim(uint256 tokenId) external {
        require(saleOpened, "Sale not opened");
        require(nft.ownerOf(tokenId) == msg.sender, "Not owner");
        uint256 locked = nft.totalLocked(tokenId);
        require(locked > 0, "No locked");
        uint256 eligibleBps = totalEligibleBps();
        uint256 entitled = (locked * eligibleBps) / 10000;
        uint256 claimed = claimedByTokenId[tokenId];
        require(entitled > claimed, "Nothing to claim");
        uint256 amount = entitled - claimed;
        claimedByTokenId[tokenId] = entitled; // track in bps-applied amount
        require(token.transfer(msg.sender, amount), "Token transfer failed");
        emit Claimed(msg.sender, tokenId, amount);
    }
}