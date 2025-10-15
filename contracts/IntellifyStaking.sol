// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "./IntellifyINFT.sol";
import "./IntellifyToken.sol";

/**
 * @title IntellifyStaking
 * @dev Staking contract for INFT holders to earn INTL token rewards
 */
contract IntellifyStaking is Ownable, ReentrancyGuard, Pausable {
    using Math for uint256;
    
    IntellifyINFT public immutable inftContract;
    IntellifyToken public immutable tokenContract;
    
    // Staking parameters
    uint256 public constant REWARD_RATE_BASE = 100; // Base 1% daily reward rate
    uint256 public constant REWARD_RATE_DENOMINATOR = 10000;
    uint256 public constant SECONDS_PER_DAY = 86400;
    uint256 public constant MIN_STAKE_DURATION = 1 days;
    uint256 public constant MAX_MULTIPLIER = 300; // 3x max multiplier
    
    // Delegation parameters
    uint256 public constant DELEGATION_FEE = 500; // 5% delegation fee
    uint256 public constant FEE_DENOMINATOR = 10000;
    uint256 public constant MIN_DELEGATION_AMOUNT = 1;
    
    struct StakeInfo {
        uint256[] tokenIds;
        uint256 stakedAt;
        uint256 lastClaimAt;
        uint256 totalRewardsClaimed;
        bool isActive;
    }
    
    struct DelegationInfo {
        address delegator;
        address validator;
        uint256[] tokenIds;
        uint256 delegatedAt;
        uint256 lastRewardAt;
        uint256 totalRewards;
        bool isActive;
    }
    
    struct ValidatorInfo {
        address validator;
        uint256 totalDelegated;
        uint256 commissionRate; // In basis points (100 = 1%)
        uint256 totalRewardsDistributed;
        bool isActive;
        string name;
        string description;
    }
    
    struct RewardMultiplier {
        uint256 interactionMultiplier;
        uint256 knowledgeMultiplier;
        uint256 timeMultiplier;
        uint256 totalMultiplier;
    }
    
    // State variables
    mapping(address => StakeInfo) public stakes;
    mapping(uint256 => address) public tokenStaker; // tokenId => staker
    mapping(address => bool) public isStaking;
    
    // Delegation mappings
    mapping(address => DelegationInfo[]) public userDelegations;
    mapping(address => ValidatorInfo) public validators;
    mapping(address => uint256) public validatorDelegatedAmount;
    mapping(uint256 => address) public delegatedTokens; // tokenId => delegator
    
    // Reward tracking
    mapping(address => uint256) public totalRewardsEarned;
    mapping(address => uint256) public lastRewardCalculation;
    
    // Global stats
    uint256 public totalStaked;
    uint256 public totalDelegated;
    uint256 public totalRewardsDistributed;
    address[] public validatorList;
    
    // Events
    event Staked(address indexed user, uint256[] tokenIds, uint256 timestamp);
    event Unstaked(address indexed user, uint256[] tokenIds, uint256 timestamp);
    event RewardsClaimed(address indexed user, uint256 amount, uint256 timestamp);
    event Delegated(address indexed delegator, address indexed validator, uint256[] tokenIds, uint256 timestamp);
    event Undelegated(address indexed delegator, address indexed validator, uint256[] tokenIds, uint256 timestamp);
    event ValidatorRegistered(address indexed validator, string name, uint256 commissionRate);
    event ValidatorUpdated(address indexed validator, uint256 newCommissionRate);
    event DelegationRewardsDistributed(address indexed validator, uint256 totalAmount, uint256 validatorFee);
    
    constructor(address _inftContract, address _tokenContract) Ownable(msg.sender) {
        require(_inftContract != address(0), "Invalid INFT contract");
        require(_tokenContract != address(0), "Invalid token contract");
        
        inftContract = IntellifyINFT(_inftContract);
        tokenContract = IntellifyToken(_tokenContract);
    }
    
    /**
     * @dev Stake INFTs to earn rewards
     */
    function stake(uint256[] memory tokenIds) external nonReentrant whenNotPaused {
        require(tokenIds.length > 0, "No tokens to stake");
        require(!isStaking[msg.sender], "Already staking");
        
        // Verify ownership and transfer tokens
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(inftContract.ownerOf(tokenIds[i]) == msg.sender, "Not token owner");
            require(tokenStaker[tokenIds[i]] == address(0), "Token already staked");
            require(delegatedTokens[tokenIds[i]] == address(0), "Token is delegated");
            
            inftContract.transferFrom(msg.sender, address(this), tokenIds[i]);
            tokenStaker[tokenIds[i]] = msg.sender;
        }
        
        // Create stake info
        stakes[msg.sender] = StakeInfo({
            tokenIds: tokenIds,
            stakedAt: block.timestamp,
            lastClaimAt: block.timestamp,
            totalRewardsClaimed: 0,
            isActive: true
        });
        
        isStaking[msg.sender] = true;
        totalStaked += tokenIds.length;
        lastRewardCalculation[msg.sender] = block.timestamp;
        
        emit Staked(msg.sender, tokenIds, block.timestamp);
    }
    
    /**
     * @dev Unstake INFTs and claim pending rewards
     */
    function unstake() external nonReentrant {
        require(isStaking[msg.sender], "Not staking");
        
        StakeInfo storage stakeInfo = stakes[msg.sender];
        require(stakeInfo.isActive, "Stake not active");
        require(
            block.timestamp >= stakeInfo.stakedAt + MIN_STAKE_DURATION,
            "Minimum stake duration not met"
        );
        
        // Claim pending rewards first
        _claimRewards(msg.sender);
        
        // Return tokens
        uint256[] memory tokenIds = stakeInfo.tokenIds;
        for (uint256 i = 0; i < tokenIds.length; i++) {
            inftContract.transferFrom(address(this), msg.sender, tokenIds[i]);
            delete tokenStaker[tokenIds[i]];
        }
        
        // Update state
        totalStaked -= tokenIds.length;
        stakeInfo.isActive = false;
        isStaking[msg.sender] = false;
        
        emit Unstaked(msg.sender, tokenIds, block.timestamp);
    }
    
    /**
     * @dev Claim staking rewards
     */
    function claimRewards() external nonReentrant {
        require(isStaking[msg.sender], "Not staking");
        _claimRewards(msg.sender);
    }
    
    /**
     * @dev Internal function to claim rewards
     */
    function _claimRewards(address user) internal {
        uint256 rewards = calculatePendingRewards(user);
        if (rewards > 0) {
            stakes[user].lastClaimAt = block.timestamp;
            stakes[user].totalRewardsClaimed += rewards;
            totalRewardsEarned[user] += rewards;
            totalRewardsDistributed += rewards;
            lastRewardCalculation[user] = block.timestamp;
            
            tokenContract.distributeStakingRewards(user, rewards);
            emit RewardsClaimed(user, rewards, block.timestamp);
        }
    }
    
    /**
     * @dev Calculate pending rewards for a user
     */
    function calculatePendingRewards(address user) public view returns (uint256) {
        if (!isStaking[user] || !stakes[user].isActive) {
            return 0;
        }
        
        StakeInfo memory stakeInfo = stakes[user];
        uint256 timeStaked = block.timestamp - stakeInfo.lastClaimAt;
        
        if (timeStaked == 0) {
            return 0;
        }
        
        uint256 totalRewards = 0;
        
        for (uint256 i = 0; i < stakeInfo.tokenIds.length; i++) {
            uint256 tokenId = stakeInfo.tokenIds[i];
            RewardMultiplier memory multiplier = calculateRewardMultiplier(tokenId, timeStaked);
            
            // Base reward calculation
            uint256 baseReward = (REWARD_RATE_BASE * timeStaked) / (REWARD_RATE_DENOMINATOR * SECONDS_PER_DAY);
            
            // Apply multipliers
            uint256 tokenReward = (baseReward * multiplier.totalMultiplier) / 100;
            totalRewards += tokenReward;
        }
        
        return totalRewards * 10**18; // Convert to token decimals
    }
    
    /**
     * @dev Calculate reward multiplier for a token
     */
    function calculateRewardMultiplier(uint256 tokenId, uint256 timeStaked) public view returns (RewardMultiplier memory) {
        IntellifyINFT.AIState memory aiState = inftContract.getAIState(tokenId);
        
        // Interaction multiplier (up to 50% bonus)
        uint256 interactionMultiplier = 100;
        if (aiState.interactionCount > 0) {
            uint256 interactionBonus = Math.min(aiState.interactionCount / 20, 50); // 2.5% per 20 interactions, max 50%
            interactionMultiplier += interactionBonus;
        }
        
        // Knowledge diversity multiplier (up to 100% bonus)
        uint256 knowledgeMultiplier = 100;
        uint256 knowledgeCount = aiState.knowledgeHashes.length;
        if (knowledgeCount > 1) {
            uint256 knowledgeBonus = Math.min((knowledgeCount - 1) * 20, 100); // 20% per additional knowledge, max 100%
            knowledgeMultiplier += knowledgeBonus;
        }
        
        // Time multiplier (up to 50% bonus for long-term staking)
        uint256 timeMultiplier = 100;
        uint256 daysStaked = timeStaked / SECONDS_PER_DAY;
        if (daysStaked > 7) {
            uint256 timeBonus = Math.min((daysStaked - 7) / 7 * 10, 50); // 10% per week after first week, max 50%
            timeMultiplier += timeBonus;
        }
        
        // Calculate total multiplier (capped at MAX_MULTIPLIER)
        uint256 totalMultiplier = Math.min(
            (interactionMultiplier * knowledgeMultiplier * timeMultiplier) / 10000,
            MAX_MULTIPLIER
        );
        
        return RewardMultiplier({
            interactionMultiplier: interactionMultiplier,
            knowledgeMultiplier: knowledgeMultiplier,
            timeMultiplier: timeMultiplier,
            totalMultiplier: totalMultiplier
        });
    }
    
    // Delegation functions
    
    /**
     * @dev Register as a validator
     */
    function registerValidator(
        string memory name,
        string memory description,
        uint256 commissionRate
    ) external {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(commissionRate <= 2000, "Commission rate too high"); // Max 20%
        require(!validators[msg.sender].isActive, "Already a validator");
        
        validators[msg.sender] = ValidatorInfo({
            validator: msg.sender,
            totalDelegated: 0,
            commissionRate: commissionRate,
            totalRewardsDistributed: 0,
            isActive: true,
            name: name,
            description: description
        });
        
        validatorList.push(msg.sender);
        
        emit ValidatorRegistered(msg.sender, name, commissionRate);
    }
    
    /**
     * @dev Update validator commission rate
     */
    function updateValidatorCommission(uint256 newCommissionRate) external {
        require(validators[msg.sender].isActive, "Not a validator");
        require(newCommissionRate <= 2000, "Commission rate too high");
        
        validators[msg.sender].commissionRate = newCommissionRate;
        
        emit ValidatorUpdated(msg.sender, newCommissionRate);
    }
    
    /**
     * @dev Delegate INFTs to a validator
     */
    function delegate(address validator, uint256[] memory tokenIds) external nonReentrant whenNotPaused {
        require(validators[validator].isActive, "Invalid validator");
        require(tokenIds.length >= MIN_DELEGATION_AMOUNT, "Insufficient delegation amount");
        require(!isStaking[msg.sender], "Cannot delegate while staking");
        
        // Verify ownership and transfer tokens
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(inftContract.ownerOf(tokenIds[i]) == msg.sender, "Not token owner");
            require(delegatedTokens[tokenIds[i]] == address(0), "Token already delegated");
            require(tokenStaker[tokenIds[i]] == address(0), "Token is staked");
            
            inftContract.transferFrom(msg.sender, address(this), tokenIds[i]);
            delegatedTokens[tokenIds[i]] = msg.sender;
        }
        
        // Create delegation info
        userDelegations[msg.sender].push(DelegationInfo({
            delegator: msg.sender,
            validator: validator,
            tokenIds: tokenIds,
            delegatedAt: block.timestamp,
            lastRewardAt: block.timestamp,
            totalRewards: 0,
            isActive: true
        }));
        
        // Update validator stats
        validators[validator].totalDelegated += tokenIds.length;
        validatorDelegatedAmount[validator] += tokenIds.length;
        totalDelegated += tokenIds.length;
        
        emit Delegated(msg.sender, validator, tokenIds, block.timestamp);
    }
    
    /**
     * @dev Undelegate INFTs from a validator
     */
    function undelegate(address validator, uint256 delegationIndex) external nonReentrant {
        require(delegationIndex < userDelegations[msg.sender].length, "Invalid delegation index");
        
        DelegationInfo storage delegation = userDelegations[msg.sender][delegationIndex];
        require(delegation.isActive, "Delegation not active");
        require(delegation.validator == validator, "Validator mismatch");
        require(delegation.delegator == msg.sender, "Not your delegation");
        
        // Return tokens
        uint256[] memory tokenIds = delegation.tokenIds;
        for (uint256 i = 0; i < tokenIds.length; i++) {
            inftContract.transferFrom(address(this), msg.sender, tokenIds[i]);
            delete delegatedTokens[tokenIds[i]];
        }
        
        // Update state
        delegation.isActive = false;
        validators[validator].totalDelegated -= tokenIds.length;
        validatorDelegatedAmount[validator] -= tokenIds.length;
        totalDelegated -= tokenIds.length;
        
        emit Undelegated(msg.sender, validator, tokenIds, block.timestamp);
    }
    
    /**
     * @dev Distribute delegation rewards (called by validators)
     */
    function distributeDelegationRewards(uint256 totalRewardAmount) external nonReentrant {
        require(validators[msg.sender].isActive, "Not a validator");
        require(totalRewardAmount > 0, "No rewards to distribute");
        require(validatorDelegatedAmount[msg.sender] > 0, "No delegations");
        
        uint256 validatorFee = (totalRewardAmount * validators[msg.sender].commissionRate) / FEE_DENOMINATOR;
        uint256 delegatorRewards = totalRewardAmount - validatorFee;
        
        // Transfer validator fee
        if (validatorFee > 0) {
            tokenContract.distributeStakingRewards(msg.sender, validatorFee);
        }
        
        // Distribute rewards to delegators (simplified - in practice would need more complex logic)
        validators[msg.sender].totalRewardsDistributed += totalRewardAmount;
        totalRewardsDistributed += totalRewardAmount;
        
        emit DelegationRewardsDistributed(msg.sender, totalRewardAmount, validatorFee);
    }
    
    // View functions
    
    function getStakeInfo(address user) external view returns (StakeInfo memory) {
        return stakes[user];
    }
    
    function getUserDelegations(address user) external view returns (DelegationInfo[] memory) {
        return userDelegations[user];
    }
    
    function getValidatorInfo(address validator) external view returns (ValidatorInfo memory) {
        return validators[validator];
    }
    
    function getAllValidators() external view returns (address[] memory) {
        return validatorList;
    }
    
    function getStakingStats() external view returns (
        uint256 _totalStaked,
        uint256 _totalDelegated,
        uint256 _totalRewardsDistributed,
        uint256 _activeValidators
    ) {
        uint256 activeValidators = 0;
        for (uint256 i = 0; i < validatorList.length; i++) {
            if (validators[validatorList[i]].isActive) {
                activeValidators++;
            }
        }
        
        return (totalStaked, totalDelegated, totalRewardsDistributed, activeValidators);
    }
    
    function getUserRewardInfo(address user) external view returns (
        uint256 pendingRewards,
        uint256 totalEarned,
        uint256 lastClaim
    ) {
        return (
            calculatePendingRewards(user),
            totalRewardsEarned[user],
            stakes[user].lastClaimAt
        );
    }
    
    // Admin functions
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    function emergencyWithdraw(uint256 tokenId) external onlyOwner {
        address owner = tokenStaker[tokenId];
        if (owner == address(0)) {
            owner = delegatedTokens[tokenId];
        }
        require(owner != address(0), "Token not in contract");
        
        inftContract.transferFrom(address(this), owner, tokenId);
        delete tokenStaker[tokenId];
        delete delegatedTokens[tokenId];
    }
    
    // Required for receiving NFTs
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure returns (bytes4) {
        return this.onERC721Received.selector;
    }
}