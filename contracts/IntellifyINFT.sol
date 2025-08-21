// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title IntellifyINFT
 * @dev Mock implementation of ERC-7857 INFT standard for Intellify Wave 2
 * @notice This contract represents AI knowledge companions as NFTs with embedded AI state
 */
contract IntellifyINFT is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIdCounter;
    
    // INFT-specific structures
    struct AIState {
        string modelVersion;
        string[] knowledgeHashes;  // 0G Storage hashes
        uint256 interactionCount;
        uint256 lastUpdated;
        bool isActive;
        address owner;
    }
    
    struct KnowledgeMetadata {
        string contentType;
        uint256 fileSize;
        string encryptionKey;  // Encrypted with owner's public key
        uint256 uploadTimestamp;
        bool isEncrypted;
    }
    
    // Mappings
    mapping(uint256 => AIState) public aiStates;
    mapping(uint256 => KnowledgeMetadata[]) public knowledgeMetadata;
    mapping(address => uint256[]) public userINFTs;
    mapping(string => bool) public usedKnowledgeHashes;
    
    // Events
    event INFTMinted(uint256 indexed tokenId, address indexed owner, string knowledgeHash);
    event AIStateUpdated(uint256 indexed tokenId, uint256 interactionCount);
    event KnowledgeAdded(uint256 indexed tokenId, string knowledgeHash);
    event AIInteraction(uint256 indexed tokenId, address indexed user, string interactionType);
    
    // Modifiers
    modifier onlyTokenOwner(uint256 tokenId) {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        _;
    }
    
    modifier validTokenId(uint256 tokenId) {
        require(_exists(tokenId), "Token does not exist");
        _;
    }
    
    constructor() ERC721("Intellify INFT", "IINFT") {}
    
    /**
     * @dev Mint a new INFT with initial AI state
     * @param to Address to mint the token to
     * @param metadataURI URI pointing to token metadata
     * @param knowledgeHash Initial knowledge hash from 0G Storage
     * @param modelVersion Version of the AI model
     * @return tokenId The ID of the newly minted token
     */
    function mintINFT(
        address to,
        string memory metadataURI,
        string memory knowledgeHash,
        string memory modelVersion
    ) public returns (uint256) {
        require(bytes(knowledgeHash).length > 0, "Knowledge hash required");
        require(!usedKnowledgeHashes[knowledgeHash], "Knowledge hash already used");
        
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
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
            isActive: true,
            owner: to
        });
        
        // Mark knowledge hash as used
        usedKnowledgeHashes[knowledgeHash] = true;
        
        // Add to user's INFT list
        userINFTs[to].push(tokenId);
        
        emit INFTMinted(tokenId, to, knowledgeHash);
        
        return tokenId;
    }
    
    /**
     * @dev Add new knowledge to an existing INFT
     * @param tokenId The token ID to add knowledge to
     * @param knowledgeHash New knowledge hash from 0G Storage
     * @param metadata Metadata about the knowledge
     */
    function addKnowledge(
        uint256 tokenId,
        string memory knowledgeHash,
        KnowledgeMetadata memory metadata
    ) public onlyTokenOwner(tokenId) validTokenId(tokenId) {
        require(bytes(knowledgeHash).length > 0, "Knowledge hash required");
        require(!usedKnowledgeHashes[knowledgeHash], "Knowledge hash already used");
        require(aiStates[tokenId].isActive, "AI state is not active");
        
        // Add to knowledge hashes
        aiStates[tokenId].knowledgeHashes.push(knowledgeHash);
        aiStates[tokenId].lastUpdated = block.timestamp;
        
        // Add metadata
        knowledgeMetadata[tokenId].push(metadata);
        
        // Mark as used
        usedKnowledgeHashes[knowledgeHash] = true;
        
        emit KnowledgeAdded(tokenId, knowledgeHash);
    }
    
    /**
     * @dev Record an AI interaction
     * @param tokenId The token ID that was interacted with
     * @param interactionType Type of interaction (summary, qa, etc.)
     */
    function recordInteraction(
        uint256 tokenId,
        string memory interactionType
    ) public onlyTokenOwner(tokenId) validTokenId(tokenId) {
        require(aiStates[tokenId].isActive, "AI state is not active");
        
        aiStates[tokenId].interactionCount++;
        aiStates[tokenId].lastUpdated = block.timestamp;
        
        emit AIInteraction(tokenId, msg.sender, interactionType);
        emit AIStateUpdated(tokenId, aiStates[tokenId].interactionCount);
    }
    
    /**
     * @dev Update AI model version
     * @param tokenId The token ID to update
     * @param newModelVersion New model version
     */
    function updateModelVersion(
        uint256 tokenId,
        string memory newModelVersion
    ) public onlyTokenOwner(tokenId) validTokenId(tokenId) {
        aiStates[tokenId].modelVersion = newModelVersion;
        aiStates[tokenId].lastUpdated = block.timestamp;
    }
    
    /**
     * @dev Deactivate an INFT (for privacy or security reasons)
     * @param tokenId The token ID to deactivate
     */
    function deactivateINFT(uint256 tokenId) public onlyTokenOwner(tokenId) validTokenId(tokenId) {
        aiStates[tokenId].isActive = false;
        aiStates[tokenId].lastUpdated = block.timestamp;
    }
    
    /**
     * @dev Reactivate an INFT
     * @param tokenId The token ID to reactivate
     */
    function reactivateINFT(uint256 tokenId) public onlyTokenOwner(tokenId) validTokenId(tokenId) {
        aiStates[tokenId].isActive = true;
        aiStates[tokenId].lastUpdated = block.timestamp;
    }
    
    // View functions
    
    /**
     * @dev Get AI state for a token
     * @param tokenId The token ID to query
     * @return AIState struct
     */
    function getAIState(uint256 tokenId) public view validTokenId(tokenId) returns (AIState memory) {
        return aiStates[tokenId];
    }
    
    /**
     * @dev Get knowledge hashes for a token
     * @param tokenId The token ID to query
     * @return Array of knowledge hashes
     */
    function getKnowledgeHashes(uint256 tokenId) public view validTokenId(tokenId) returns (string[] memory) {
        return aiStates[tokenId].knowledgeHashes;
    }
    
    /**
     * @dev Get knowledge metadata for a token
     * @param tokenId The token ID to query
     * @return Array of knowledge metadata
     */
    function getKnowledgeMetadata(uint256 tokenId) public view validTokenId(tokenId) returns (KnowledgeMetadata[] memory) {
        return knowledgeMetadata[tokenId];
    }
    
    /**
     * @dev Get all INFTs owned by a user
     * @param user The user address to query
     * @return Array of token IDs
     */
    function getUserINFTs(address user) public view returns (uint256[] memory) {
        return userINFTs[user];
    }
    
    /**
     * @dev Get total number of minted INFTs
     * @return Total supply
     */
    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter.current();
    }
    
    /**
     * @dev Check if knowledge hash is already used
     * @param knowledgeHash The hash to check
     * @return Boolean indicating if hash is used
     */
    function isKnowledgeHashUsed(string memory knowledgeHash) public view returns (bool) {
        return usedKnowledgeHashes[knowledgeHash];
    }
    
    // Override functions
    
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
        
        // Update owner in AI state when transferring
        if (from != address(0) && to != address(0)) {
            aiStates[tokenId].owner = to;
            
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
    }
    
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
        
        // Clean up AI state
        delete aiStates[tokenId];
        delete knowledgeMetadata[tokenId];
        
        // Mark knowledge hashes as unused (for potential reuse)
        string[] memory hashes = aiStates[tokenId].knowledgeHashes;
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