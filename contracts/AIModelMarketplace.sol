// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title AIModelMarketplace
 * @dev Decentralized marketplace for AI models on 0G Network
 */
contract AIModelMarketplace is Ownable, ReentrancyGuard, Pausable {
    // Events
    event ModelRegistered(uint256 indexed modelId, address indexed creator, string name);
    event ModelPurchased(uint256 indexed modelId, address indexed buyer, uint256 amount);
    event ModelUpdated(uint256 indexed modelId, string newModelHash);
    event RevenueWithdrawn(address indexed creator, uint256 amount);
    event ModelRated(uint256 indexed modelId, address indexed rater, uint8 rating);

    // Structs
    struct AIModel {
        uint256 modelId;
        address creator;
        string name;
        string description;
        string category;
        string modelHash; // IPFS hash of the model
        string metadataHash; // IPFS hash of metadata
        uint256 pricePerInference;
        uint256 totalInferences;
        uint256 totalRevenue;
        uint256 rating; // Average rating * 100 (to handle decimals)
        uint256 ratingCount;
        bool isActive;
        bool isVerified;
        uint256 createdAt;
        uint256 updatedAt;
    }

    struct ModelAccess {
        bool hasAccess;
        uint256 purchasedAt;
        uint256 inferencesUsed;
        uint256 inferencesAllowed;
    }

    struct CreatorStats {
        uint256 totalModels;
        uint256 totalRevenue;
        uint256 totalInferences;
        uint256 averageRating;
        bool isVerified;
    }

    // State variables
    uint256 private _modelIdCounter;
    uint256 public platformFeePercentage = 250; // 2.5%
    uint256 public constant MAX_PLATFORM_FEE = 1000; // 10%
    
    mapping(uint256 => AIModel) public models;
    mapping(address => uint256[]) public creatorModels;
    mapping(uint256 => mapping(address => ModelAccess)) public modelAccess;
    mapping(address => CreatorStats) public creatorStats;
    mapping(uint256 => mapping(address => uint8)) public userRatings;
    mapping(string => bool) public categoryExists;
    
    string[] public categories;
    address[] public verifiedCreators;

    // Modifiers
    modifier onlyModelCreator(uint256 modelId) {
        require(models[modelId].creator == msg.sender, "Not model creator");
        _;
    }

    modifier modelExists(uint256 modelId) {
        require(models[modelId].creator != address(0), "Model does not exist");
        _;
    }

    modifier validRating(uint8 rating) {
        require(rating >= 1 && rating <= 5, "Rating must be between 1 and 5");
        _;
    }

    constructor() Ownable(msg.sender) {
        // Initialize default categories
        _addCategory("Language Models");
        _addCategory("Computer Vision");
        _addCategory("Audio Processing");
        _addCategory("Recommendation Systems");
        _addCategory("Predictive Analytics");
    }

    /**
     * @dev Register a new AI model in the marketplace
     */
    function registerModel(
        string memory name,
        string memory description,
        string memory category,
        string memory modelHash,
        string memory metadataHash,
        uint256 pricePerInference
    ) external whenNotPaused returns (uint256) {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(modelHash).length > 0, "Model hash cannot be empty");
        require(pricePerInference > 0, "Price must be greater than 0");
        require(categoryExists[category], "Invalid category");

        _modelIdCounter++;
        uint256 modelId = _modelIdCounter;

        models[modelId] = AIModel({
            modelId: modelId,
            creator: msg.sender,
            name: name,
            description: description,
            category: category,
            modelHash: modelHash,
            metadataHash: metadataHash,
            pricePerInference: pricePerInference,
            totalInferences: 0,
            totalRevenue: 0,
            rating: 0,
            ratingCount: 0,
            isActive: true,
            isVerified: false,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });

        creatorModels[msg.sender].push(modelId);
        creatorStats[msg.sender].totalModels++;

        emit ModelRegistered(modelId, msg.sender, name);
        return modelId;
    }

    /**
     * @dev Purchase access to a model
     */
    function purchaseModelAccess(
        uint256 modelId,
        uint256 inferencesAllowed
    ) external payable modelExists(modelId) nonReentrant whenNotPaused {
        AIModel storage model = models[modelId];
        require(model.isActive, "Model is not active");
        require(inferencesAllowed > 0, "Must purchase at least 1 inference");

        uint256 totalCost = model.pricePerInference * inferencesAllowed;
        require(msg.value >= totalCost, "Insufficient payment");

        // Calculate platform fee
        uint256 platformFee = (totalCost * platformFeePercentage) / 10000;
        uint256 creatorRevenue = totalCost - platformFee;

        // Update model stats
        model.totalInferences = model.totalInferences + inferencesAllowed;
        model.totalRevenue = model.totalRevenue + creatorRevenue;

        // Update creator stats
        creatorStats[model.creator].totalRevenue = creatorStats[model.creator].totalRevenue + creatorRevenue;
        creatorStats[model.creator].totalInferences = creatorStats[model.creator].totalInferences + inferencesAllowed;

        // Grant access to buyer
        ModelAccess storage access = modelAccess[modelId][msg.sender];
        access.hasAccess = true;
        access.purchasedAt = block.timestamp;
        access.inferencesAllowed = access.inferencesAllowed + inferencesAllowed;

        // Transfer payment to creator
        payable(model.creator).transfer(creatorRevenue);

        // Refund excess payment
        if (msg.value > totalCost) {
            payable(msg.sender).transfer(msg.value - totalCost);
        }

        emit ModelPurchased(modelId, msg.sender, totalCost);
    }

    /**
     * @dev Use an inference (called by authorized inference service)
     */
    function useInference(uint256 modelId, address user) external onlyOwner modelExists(modelId) {
        ModelAccess storage access = modelAccess[modelId][user];
        require(access.hasAccess, "User does not have access");
        require(access.inferencesUsed < access.inferencesAllowed, "No inferences remaining");

        access.inferencesUsed++;
    }

    /**
     * @dev Rate a model
     */
    function rateModel(uint256 modelId, uint8 rating) 
        external 
        modelExists(modelId) 
        validRating(rating) 
        whenNotPaused 
    {
        require(modelAccess[modelId][msg.sender].hasAccess, "Must have access to rate");
        require(userRatings[modelId][msg.sender] == 0, "Already rated this model");

        AIModel storage model = models[modelId];
        userRatings[modelId][msg.sender] = rating;

        // Update average rating
        uint256 totalRating = (model.rating * model.ratingCount) + (uint256(rating) * 100);
        model.ratingCount++;
        model.rating = totalRating / model.ratingCount;

        // Update creator average rating
        _updateCreatorRating(model.creator);

        emit ModelRated(modelId, msg.sender, rating);
    }

    /**
     * @dev Update model metadata
     */
    function updateModel(
        uint256 modelId,
        string memory newModelHash,
        string memory newMetadataHash,
        uint256 newPrice
    ) external onlyModelCreator(modelId) whenNotPaused {
        AIModel storage model = models[modelId];
        
        if (bytes(newModelHash).length > 0) {
            model.modelHash = newModelHash;
        }
        if (bytes(newMetadataHash).length > 0) {
            model.metadataHash = newMetadataHash;
        }
        if (newPrice > 0) {
            model.pricePerInference = newPrice;
        }
        
        model.updatedAt = block.timestamp;
        
        emit ModelUpdated(modelId, newModelHash);
    }

    /**
     * @dev Toggle model active status
     */
    function toggleModelStatus(uint256 modelId) external onlyModelCreator(modelId) {
        models[modelId].isActive = !models[modelId].isActive;
    }

    /**
     * @dev Verify a model (only owner)
     */
    function verifyModel(uint256 modelId) external onlyOwner modelExists(modelId) {
        models[modelId].isVerified = true;
    }

    /**
     * @dev Verify a creator (only owner)
     */
    function verifyCreator(address creator) external onlyOwner {
        if (!creatorStats[creator].isVerified) {
            creatorStats[creator].isVerified = true;
            verifiedCreators.push(creator);
        }
    }

    /**
     * @dev Add a new category
     */
    function addCategory(string memory category) external onlyOwner {
        _addCategory(category);
    }

    /**
     * @dev Set platform fee percentage
     */
    function setPlatformFee(uint256 newFeePercentage) external onlyOwner {
        require(newFeePercentage <= MAX_PLATFORM_FEE, "Fee too high");
        platformFeePercentage = newFeePercentage;
    }

    /**
     * @dev Withdraw platform fees
     */
    function withdrawPlatformFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        payable(owner()).transfer(balance);
    }

    /**
     * @dev Emergency pause
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // View functions
    function getModel(uint256 modelId) external view returns (AIModel memory) {
        return models[modelId];
    }

    function getCreatorModels(address creator) external view returns (uint256[] memory) {
        return creatorModels[creator];
    }

    function getModelAccess(uint256 modelId, address user) external view returns (ModelAccess memory) {
        return modelAccess[modelId][user];
    }

    function getCreatorStats(address creator) external view returns (CreatorStats memory) {
        return creatorStats[creator];
    }

    function getCategories() external view returns (string[] memory) {
        return categories;
    }

    function getVerifiedCreators() external view returns (address[] memory) {
        return verifiedCreators;
    }

    function getTotalModels() external view returns (uint256) {
        return _modelIdCounter;
    }

    // Internal functions
    function _addCategory(string memory category) internal {
        if (!categoryExists[category]) {
            categoryExists[category] = true;
            categories.push(category);
        }
    }

    function _updateCreatorRating(address creator) internal {
        uint256[] memory modelIds = creatorModels[creator];
        if (modelIds.length == 0) return;

        uint256 totalRating = 0;
        uint256 totalCount = 0;

        for (uint256 i = 0; i < modelIds.length; i++) {
            AIModel memory model = models[modelIds[i]];
            if (model.ratingCount > 0) {
                totalRating = totalRating + (model.rating * model.ratingCount);
                totalCount = totalCount + model.ratingCount;
            }
        }

        if (totalCount > 0) {
            creatorStats[creator].averageRating = totalRating / totalCount;
        }
    }
}