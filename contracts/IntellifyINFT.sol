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