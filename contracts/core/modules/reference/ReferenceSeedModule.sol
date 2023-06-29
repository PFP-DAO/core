// SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

import {IReferenceModule} from "../../../interfaces/IReferenceModule.sol";
import {ModuleBase} from "../ModuleBase.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @title ReferenceSeedModule contract
 * @dev This contract is used to manage the seeds reward system.
 */
contract ReferenceSeedModule is IReferenceModule, ModuleBase {
    using SafeERC20 for IERC20;

    address public currency;
    uint256 public amount;
    address public relayer;
    address public admin;

    struct SeedReward {
        uint256 sun;
        uint256 rain;
        uint256 soil;
    }

    mapping(uint256 => SeedReward) profileIdToReward;

    /**
     * @notice Emits when a new seed reward is added.
     */
    event AddSeedReward(
        uint256 indexed profileId, uint256 indexed pubId, uint256 sun, uint256 rain, uint256 soil, uint256 timestamp
    );

    /**
     * @notice Emits when claimed seed rewards to recipent.
     */
    event RewardClaimed(address indexed recipent, uint256 indexed profileId, uint256 amount, uint256 blockNumber);

    /**
     * @notice Initializes the contract with the provided parameters.
     * @param hub_ The hub address.
     * @param currency_ The currency address.
     * @param amount_ The amount of currency.
     * @param relayer_ The relayer address.
     * @param admin_ The admin address.
     */
    constructor(address hub_, address currency_, uint256 amount_, address relayer_, address admin_) ModuleBase(hub_) {
        require(currency_ != address(0), "Currency is zero address");
        require(admin_ != address(0), "Admin is zero address");
        require(relayer_ != address(0), "Relayer is zero address");
        require(amount_ > 0, "Amount is zero");
        currency = currency_;
        amount = amount_;
        relayer = relayer_;
        admin = admin_;
    }

    /**
     * @dev Ensures that only the relayer can call the function.
     */
    modifier onlyRelayer() {
        require(msg.sender == relayer, "Caller is not relayer");
        _;
    }

    /**
     * @dev Ensures that only the admin can call the function.
     */
    modifier onlyAdmin() {
        require(msg.sender == admin, "Caller is not admin");
        _;
    }

    /**
     * @notice This is initialization function for the reference module.
     * @dev Any bytes data can pass in, can get from CreateComment event.
     */
    function initializeReferenceModule(uint256 profileId_, uint256 pubId_, bytes calldata data_)
        external
        view
        override
        onlyHub
        returns (bytes memory)
    {
        return data_;
    }

    /**
     * @notice When user creates a comment, they need to pay token to join the reward system.
     * @dev This function is called when a user creates a comment.
     */
    function processComment(uint256 profileId_, uint256 profileIdPointed_, uint256 pubIdPointed_, bytes calldata data_)
        external
        override
        onlyHub
    {
        require(IERC20(currency).transferFrom(tx.origin, address(this), amount), "Seed pay failed");
    }

    /**
     * @dev No operation is performed in this function.
     */
    function processMirror(uint256 profileId_, uint256 profileIdPointed_, uint256 pubIdPointed_, bytes calldata data_)
        external
        view
        override
    {}

    /**
     * @notice Call by automate task relayer to add seed rewards.
     * @param profileIds_ The profile to add seed rewards.
     * @param amounts_ The amounts_ of seed rewards.
     * @param pubIds_ The pubIds_ of seed rewards.
     */
    function addSeedRewards(uint256[] calldata profileIds_, SeedReward[] calldata amounts_, uint256[] calldata pubIds_)
        external
        onlyRelayer
    {
        require(profileIds_.length == amounts_.length && profileIds_.length == pubIds_.length, "length mismatch");
        for (uint256 i = 0; i < profileIds_.length; i++) {
            SeedReward storage reward = profileIdToReward[profileIds_[i]];
            reward.sun += amounts_[i].sun;
            reward.rain += amounts_[i].rain;
            reward.soil += amounts_[i].soil;

            emit AddSeedReward(profileIds_[i], pubIds_[i], reward.sun, reward.rain, reward.soil, block.timestamp);
        }
    }

    /**
     * @notice Call by user to claim seed rewards.
     * @param profileId_ The profile to claim seed rewards.
     * @param amountToClaim_ The amount of seed rewards to claim.
     */
    function claim(uint256 profileId_, uint256 amountToClaim_) external {
        SeedReward storage reward = profileIdToReward[profileId_];

        require(amountToClaim_ <= reward.sun, "No enough sun to claim");
        require(amountToClaim_ <= reward.rain, "No enough rain to claim");
        require(amountToClaim_ <= reward.soil, "No enough soil to claim");

        reward.sun -= amountToClaim_;
        reward.rain -= amountToClaim_;
        reward.soil -= amountToClaim_;

        address to = IERC721(HUB).ownerOf(profileId_);
        IERC20(currency).safeTransfer(to, amountToClaim_);
        emit RewardClaimed(to, profileId_, amountToClaim_, block.number);
    }

    /**
     * @dev Returns the amount of sun, rain, and soil rewards associated with a given address.
     * @param profileId_ The address to query.
     */
    function getReward(uint256 profileId_) external view returns (SeedReward memory) {
        return profileIdToReward[profileId_];
    }

    /**
     * @dev Allows the admin to set the currency for the rewards.
     * @param currency_ The currency address.
     */
    function setCurrency(address currency_) external onlyAdmin {
        require(currency_ != address(0), "Currency is zero address");
        currency = currency_;
    }

    /**
     * @dev Allows the admin to set the amount for rewards.
     * @param amount_ The amount of currency.
     */
    function setAmount(uint256 amount_) external onlyAdmin {
        require(amount_ > 0, "Amount is zero");
        amount = amount_;
    }

    /**
     * @dev Allows the admin to set the relayer address.
     * @param relayer_ The relayer address.
     */
    function setRelayer(address relayer_) external onlyAdmin {
        require(relayer_ != address(0), "Relayer is zero address");
        relayer = relayer_;
    }

    /**
     * @dev Allows the admin to set a new admin address.
     * @param admin_ The new admin address.
     */
    function setAdmin(address admin_) external onlyAdmin {
        require(admin_ != address(0), "Admin is zero address");
        admin = admin_;
    }

    /**
     * @dev Allows the admin to withdraw all of the specified ERC20 tokens from the contract.
     * @param token_ The token address.
     */
    function withdrawERC20(address token_) external onlyAdmin {
        IERC20(token_).safeTransfer(msg.sender, IERC20(token_).balanceOf(address(this)));
    }

    /**
     * @dev Allows the admin to withdraw all Ether from the contract.
     */
    function withdraw() external onlyAdmin {
        payable(msg.sender).transfer(address(this).balance);
    }
}
