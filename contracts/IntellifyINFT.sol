// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title IntellifyINFT
 * @dev Simplified implementation of ERC-7857 INFT standard for Intellify Wave 2
 * @notice This contract represents AI knowledge companions as NFTs with embedded AI state
 */

// Simplified ERC-7857 Interface
interface IERC7857 {
    event MetadataUpdate(uint256 indexed tokenId, bytes32[] dataHashes);
    event AuthorizedUser(uint256 indexed tokenId, address indexed user);
    event RevokedUser(uint256 indexed tokenId, address indexed user);
    
    function getDataHashes(uint256 tokenId) external view returns (bytes32[] memory);
    function updateMetadata(uint256 tokenId, bytes32[] memory newDataHashes) external;
    function authorizeUser(uint256 tokenId, address user) external;
    function revokeUser(uint256 tokenId, address user) external;
    function isAuthorized(uint256 tokenId, address user) external view returns (bool);
}

contract IntellifyINFT is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard, Pausable, IERC7857 {
    uint256 private _tokenIdCounter;
    
    // Simplified AI state structure
    struct AIState {
        string modelVersion;
        string[] knowledgeHashes;  // 0G Storage hashes
        uint256 interactionCount;
        uint256 lastUpdated;
        bool isActive;
    }
    
    // Simplified knowledge metadata
    struct KnowledgeMetadata {
        string contentType;
        uint256 fileSize;
        uint256 uploadTimestamp;
        bool isEncrypted;
    }
    
    // Simplified private metadata for ERC-7857
    struct PrivateMetadata {
        bytes32[] dataHashes;
        string metadataURI;
        uint256 lastUpdate;
    }
    
    // Core mappings
    mapping(uint256 => AIState) public aiStates;
    mapping(uint256 => KnowledgeMetadata[]) public knowledgeMetadata;
    mapping(address => uint256[]) public userINFTs;
    mapping(string => bool) public usedKnowledgeHashes;
    
    // ERC-7857 mappings
    mapping(uint256 => PrivateMetadata) private _privateMetadata;
    mapping(uint256 => mapping(address => bool)) private _authorizedUsers;
    mapping(uint256 => address[]) private _tokenAuthorizedUsers;
    
    // Events
    event INFTMinted(uint256 indexed tokenId, address indexed owner, string knowledgeHash);
    event AIStateUpdated(uint256 indexed tokenId, uint256 interactionCount);
    event KnowledgeAdded(uint256 indexed tokenId, string knowledgeHash);
    event AIInteraction(uint256 indexed tokenId, address indexed user, string interactionType);
    event INFTEvolved(uint256 indexed tokenId, uint256 newLevel, string newMetadataURI);
    event MetadataURIUpdated(uint256 indexed tokenId, string newURI);
    
    // Modifiers
    modifier onlyTokenOwner(uint256 tokenId) {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        _;
    }
    
    modifier validTokenId(uint256 tokenId) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        _;
    }
    
    modifier onlyTokenOwnerOrAuthorized(uint256 tokenId) {
        require(
            ownerOf(tokenId) == msg.sender || 
            _authorizedUsers[tokenId][msg.sender],
            "Not authorized"
        );
        _;
    }
    
    constructor() ERC721("Intellify INFT", "IINFT") Ownable(msg.sender) {}
    
    /**
     * @dev Mint a new INFT with initial AI state
     */
    function mintINFT(
        address to,
        string memory metadataURI,
        string memory knowledgeHash,
        string memory modelVersion
    ) public onlyOwner returns (uint256) {
        require(bytes(knowledgeHash).length > 0, "Knowledge hash required");
        require(!usedKnowledgeHashes[knowledgeHash], "Knowledge hash already used");
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, metadataURI);
        
        // Initialize AI state
        string[] memory initialHashes = new string[](1);
        initialHashes[0] = knowledgeHash;
        
        aiStates[tokenId] = AIState({
            modelVersion: modelVersion,
            knowledgeHashes: initialHashes,
            interactionCount: 0,
            lastUpdated: block.timestamp,
            isActive: true
        });
        
        // Initialize ERC-7857 private metadata
        bytes32[] memory initialDataHashes = new bytes32[](1);
        initialDataHashes[0] = keccak256(abi.encodePacked(knowledgeHash));
        
        _privateMetadata[tokenId] = PrivateMetadata({
            dataHashes: initialDataHashes,
            metadataURI: metadataURI,
            lastUpdate: block.timestamp
        });
        
        // Mark knowledge hash as used
        usedKnowledgeHashes[knowledgeHash] = true;
        
        // Add to user's INFT list
        userINFTs[to].push(tokenId);
        
        emit INFTMinted(tokenId, to, knowledgeHash);
        emit MetadataUpdate(tokenId, initialDataHashes);
        
        return tokenId;
    }
    
    /**
     * @dev Add new knowledge to an existing INFT
     */
    function addKnowledge(
        uint256 tokenId,
        string memory knowledgeHash,
        KnowledgeMetadata memory metadata
    ) public onlyTokenOwnerOrAuthorized(tokenId) validTokenId(tokenId) {
        require(bytes(knowledgeHash).length > 0, "Knowledge hash required");
        require(!usedKnowledgeHashes[knowledgeHash], "Knowledge hash already used");
        require(aiStates[tokenId].isActive, "AI state is not active");
        
        // Add to knowledge hashes
        aiStates[tokenId].knowledgeHashes.push(knowledgeHash);
        aiStates[tokenId].lastUpdated = block.timestamp;
        
        // Add metadata
        knowledgeMetadata[tokenId].push(metadata);
        
        // Update ERC-7857 private metadata
        bytes32 newDataHash = keccak256(abi.encodePacked(knowledgeHash));
        _privateMetadata[tokenId].dataHashes.push(newDataHash);
        _privateMetadata[tokenId].lastUpdate = block.timestamp;
        
        // Mark as used
        usedKnowledgeHashes[knowledgeHash] = true;
        
        emit KnowledgeAdded(tokenId, knowledgeHash);
        emit MetadataUpdate(tokenId, _privateMetadata[tokenId].dataHashes);
    }
    
    /**
     * @dev Record an AI interaction
     */
    function recordInteraction(
        uint256 tokenId,
        string memory interactionType
    ) public onlyTokenOwnerOrAuthorized(tokenId) validTokenId(tokenId) {
        require(aiStates[tokenId].isActive, "AI state is not active");
        
        aiStates[tokenId].interactionCount++;
        aiStates[tokenId].lastUpdated = block.timestamp;
        
        emit AIInteraction(tokenId, msg.sender, interactionType);
        emit AIStateUpdated(tokenId, aiStates[tokenId].interactionCount);
    }

    /**
     * @dev Update token URI (for evolution metadata updates)
     */
    function updateTokenURI(
        uint256 tokenId,
        string memory newURI
    ) public onlyTokenOwnerOrAuthorized(tokenId) validTokenId(tokenId) {
        require(bytes(newURI).length > 0, "URI cannot be empty");
        
        _setTokenURI(tokenId, newURI);
        
        // Update private metadata URI for ERC-7857
        _privateMetadata[tokenId].metadataURI = newURI;
        _privateMetadata[tokenId].lastUpdate = block.timestamp;
        
        emit MetadataURIUpdated(tokenId, newURI);
    }

    /**
     * @dev Update metadata with evolution (combines URI update with level tracking)
     */
    function evolveINFT(
        uint256 tokenId,
        string memory newMetadataURI,
        uint256 newLevel
    ) public onlyTokenOwnerOrAuthorized(tokenId) validTokenId(tokenId) {
        require(bytes(newMetadataURI).length > 0, "Metadata URI cannot be empty");
        require(newLevel > 0, "Level must be greater than 0");
        
        // Update token URI
        _setTokenURI(tokenId, newMetadataURI);
        
        // Update private metadata for ERC-7857
        _privateMetadata[tokenId].metadataURI = newMetadataURI;
        _privateMetadata[tokenId].lastUpdate = block.timestamp;
        
        // Update AI state timestamp
        aiStates[tokenId].lastUpdated = block.timestamp;
        
        emit INFTEvolved(tokenId, newLevel, newMetadataURI);
        emit MetadataURIUpdated(tokenId, newMetadataURI);
    }

    /**
     * @dev Batch update metadata URIs for multiple tokens (gas optimization)
     */
    function batchUpdateTokenURIs(
        uint256[] memory tokenIds,
        string[] memory newURIs
    ) public {
        require(tokenIds.length == newURIs.length, "Arrays length mismatch");
        require(tokenIds.length > 0, "Empty arrays");
        
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(_ownerOf(tokenIds[i]) != address(0), "Token does not exist");
            require(
                ownerOf(tokenIds[i]) == msg.sender || 
                _authorizedUsers[tokenIds[i]][msg.sender],
                "Not authorized for token"
            );
            require(bytes(newURIs[i]).length > 0, "URI cannot be empty");
            
            _setTokenURI(tokenIds[i], newURIs[i]);
            
            // Update private metadata
            _privateMetadata[tokenIds[i]].metadataURI = newURIs[i];
            _privateMetadata[tokenIds[i]].lastUpdate = block.timestamp;
            
            emit MetadataURIUpdated(tokenIds[i], newURIs[i]);
        }
    }
    
    /**
     * @dev Update AI model version
     */
    function updateModelVersion(
        uint256 tokenId,
        string memory newModelVersion
    ) public onlyTokenOwner(tokenId) validTokenId(tokenId) {
        aiStates[tokenId].modelVersion = newModelVersion;
        aiStates[tokenId].lastUpdated = block.timestamp;
    }
    
    /**
     * @dev Deactivate an INFT
     */
    function deactivateINFT(uint256 tokenId) public onlyTokenOwner(tokenId) validTokenId(tokenId) {
        aiStates[tokenId].isActive = false;
        aiStates[tokenId].lastUpdated = block.timestamp;
    }
    
    /**
     * @dev Reactivate an INFT
     */
    function reactivateINFT(uint256 tokenId) public onlyTokenOwner(tokenId) validTokenId(tokenId) {
        aiStates[tokenId].isActive = true;
        aiStates[tokenId].lastUpdated = block.timestamp;
    }
    
    // ERC-7857 Implementation
    
    function getDataHashes(uint256 tokenId) external view override validTokenId(tokenId) returns (bytes32[] memory) {
        return _privateMetadata[tokenId].dataHashes;
    }
    
    function updateMetadata(uint256 tokenId, bytes32[] memory newDataHashes) external override onlyTokenOwner(tokenId) validTokenId(tokenId) {
        _privateMetadata[tokenId].dataHashes = newDataHashes;
        _privateMetadata[tokenId].lastUpdate = block.timestamp;
        
        emit MetadataUpdate(tokenId, newDataHashes);
    }
    
    function authorizeUser(uint256 tokenId, address user) external override onlyTokenOwner(tokenId) validTokenId(tokenId) {
        require(user != address(0), "Invalid user address");
        require(!_authorizedUsers[tokenId][user], "User already authorized");
        
        _authorizedUsers[tokenId][user] = true;
        _tokenAuthorizedUsers[tokenId].push(user);
        
        emit AuthorizedUser(tokenId, user);
    }
    
    function revokeUser(uint256 tokenId, address user) external override onlyTokenOwner(tokenId) validTokenId(tokenId) {
        require(_authorizedUsers[tokenId][user], "User not authorized");
        
        _authorizedUsers[tokenId][user] = false;
        
        // Remove from authorized users array
        address[] storage authorizedUsers = _tokenAuthorizedUsers[tokenId];
        for (uint256 i = 0; i < authorizedUsers.length; i++) {
            if (authorizedUsers[i] == user) {
                authorizedUsers[i] = authorizedUsers[authorizedUsers.length - 1];
                authorizedUsers.pop();
                break;
            }
        }
        
        emit RevokedUser(tokenId, user);
    }
    
    function isAuthorized(uint256 tokenId, address user) external view override validTokenId(tokenId) returns (bool) {
        return _authorizedUsers[tokenId][user] || ownerOf(tokenId) == user;
    }
    
    // Essential view functions
    
    function getAIState(uint256 tokenId) public view validTokenId(tokenId) returns (AIState memory) {
        return aiStates[tokenId];
    }
    
    function getKnowledgeHashes(uint256 tokenId) public view validTokenId(tokenId) returns (string[] memory) {
        return aiStates[tokenId].knowledgeHashes;
    }
    
    function getKnowledgeMetadata(uint256 tokenId) public view validTokenId(tokenId) returns (KnowledgeMetadata[] memory) {
        return knowledgeMetadata[tokenId];
    }
    
    function getUserINFTs(address user) public view returns (uint256[] memory) {
        return userINFTs[user];
    }
    
    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter;
    }
    
    function isKnowledgeHashUsed(string memory knowledgeHash) public view returns (bool) {
        return usedKnowledgeHashes[knowledgeHash];
    }
    
    function getAuthorizedUsers(uint256 tokenId) public view validTokenId(tokenId) returns (address[] memory) {
        return _tokenAuthorizedUsers[tokenId];
    }
    
    // Advanced INFT Features
    
    // Breeding system
    struct BreedingInfo {
        uint256 parent1;
        uint256 parent2;
        uint256 breedingFee;
        uint256 cooldownPeriod;
        bool isBreeding;
    }
    
    // Evolution system
    struct EvolutionRequirement {
        uint256 minInteractions;
        uint256 minKnowledge;
        uint256 minAge; // in seconds
        bool requiresSpecialItem;
    }
    
    // Fusion system
    struct FusionRecipe {
        uint256[] requiredTokens;
        string resultModelVersion;
        uint256 fusionCost;
        bool isActive;
    }
    
    mapping(uint256 => BreedingInfo) public breedingInfo;
    mapping(uint256 => uint256) public lastBreedingTime;
    mapping(uint256 => uint256) public breedingCooldown;
    mapping(uint256 => uint256) public evolutionLevel;
    mapping(uint256 => FusionRecipe) public fusionRecipes;
    mapping(uint256 => bool) public hasEvolved;
    
    uint256 public constant BREEDING_COOLDOWN = 7 days;
    uint256 public constant BREEDING_FEE = 0.01 ether;
    uint256 public constant FUSION_BASE_COST = 0.05 ether;
    
    event INFTBred(uint256 indexed parent1, uint256 indexed parent2, uint256 indexed offspring);
    event INFTEvolutionTriggered(uint256 indexed tokenId, uint256 newLevel);
    event INFTFused(uint256[] indexed sourceTokens, uint256 indexed resultToken);
    event BreedingInitiated(uint256 indexed parent1, uint256 indexed parent2, uint256 cooldownEnd);
    
    /**
     * @dev Breed two INFTs to create a new one
     */
    function breedINFTs(
        uint256 parent1,
        uint256 parent2,
        string memory metadataURI
    ) public payable onlyTokenOwner(parent1) returns (uint256) {
        require(ownerOf(parent2) == msg.sender, "Must own both parents");
        require(parent1 != parent2, "Cannot breed with itself");
        require(msg.value >= BREEDING_FEE, "Insufficient breeding fee");
        require(
            block.timestamp >= lastBreedingTime[parent1] + BREEDING_COOLDOWN,
            "Parent 1 in cooldown"
        );
        require(
            block.timestamp >= lastBreedingTime[parent2] + BREEDING_COOLDOWN,
            "Parent 2 in cooldown"
        );
        
        // Get parent AI states
        AIState memory state1 = aiStates[parent1];
        AIState memory state2 = aiStates[parent2];
        
        require(state1.isActive && state2.isActive, "Parents must be active");
        
        // Create offspring
        uint256 offspring = _tokenIdCounter;
        _tokenIdCounter++;
        
        _safeMint(msg.sender, offspring);
        _setTokenURI(offspring, metadataURI);
        
        // Combine knowledge from both parents
        string[] memory combinedKnowledge = new string[](
            state1.knowledgeHashes.length + state2.knowledgeHashes.length
        );
        
        for (uint256 i = 0; i < state1.knowledgeHashes.length; i++) {
            combinedKnowledge[i] = state1.knowledgeHashes[i];
        }
        for (uint256 i = 0; i < state2.knowledgeHashes.length; i++) {
            combinedKnowledge[state1.knowledgeHashes.length + i] = state2.knowledgeHashes[i];
        }
        
        // Initialize offspring AI state with enhanced capabilities
        aiStates[offspring] = AIState({
            modelVersion: string(abi.encodePacked("Bred-", state1.modelVersion, "-", state2.modelVersion)),
            knowledgeHashes: combinedKnowledge,
            interactionCount: (state1.interactionCount + state2.interactionCount) / 4, // 25% of combined
            lastUpdated: block.timestamp,
            isActive: true
        });
        
        // Set breeding cooldowns
        lastBreedingTime[parent1] = block.timestamp;
        lastBreedingTime[parent2] = block.timestamp;
        breedingCooldown[parent1] = block.timestamp + BREEDING_COOLDOWN;
        breedingCooldown[parent2] = block.timestamp + BREEDING_COOLDOWN;
        
        // Add to user's INFT list
        userINFTs[msg.sender].push(offspring);
        
        emit INFTBred(parent1, parent2, offspring);
        emit INFTMinted(offspring, msg.sender, "bred-offspring");
        
        return offspring;
    }
    
    /**
     * @dev Evolve an INFT to the next level
     */
    function evolveINFT(
        uint256 tokenId,
        string memory newMetadataURI
    ) public onlyTokenOwnerOrAuthorized(tokenId) validTokenId(tokenId) {
        require(!hasEvolved[tokenId], "Already evolved");
        require(_canEvolve(tokenId), "Evolution requirements not met");
        
        AIState storage state = aiStates[tokenId];
        
        // Enhance AI capabilities
        state.modelVersion = string(abi.encodePacked("Evolved-", state.modelVersion));
        state.lastUpdated = block.timestamp;
        
        // Increase evolution level
        evolutionLevel[tokenId]++;
        hasEvolved[tokenId] = true;
        
        // Update metadata
        _setTokenURI(tokenId, newMetadataURI);
        
        emit INFTEvolutionTriggered(tokenId, evolutionLevel[tokenId]);
        emit INFTEvolved(tokenId, evolutionLevel[tokenId], newMetadataURI);
    }
    
    /**
     * @dev Fuse multiple INFTs into a more powerful one
     */
    function fuseINFTs(
        uint256[] memory sourceTokens,
        string memory resultMetadataURI,
        string memory resultModelVersion
    ) public payable returns (uint256) {
        require(sourceTokens.length >= 2, "Need at least 2 tokens to fuse");
        require(sourceTokens.length <= 5, "Cannot fuse more than 5 tokens");
        require(msg.value >= FUSION_BASE_COST * sourceTokens.length, "Insufficient fusion cost");
        
        // Verify ownership of all source tokens
        for (uint256 i = 0; i < sourceTokens.length; i++) {
            require(ownerOf(sourceTokens[i]) == msg.sender, "Must own all source tokens");
            require(aiStates[sourceTokens[i]].isActive, "All tokens must be active");
        }
        
        // Create result token
        uint256 resultToken = _tokenIdCounter;
        _tokenIdCounter++;
        
        _safeMint(msg.sender, resultToken);
        _setTokenURI(resultToken, resultMetadataURI);
        
        // Combine all knowledge and interactions
        uint256 totalKnowledge = 0;
        uint256 totalInteractions = 0;
        
        for (uint256 i = 0; i < sourceTokens.length; i++) {
            AIState memory sourceState = aiStates[sourceTokens[i]];
            totalKnowledge += sourceState.knowledgeHashes.length;
            totalInteractions += sourceState.interactionCount;
        }
        
        // Create enhanced AI state
        string[] memory fusedKnowledge = new string[](1);
        fusedKnowledge[0] = string(abi.encodePacked("fused-knowledge-", block.timestamp));
        
        aiStates[resultToken] = AIState({
            modelVersion: resultModelVersion,
            knowledgeHashes: fusedKnowledge,
            interactionCount: totalInteractions,
            lastUpdated: block.timestamp,
            isActive: true
        });
        
        // Set high evolution level for fused token
        evolutionLevel[resultToken] = sourceTokens.length;
        
        // Burn source tokens
        for (uint256 i = 0; i < sourceTokens.length; i++) {
            _burn(sourceTokens[i]);
            delete aiStates[sourceTokens[i]];
            delete knowledgeMetadata[sourceTokens[i]];
        }
        
        // Add to user's INFT list
        userINFTs[msg.sender].push(resultToken);
        
        emit INFTFused(sourceTokens, resultToken);
        emit INFTMinted(resultToken, msg.sender, "fused-token");
        
        return resultToken;
    }
    
    /**
     * @dev Check if an INFT can evolve
     */
    function _canEvolve(uint256 tokenId) internal view returns (bool) {
        AIState memory state = aiStates[tokenId];
        
        // Basic evolution requirements
        bool hasMinInteractions = state.interactionCount >= 100;
        bool hasMinKnowledge = state.knowledgeHashes.length >= 3;
        bool hasMinAge = (block.timestamp - state.lastUpdated) >= 7 days;
        
        return hasMinInteractions && hasMinKnowledge && hasMinAge;
    }
    
    /**
     * @dev Get breeding status for a token
     */
    function getBreedingStatus(uint256 tokenId) public view validTokenId(tokenId) returns (
        bool canBreed,
        uint256 cooldownEnd,
        uint256 timeRemaining
    ) {
        uint256 cooldownEndTime = lastBreedingTime[tokenId] + BREEDING_COOLDOWN;
        bool breedingReady = block.timestamp >= cooldownEndTime;
        uint256 remaining = breedingReady ? 0 : cooldownEndTime - block.timestamp;
        
        return (breedingReady, cooldownEndTime, remaining);
    }
    
    /**
     * @dev Get evolution status for a token
     */
    function getEvolutionStatus(uint256 tokenId) public view validTokenId(tokenId) returns (
        bool canEvolve,
        uint256 currentLevel,
        bool alreadyEvolved,
        uint256 interactions,
        uint256 knowledgeCount,
        uint256 age
    ) {
        AIState memory state = aiStates[tokenId];
        
        return (
            _canEvolve(tokenId),
            evolutionLevel[tokenId],
            hasEvolved[tokenId],
            state.interactionCount,
            state.knowledgeHashes.length,
            block.timestamp - state.lastUpdated
        );
    }
    
    /**
     * @dev Get fusion cost for multiple tokens
     */
    function getFusionCost(uint256 tokenCount) public pure returns (uint256) {
        require(tokenCount >= 2 && tokenCount <= 5, "Invalid token count");
        return FUSION_BASE_COST * tokenCount;
    }
    
    // Override functions
    
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        
        address previousOwner = super._update(to, tokenId, auth);
        
        // Update user INFT lists when transferring
        if (from != address(0) && to != address(0)) {
            // Remove from old owner's list
            uint256[] storage fromTokens = userINFTs[from];
            for (uint256 i = 0; i < fromTokens.length; i++) {
                if (fromTokens[i] == tokenId) {
                    fromTokens[i] = fromTokens[fromTokens.length - 1];
                    fromTokens.pop();
                    break;
                }
            }
            
            // Add to new owner's list
            userINFTs[to].push(tokenId);
        }
        
        return previousOwner;
    }
    
    function burn(uint256 tokenId) public {
        require(_isAuthorized(_ownerOf(tokenId), msg.sender, tokenId), "Not authorized to burn");
        
        // Store hashes before burning
        string[] memory hashes = aiStates[tokenId].knowledgeHashes;
        
        _burn(tokenId);
        
        // Clean up state
        delete aiStates[tokenId];
        delete knowledgeMetadata[tokenId];
        delete _privateMetadata[tokenId];
        
        // Clean up authorized users
        address[] memory authorizedUsers = _tokenAuthorizedUsers[tokenId];
        for (uint256 i = 0; i < authorizedUsers.length; i++) {
            delete _authorizedUsers[tokenId][authorizedUsers[i]];
        }
        delete _tokenAuthorizedUsers[tokenId];
        
        // Mark knowledge hashes as unused
        for (uint256 i = 0; i < hashes.length; i++) {
            usedKnowledgeHashes[hashes[i]] = false;
        }
    }
    
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}