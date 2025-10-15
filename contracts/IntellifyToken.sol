// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title IntellifyToken
 * @dev Utility token for the Intellify ecosystem with governance and staking features
 */
contract IntellifyToken is ERC20, ERC20Burnable, ERC20Permit, Ownable, ReentrancyGuard, Pausable {
    
    // Token economics
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 1 billion tokens
    uint256 public constant INITIAL_SUPPLY = 100_000_000 * 10**18; // 100 million tokens
    
    // Minting limits
    uint256 public constant ANNUAL_INFLATION_RATE = 5; // 5% per year
    uint256 public constant INFLATION_DENOMINATOR = 100;
    uint256 public lastInflationTimestamp;
    uint256 public inflationAllowance;
    
    // Roles
    mapping(address => bool) public minters;
    mapping(address => bool) public burners;
    
    // Staking rewards pool
    uint256 public stakingRewardsPool;
    uint256 public constant STAKING_REWARDS_ALLOCATION = 30; // 30% of inflation
    
    // Governance rewards pool
    uint256 public governanceRewardsPool;
    uint256 public constant GOVERNANCE_REWARDS_ALLOCATION = 10; // 10% of inflation
    
    // Development fund
    uint256 public developmentFund;
    uint256 public constant DEVELOPMENT_FUND_ALLOCATION = 20; // 20% of inflation
    
    // Community treasury
    uint256 public communityTreasury;
    uint256 public constant COMMUNITY_TREASURY_ALLOCATION = 40; // 40% of inflation
    
    // Events
    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);
    event BurnerAdded(address indexed burner);
    event BurnerRemoved(address indexed burner);
    event InflationMinted(uint256 amount, uint256 timestamp);
    event StakingRewardsAllocated(uint256 amount);
    event GovernanceRewardsAllocated(uint256 amount);
    event DevelopmentFundAllocated(uint256 amount);
    event CommunityTreasuryAllocated(uint256 amount);
    event RewardsDistributed(address indexed recipient, uint256 amount, string rewardType);
    
    modifier onlyMinter() {
        require(minters[msg.sender] || msg.sender == owner(), "Not authorized to mint");
        _;
    }
    
    modifier onlyBurner() {
        require(burners[msg.sender] || msg.sender == owner(), "Not authorized to burn");
        _;
    }
    
    constructor() 
        ERC20("Intellify Token", "INTL") 
        ERC20Permit("Intellify Token")
        Ownable(msg.sender) 
    {
        _mint(msg.sender, INITIAL_SUPPLY);
        lastInflationTimestamp = block.timestamp;
        
        // Calculate initial inflation allowance
        _updateInflationAllowance();
    }
    
    /**
     * @dev Mint new tokens (only by authorized minters)
     */
    function mint(address to, uint256 amount) public onlyMinter whenNotPaused {
        require(to != address(0), "Cannot mint to zero address");
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        
        _mint(to, amount);
    }
    
    /**
     * @dev Mint inflation tokens and distribute to pools
     */
    function mintInflation() public onlyOwner whenNotPaused {
        _updateInflationAllowance();
        require(inflationAllowance > 0, "No inflation allowance available");
        
        uint256 inflationAmount = inflationAllowance;
        inflationAllowance = 0;
        
        require(totalSupply() + inflationAmount <= MAX_SUPPLY, "Exceeds max supply");
        
        // Distribute inflation to different pools
        uint256 stakingAmount = (inflationAmount * STAKING_REWARDS_ALLOCATION) / 100;
        uint256 governanceAmount = (inflationAmount * GOVERNANCE_REWARDS_ALLOCATION) / 100;
        uint256 developmentAmount = (inflationAmount * DEVELOPMENT_FUND_ALLOCATION) / 100;
        uint256 communityAmount = (inflationAmount * COMMUNITY_TREASURY_ALLOCATION) / 100;
        
        // Mint to contract for pool management
        _mint(address(this), inflationAmount);
        
        // Update pool balances
        stakingRewardsPool += stakingAmount;
        governanceRewardsPool += governanceAmount;
        developmentFund += developmentAmount;
        communityTreasury += communityAmount;
        
        lastInflationTimestamp = block.timestamp;
        
        emit InflationMinted(inflationAmount, block.timestamp);
        emit StakingRewardsAllocated(stakingAmount);
        emit GovernanceRewardsAllocated(governanceAmount);
        emit DevelopmentFundAllocated(developmentAmount);
        emit CommunityTreasuryAllocated(communityAmount);
    }
    
    /**
     * @dev Distribute staking rewards
     */
    function distributeStakingRewards(address recipient, uint256 amount) external onlyMinter {
        require(recipient != address(0), "Invalid recipient");
        require(amount <= stakingRewardsPool, "Insufficient staking rewards");
        
        stakingRewardsPool -= amount;
        _transfer(address(this), recipient, amount);
        
        emit RewardsDistributed(recipient, amount, "staking");
    }
    
    /**
     * @dev Distribute governance rewards
     */
    function distributeGovernanceRewards(address recipient, uint256 amount) external onlyMinter {
        require(recipient != address(0), "Invalid recipient");
        require(amount <= governanceRewardsPool, "Insufficient governance rewards");
        
        governanceRewardsPool -= amount;
        _transfer(address(this), recipient, amount);
        
        emit RewardsDistributed(recipient, amount, "governance");
    }
    
    /**
     * @dev Withdraw from development fund
     */
    function withdrawDevelopmentFund(address recipient, uint256 amount) external onlyOwner {
        require(recipient != address(0), "Invalid recipient");
        require(amount <= developmentFund, "Insufficient development fund");
        
        developmentFund -= amount;
        _transfer(address(this), recipient, amount);
        
        emit RewardsDistributed(recipient, amount, "development");
    }
    
    /**
     * @dev Withdraw from community treasury
     */
    function withdrawCommunityTreasury(address recipient, uint256 amount) external onlyOwner {
        require(recipient != address(0), "Invalid recipient");
        require(amount <= communityTreasury, "Insufficient community treasury");
        
        communityTreasury -= amount;
        _transfer(address(this), recipient, amount);
        
        emit RewardsDistributed(recipient, amount, "community");
    }
    
    /**
     * @dev Burn tokens from specific pools
     */
    function burnFromPool(uint256 amount, string memory poolType) external onlyOwner {
        bytes32 poolHash = keccak256(abi.encodePacked(poolType));
        
        if (poolHash == keccak256(abi.encodePacked("staking"))) {
            require(amount <= stakingRewardsPool, "Insufficient staking pool");
            stakingRewardsPool -= amount;
        } else if (poolHash == keccak256(abi.encodePacked("governance"))) {
            require(amount <= governanceRewardsPool, "Insufficient governance pool");
            governanceRewardsPool -= amount;
        } else if (poolHash == keccak256(abi.encodePacked("development"))) {
            require(amount <= developmentFund, "Insufficient development fund");
            developmentFund -= amount;
        } else if (poolHash == keccak256(abi.encodePacked("community"))) {
            require(amount <= communityTreasury, "Insufficient community treasury");
            communityTreasury -= amount;
        } else {
            revert("Invalid pool type");
        }
        
        _burn(address(this), amount);
    }
    
    /**
     * @dev Update inflation allowance based on time passed
     */
    function _updateInflationAllowance() internal {
        uint256 timeElapsed = block.timestamp - lastInflationTimestamp;
        uint256 yearlyInflation = (totalSupply() * ANNUAL_INFLATION_RATE) / INFLATION_DENOMINATOR;
        
        // Calculate pro-rata inflation based on time elapsed
        uint256 newAllowance = (yearlyInflation * timeElapsed) / 365 days;
        inflationAllowance += newAllowance;
    }
    
    /**
     * @dev Get current inflation allowance
     */
    function getCurrentInflationAllowance() public view returns (uint256) {
        uint256 timeElapsed = block.timestamp - lastInflationTimestamp;
        uint256 yearlyInflation = (totalSupply() * ANNUAL_INFLATION_RATE) / INFLATION_DENOMINATOR;
        uint256 newAllowance = (yearlyInflation * timeElapsed) / 365 days;
        
        return inflationAllowance + newAllowance;
    }
    
    /**
     * @dev Get total pool balances
     */
    function getTotalPoolBalances() public view returns (uint256) {
        return stakingRewardsPool + governanceRewardsPool + developmentFund + communityTreasury;
    }
    
    /**
     * @dev Get pool information
     */
    function getPoolInfo() public view returns (
        uint256 staking,
        uint256 governance,
        uint256 development,
        uint256 community,
        uint256 total
    ) {
        return (
            stakingRewardsPool,
            governanceRewardsPool,
            developmentFund,
            communityTreasury,
            getTotalPoolBalances()
        );
    }
    
    // Role management functions
    
    function addMinter(address minter) external onlyOwner {
        require(minter != address(0), "Invalid minter address");
        require(!minters[minter], "Already a minter");
        
        minters[minter] = true;
        emit MinterAdded(minter);
    }
    
    function removeMinter(address minter) external onlyOwner {
        require(minters[minter], "Not a minter");
        
        minters[minter] = false;
        emit MinterRemoved(minter);
    }
    
    function addBurner(address burner) external onlyOwner {
        require(burner != address(0), "Invalid burner address");
        require(!burners[burner], "Already a burner");
        
        burners[burner] = true;
        emit BurnerAdded(burner);
    }
    
    function removeBurner(address burner) external onlyOwner {
        require(burners[burner], "Not a burner");
        
        burners[burner] = false;
        emit BurnerRemoved(burner);
    }
    
    // Emergency functions
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // Override transfer functions to respect pause
    
    function _update(address from, address to, uint256 value) internal override whenNotPaused {
        super._update(from, to, value);
    }
    
    // Batch operations for gas efficiency
    
    function batchTransfer(address[] memory recipients, uint256[] memory amounts) external {
        require(recipients.length == amounts.length, "Arrays length mismatch");
        require(recipients.length > 0, "Empty arrays");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            transfer(recipients[i], amounts[i]);
        }
    }
    
    function batchMint(address[] memory recipients, uint256[] memory amounts) external onlyMinter {
        require(recipients.length == amounts.length, "Arrays length mismatch");
        require(recipients.length > 0, "Empty arrays");
        
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }
        
        require(totalSupply() + totalAmount <= MAX_SUPPLY, "Exceeds max supply");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            _mint(recipients[i], amounts[i]);
        }
    }
    
    // View functions
    
    function isMinter(address account) external view returns (bool) {
        return minters[account];
    }
    
    function isBurner(address account) external view returns (bool) {
        return burners[account];
    }
    
    function getCirculatingSupply() external view returns (uint256) {
        return totalSupply() - getTotalPoolBalances();
    }
    
    function getInflationRate() external pure returns (uint256) {
        return ANNUAL_INFLATION_RATE;
    }
    
    function getMaxSupply() external pure returns (uint256) {
        return MAX_SUPPLY;
    }
}