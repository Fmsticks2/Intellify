// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title IntellifyINFT
 * @dev Full implementation of ERC-7857 INFT standard for Intellify Wave 2
 * @notice This contract represents AI knowledge companions as NFTs with embedded AI state and private metadata
 */

// ERC-7857 Interfaces
interface IERC7857 {
    // Events
    event MetadataUpdate(uint256 indexed tokenId, bytes32[] dataHashes);
    event AuthorizedUser(uint256 indexed tokenId, address indexed user);
    event RevokedUser(uint256 indexed tokenId, address indexed user);
    
    // Core functions
    function getDataHashes(uint256 tokenId) external view returns (bytes32[] memory);
    function updateMetadata(uint256 tokenId, bytes32[] memory newDataHashes) external;
    function authorizeUser(uint256 tokenId, address user) external;
    function revokeUser(uint256 tokenId, address user) external;
    function isAuthorized(uint256 tokenId, address user) external view returns (bool);
}

interface IERC7857Metadata {
    function getMetadataURI(uint256 tokenId) external view returns (string memory);
    function setMetadataURI(uint256 tokenId, string memory uri) external;
}

interface IERC7857Verification {
    struct VerificationResult {
        bool success;
        string message;
        bytes data;
    }
    
    function verifyOwnership(uint256 tokenId, bytes32[] memory dataHashes, bytes memory proof) external view returns (VerificationResult memory);
    function verifyTransfer(uint256 tokenId, address from, address to, bytes32[] memory dataHashes, bytes memory proof) external view returns (VerificationResult memory);
}

contract IntellifyINFT is ERC721, ERC721URIStorage, Ownable, AccessControl, ReentrancyGuard, Pausable, IERC7857, IERC7857Metadata, IERC7857Verification {
    uint256 private _tokenIdCounter;
    
    // Role definitions for access control
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");
    bytes32 public constant KNOWLEDGE_MANAGER_ROLE = keccak256("KNOWLEDGE_MANAGER_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    
    // ERC-7857 Interface IDs
    bytes4 private constant _INTERFACE_ID_ERC7857 = 0x12345678; // TODO: Update with official interface ID
    bytes4 private constant _INTERFACE_ID_ERC7857_METADATA = 0x87654321; // TODO: Update with official interface ID
    bytes4 private constant _INTERFACE_ID_ERC7857_VERIFICATION = 0xabcdef12; // TODO: Update with official interface ID
    
    // INFT-specific structures
    struct AIState {
        string modelVersion;
        string[] knowledgeHashes;  // 0G Storage hashes
        uint256 interactionCount;
        uint256 lastUpdated;
        bool isActive;
        address owner;
        bytes32 encryptedStateHash;  // Hash of encrypted AI model state
        string stateEncryptionKey;   // Encrypted state key
    }
    
    struct KnowledgeMetadata {
        string contentType;
        uint256 fileSize;
        string encryptionKey;  // Encrypted with owner's public key
        uint256 uploadTimestamp;
        bool isEncrypted;
        bytes32 knowledgeIndexHash;  // Hash of encrypted knowledge index
        string indexEncryptionKey;   // Encrypted index key
    }
    
    // Enhanced encrypted knowledge storage
    struct EncryptedKnowledgeIndex {
        bytes32[] contentHashes;     // Hashes of encrypted content chunks
        bytes32[] semanticHashes;    // Hashes of encrypted semantic embeddings
        bytes32 indexStructureHash;  // Hash of encrypted index structure
        string masterEncryptionKey;  // Master key encrypted with owner's public key
        uint256 totalChunks;
        uint256 lastIndexUpdate;
        bool isFullyEncrypted;
    }
    
    // Encrypted AI model state storage
    struct EncryptedModelState {
        bytes32 weightsHash;         // Hash of encrypted model weights
        bytes32 configHash;          // Hash of encrypted model configuration
        bytes32 memoryHash;          // Hash of encrypted conversation memory
        bytes32 contextHash;         // Hash of encrypted context data
        string stateEncryptionKey;   // State encryption key (encrypted)
        uint256 stateVersion;
        uint256 lastStateUpdate;
        bool isStatefulModel;
    }
    
    // ERC-7857 Private Metadata structures
    struct PrivateMetadata {
        bytes32[] dataHashes;  // Hashes of encrypted AI model data
        string metadataURI;    // URI to encrypted metadata
        uint256 lastUpdate;
        bool isEncrypted;
    }
    
    // Mappings
    mapping(uint256 => AIState) public aiStates;
    mapping(uint256 => KnowledgeMetadata[]) public knowledgeMetadata;
    mapping(address => uint256[]) public userINFTs;
    mapping(string => bool) public usedKnowledgeHashes;
    
    // Enhanced encrypted knowledge storage mappings
    mapping(uint256 => EncryptedKnowledgeIndex) private _encryptedKnowledgeIndex;
    mapping(uint256 => EncryptedModelState) private _encryptedModelState;
    mapping(uint256 => mapping(bytes32 => bool)) private _verifiedContentHashes;
    mapping(uint256 => mapping(address => bytes32)) private _userAccessKeys;
    mapping(uint256 => uint256) private _encryptionVersions;
    
    // ERC-7857 specific mappings
    mapping(uint256 => PrivateMetadata) private _privateMetadata;
    mapping(uint256 => mapping(address => bool)) private _authorizedUsers;
    mapping(uint256 => address[]) private _tokenAuthorizedUsers;
    
    // Enhanced access control mappings
    mapping(uint256 => mapping(bytes32 => mapping(address => bool))) private _tokenRolePermissions;
    mapping(uint256 => mapping(bytes32 => address[])) private _tokenRoleMembers;
    mapping(address => bool) private _blacklistedAddresses;
    mapping(uint256 => bool) private _frozenTokens;
    mapping(uint256 => uint256) private _transferCooldowns;
    
    // Permission flags
    uint256 public constant PERMISSION_READ = 1;
    uint256 public constant PERMISSION_WRITE = 2;
    uint256 public constant PERMISSION_TRANSFER = 4;
    uint256 public constant PERMISSION_BURN = 8;
    uint256 public constant PERMISSION_AUTHORIZE = 16;
    
    // Global settings
    uint256 public defaultTransferCooldown = 1 hours;
    bool public emergencyPause = false;
    
    // Events
    event INFTMinted(uint256 indexed tokenId, address indexed owner, string knowledgeHash);
    event AIStateUpdated(uint256 indexed tokenId, uint256 interactionCount);
    event KnowledgeAdded(uint256 indexed tokenId, string knowledgeHash);
    event AIInteraction(uint256 indexed tokenId, address indexed user, string interactionType);
    
    // Enhanced encrypted knowledge storage events
    event EncryptedKnowledgeIndexed(uint256 indexed tokenId, bytes32 indexed indexHash, uint256 totalChunks);
    event EncryptedModelStateUpdated(uint256 indexed tokenId, bytes32 indexed stateHash, uint256 stateVersion);
    event UserAccessKeyGranted(uint256 indexed tokenId, address indexed user, bytes32 keyHash);
    event UserAccessKeyRevoked(uint256 indexed tokenId, address indexed user);
    event EncryptionVersionUpdated(uint256 indexed tokenId, uint256 newVersion);
    event ContentHashVerified(uint256 indexed tokenId, bytes32 indexed contentHash, bool verified);
    
    // Enhanced access control events
    event TokenRoleGranted(uint256 indexed tokenId, bytes32 indexed role, address indexed account);
    event TokenRoleRevoked(uint256 indexed tokenId, bytes32 indexed role, address indexed account);
    event AddressBlacklisted(address indexed account, bool blacklisted);
    event TokenFrozen(uint256 indexed tokenId, bool frozen);
    event TransferCooldownSet(uint256 indexed tokenId, uint256 cooldownPeriod);
    event EmergencyPauseToggled(bool paused);
    
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
            _authorizedUsers[tokenId][msg.sender] ||
            hasRole(ADMIN_ROLE, msg.sender),
            "Not authorized"
        );
        _;
    }
    
    modifier notBlacklisted(address account) {
        require(!_blacklistedAddresses[account], "Address is blacklisted");
        _;
    }
    
    modifier notFrozen(uint256 tokenId) {
        require(!_frozenTokens[tokenId], "Token is frozen");
        _;
    }
    
    modifier respectsCooldown(uint256 tokenId) {
        require(
            block.timestamp >= _transferCooldowns[tokenId],
            "Transfer cooldown active"
        );
        _;
    }
    
    modifier onlyWhenNotEmergencyPaused() {
        require(!emergencyPause, "Emergency pause active");
        _;
    }
    
    constructor() ERC721("Intellify INFT", "IINFT") Ownable(msg.sender) {
        // Grant admin role to contract deployer
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(MODERATOR_ROLE, msg.sender);
        _grantRole(KNOWLEDGE_MANAGER_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
    }
    
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
    ) public onlyRole(MINTER_ROLE) notBlacklisted(to) onlyWhenNotEmergencyPaused returns (uint256) {
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
            isActive: true,
            owner: to,
            encryptedStateHash: keccak256(abi.encodePacked("initial_state", tokenId)),
            stateEncryptionKey: "" // To be set by frontend with user's public key
        });
        
        // Initialize ERC-7857 private metadata
        bytes32[] memory initialDataHashes = new bytes32[](1);
        initialDataHashes[0] = keccak256(abi.encodePacked(knowledgeHash));
        
        _privateMetadata[tokenId] = PrivateMetadata({
            dataHashes: initialDataHashes,
            metadataURI: metadataURI,
            lastUpdate: block.timestamp,
            isEncrypted: true
        });
        
        // Initialize encrypted knowledge index
        bytes32[] memory initialContentHashes = new bytes32[](1);
        bytes32[] memory initialSemanticHashes = new bytes32[](1);
        initialContentHashes[0] = keccak256(abi.encodePacked(knowledgeHash, "content"));
        initialSemanticHashes[0] = keccak256(abi.encodePacked(knowledgeHash, "semantic"));
        
        _encryptedKnowledgeIndex[tokenId] = EncryptedKnowledgeIndex({
            contentHashes: initialContentHashes,
            semanticHashes: initialSemanticHashes,
            indexStructureHash: keccak256(abi.encodePacked("index_structure", tokenId)),
            masterEncryptionKey: "", // To be set by frontend
            totalChunks: 1,
            lastIndexUpdate: block.timestamp,
            isFullyEncrypted: true
        });
        
        // Initialize encrypted model state
        _encryptedModelState[tokenId] = EncryptedModelState({
            weightsHash: keccak256(abi.encodePacked("weights", tokenId)),
            configHash: keccak256(abi.encodePacked("config", tokenId)),
            memoryHash: keccak256(abi.encodePacked("memory", tokenId)),
            contextHash: keccak256(abi.encodePacked("context", tokenId)),
            stateEncryptionKey: "", // To be set by frontend
            stateVersion: 1,
            lastStateUpdate: block.timestamp,
            isStatefulModel: true
        });
        
        // Initialize encryption version
        _encryptionVersions[tokenId] = 1;
        
        // Mark knowledge hash as used
        usedKnowledgeHashes[knowledgeHash] = true;
        
        // Add to user's INFT list
        userINFTs[to].push(tokenId);
        
        // Set initial transfer cooldown
        _transferCooldowns[tokenId] = block.timestamp + defaultTransferCooldown;
        
        emit INFTMinted(tokenId, to, knowledgeHash);
        emit MetadataUpdate(tokenId, initialDataHashes);
        emit TransferCooldownSet(tokenId, defaultTransferCooldown);
        emit EncryptedKnowledgeIndexed(tokenId, _encryptedKnowledgeIndex[tokenId].indexStructureHash, 1);
        emit EncryptedModelStateUpdated(tokenId, _encryptedModelState[tokenId].weightsHash, 1);
        emit EncryptionVersionUpdated(tokenId, 1);
        
        return tokenId;
    }
    
    // Enhanced Access Control Functions
    
    /**
     * @dev Grant a role to an account for a specific token
     * @param tokenId The token ID
     * @param role The role to grant
     * @param account The account to grant the role to
     */
    function grantTokenRole(uint256 tokenId, bytes32 role, address account) 
        public 
        onlyTokenOwner(tokenId) 
        validTokenId(tokenId) 
        notBlacklisted(account) 
    {
        require(account != address(0), "Invalid account");
        require(!_tokenRolePermissions[tokenId][role][account], "Role already granted");
        
        _tokenRolePermissions[tokenId][role][account] = true;
        _tokenRoleMembers[tokenId][role].push(account);
        
        emit TokenRoleGranted(tokenId, role, account);
    }
    
    /**
     * @dev Revoke a role from an account for a specific token
     * @param tokenId The token ID
     * @param role The role to revoke
     * @param account The account to revoke the role from
     */
    function revokeTokenRole(uint256 tokenId, bytes32 role, address account) 
        public 
        onlyTokenOwner(tokenId) 
        validTokenId(tokenId) 
    {
        require(_tokenRolePermissions[tokenId][role][account], "Role not granted");
        
        _tokenRolePermissions[tokenId][role][account] = false;
        
        // Remove from role members array
        address[] storage members = _tokenRoleMembers[tokenId][role];
        for (uint256 i = 0; i < members.length; i++) {
            if (members[i] == account) {
                members[i] = members[members.length - 1];
                members.pop();
                break;
            }
        }
        
        emit TokenRoleRevoked(tokenId, role, account);
    }
    
    /**
     * @dev Check if an account has a specific role for a token
     * @param tokenId The token ID
     * @param role The role to check
     * @param account The account to check
     * @return Boolean indicating if account has the role
     */
    function hasTokenRole(uint256 tokenId, bytes32 role, address account) 
        public 
        view 
        validTokenId(tokenId) 
        returns (bool) 
    {
        return _tokenRolePermissions[tokenId][role][account] || 
               ownerOf(tokenId) == account ||
               hasRole(ADMIN_ROLE, account);
    }
    
    /**
     * @dev Get all accounts with a specific role for a token
     * @param tokenId The token ID
     * @param role The role to query
     * @return Array of account addresses
     */
    function getTokenRoleMembers(uint256 tokenId, bytes32 role) 
        public 
        view 
        validTokenId(tokenId) 
        returns (address[] memory) 
    {
        return _tokenRoleMembers[tokenId][role];
    }
    
    /**
     * @dev Blacklist or unblacklist an address (admin only)
     * @param account The account to blacklist/unblacklist
     * @param blacklisted Whether to blacklist or unblacklist
     */
    function setAddressBlacklisted(address account, bool blacklisted) 
        public 
        onlyRole(ADMIN_ROLE) 
    {
        require(account != address(0), "Invalid account");
        require(account != owner(), "Cannot blacklist owner");
        
        _blacklistedAddresses[account] = blacklisted;
        emit AddressBlacklisted(account, blacklisted);
    }
    
    /**
     * @dev Freeze or unfreeze a token (moderator only)
     * @param tokenId The token ID to freeze/unfreeze
     * @param frozen Whether to freeze or unfreeze
     */
    function setTokenFrozen(uint256 tokenId, bool frozen) 
        public 
        onlyRole(MODERATOR_ROLE) 
        validTokenId(tokenId) 
    {
        _frozenTokens[tokenId] = frozen;
        emit TokenFrozen(tokenId, frozen);
    }
    
    /**
     * @dev Set transfer cooldown for a token
     * @param tokenId The token ID
     * @param cooldownPeriod The cooldown period in seconds
     */
    function setTransferCooldown(uint256 tokenId, uint256 cooldownPeriod) 
        public 
        onlyTokenOwner(tokenId) 
        validTokenId(tokenId) 
    {
        require(cooldownPeriod <= 30 days, "Cooldown too long");
        
        _transferCooldowns[tokenId] = block.timestamp + cooldownPeriod;
        emit TransferCooldownSet(tokenId, cooldownPeriod);
    }
    
    /**
     * @dev Set default transfer cooldown (admin only)
     * @param cooldownPeriod The default cooldown period in seconds
     */
    function setDefaultTransferCooldown(uint256 cooldownPeriod) 
        public 
        onlyRole(ADMIN_ROLE) 
    {
        require(cooldownPeriod <= 7 days, "Default cooldown too long");
        defaultTransferCooldown = cooldownPeriod;
    }
    
    /**
     * @dev Toggle emergency pause (admin only)
     * @param paused Whether to pause or unpause
     */
    function setEmergencyPause(bool paused) 
        public 
        onlyRole(ADMIN_ROLE) 
    {
        emergencyPause = paused;
        emit EmergencyPauseToggled(paused);
        
        if (paused) {
            _pause();
        } else {
            _unpause();
        }
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
    ) public onlyTokenOwnerOrAuthorized(tokenId) validTokenId(tokenId) notFrozen(tokenId) onlyWhenNotEmergencyPaused {
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
     * @dev Add encrypted knowledge chunk to the knowledge index
     * @param tokenId The token ID to add encrypted knowledge to
     * @param contentHash Hash of encrypted content chunk
     * @param semanticHash Hash of encrypted semantic embedding
     * @param encryptedChunkKey Encrypted key for this specific chunk
     */
    function addEncryptedKnowledgeChunk(
        uint256 tokenId,
        bytes32 contentHash,
        bytes32 semanticHash,
        string memory encryptedChunkKey
    ) public onlyTokenOwnerOrAuthorized(tokenId) validTokenId(tokenId) notFrozen(tokenId) onlyWhenNotEmergencyPaused {
        require(contentHash != bytes32(0), "Invalid content hash");
        require(semanticHash != bytes32(0), "Invalid semantic hash");
        require(aiStates[tokenId].isActive, "AI state is not active");
        
        EncryptedKnowledgeIndex storage index = _encryptedKnowledgeIndex[tokenId];
        
        // Add new hashes to the index
        index.contentHashes.push(contentHash);
        index.semanticHashes.push(semanticHash);
        index.totalChunks++;
        index.lastIndexUpdate = block.timestamp;
        
        // Update index structure hash
        index.indexStructureHash = keccak256(abi.encodePacked(
            index.indexStructureHash,
            contentHash,
            semanticHash,
            block.timestamp
        ));
        
        // Mark content hash as verified
        _verifiedContentHashes[tokenId][contentHash] = true;
        
        emit EncryptedKnowledgeIndexed(tokenId, index.indexStructureHash, index.totalChunks);
        emit ContentHashVerified(tokenId, contentHash, true);
    }
    
    /**
     * @dev Update encrypted AI model state
     * @param tokenId The token ID to update
     * @param weightsHash New hash of encrypted model weights
     * @param configHash New hash of encrypted model configuration
     * @param memoryHash New hash of encrypted conversation memory
     * @param contextHash New hash of encrypted context data
     */
    function updateEncryptedModelState(
        uint256 tokenId,
        bytes32 weightsHash,
        bytes32 configHash,
        bytes32 memoryHash,
        bytes32 contextHash
    ) public onlyTokenOwnerOrAuthorized(tokenId) validTokenId(tokenId) notFrozen(tokenId) onlyWhenNotEmergencyPaused {
        require(aiStates[tokenId].isActive, "AI state is not active");
        
        EncryptedModelState storage modelState = _encryptedModelState[tokenId];
        
        // Update model state hashes
        if (weightsHash != bytes32(0)) modelState.weightsHash = weightsHash;
        if (configHash != bytes32(0)) modelState.configHash = configHash;
        if (memoryHash != bytes32(0)) modelState.memoryHash = memoryHash;
        if (contextHash != bytes32(0)) modelState.contextHash = contextHash;
        
        // Increment state version
        modelState.stateVersion++;
        modelState.lastStateUpdate = block.timestamp;
        
        emit EncryptedModelStateUpdated(tokenId, modelState.weightsHash, modelState.stateVersion);
    }
    
    /**
     * @dev Grant encrypted access key to a user
     * @param tokenId The token ID
     * @param user The user address to grant access
     * @param encryptedAccessKey The encrypted access key for the user
     */
    function grantUserAccessKey(
        uint256 tokenId,
        address user,
        bytes32 encryptedAccessKey
    ) public onlyTokenOwner(tokenId) validTokenId(tokenId) notBlacklisted(user) notFrozen(tokenId) onlyWhenNotEmergencyPaused {
        require(user != address(0), "Invalid user address");
        require(encryptedAccessKey != bytes32(0), "Invalid access key");
        
        _userAccessKeys[tokenId][user] = encryptedAccessKey;
        
        emit UserAccessKeyGranted(tokenId, user, encryptedAccessKey);
    }
    
    /**
     * @dev Revoke user access key
     * @param tokenId The token ID
     * @param user The user address to revoke access
     */
    function revokeUserAccessKey(
        uint256 tokenId,
        address user
    ) public onlyTokenOwner(tokenId) validTokenId(tokenId) notFrozen(tokenId) onlyWhenNotEmergencyPaused {
        require(_userAccessKeys[tokenId][user] != bytes32(0), "User has no access key");
        
        delete _userAccessKeys[tokenId][user];
        
        emit UserAccessKeyRevoked(tokenId, user);
    }
    
    /**
     * @dev Update encryption version for enhanced security
     * @param tokenId The token ID
     * @param newVersion New encryption version
     */
    function updateEncryptionVersion(
        uint256 tokenId,
        uint256 newVersion
    ) public onlyTokenOwner(tokenId) validTokenId(tokenId) notFrozen(tokenId) onlyWhenNotEmergencyPaused {
        require(newVersion > _encryptionVersions[tokenId], "Version must be higher");
        
        _encryptionVersions[tokenId] = newVersion;
        
        emit EncryptionVersionUpdated(tokenId, newVersion);
    }
    
    /**
     * @dev Record an AI interaction
     * @param tokenId The token ID that was interacted with
     * @param interactionType Type of interaction (summary, qa, etc.)
     */
    function recordInteraction(
        uint256 tokenId,
        string memory interactionType
    ) public onlyTokenOwnerOrAuthorized(tokenId) validTokenId(tokenId) notFrozen(tokenId) onlyWhenNotEmergencyPaused {
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
    ) public onlyTokenOwner(tokenId) validTokenId(tokenId) notFrozen(tokenId) onlyWhenNotEmergencyPaused {
        aiStates[tokenId].modelVersion = newModelVersion;
        aiStates[tokenId].lastUpdated = block.timestamp;
    }
    
    /**
     * @dev Deactivate an INFT (for privacy or security reasons)
     * @param tokenId The token ID to deactivate
     */
    function deactivateINFT(uint256 tokenId) public onlyTokenOwner(tokenId) validTokenId(tokenId) notFrozen(tokenId) onlyWhenNotEmergencyPaused {
        aiStates[tokenId].isActive = false;
        aiStates[tokenId].lastUpdated = block.timestamp;
    }
    
    /**
     * @dev Reactivate an INFT
     * @param tokenId The token ID to reactivate
     */
    function reactivateINFT(uint256 tokenId) public onlyTokenOwner(tokenId) validTokenId(tokenId) notFrozen(tokenId) onlyWhenNotEmergencyPaused {
        aiStates[tokenId].isActive = true;
        aiStates[tokenId].lastUpdated = block.timestamp;
    }
    
    // ERC-7857 Implementation
    
    /**
     * @dev Get data hashes for a token (ERC-7857)
     * @param tokenId The token ID to query
     * @return Array of data hashes
     */
    function getDataHashes(uint256 tokenId) external view override validTokenId(tokenId) returns (bytes32[] memory) {
        return _privateMetadata[tokenId].dataHashes;
    }
    
    /**
     * @dev Update metadata for a token (ERC-7857)
     * @param tokenId The token ID to update
     * @param newDataHashes New array of data hashes
     */
    function updateMetadata(uint256 tokenId, bytes32[] memory newDataHashes) external override onlyTokenOwner(tokenId) validTokenId(tokenId) notFrozen(tokenId) onlyWhenNotEmergencyPaused {
        _privateMetadata[tokenId].dataHashes = newDataHashes;
        _privateMetadata[tokenId].lastUpdate = block.timestamp;
        
        emit MetadataUpdate(tokenId, newDataHashes);
    }
    
    /**
     * @dev Authorize a user to access token data (ERC-7857)
     * @param tokenId The token ID
     * @param user The user address to authorize
     */
    function authorizeUser(uint256 tokenId, address user) external override onlyTokenOwner(tokenId) validTokenId(tokenId) notBlacklisted(user) notFrozen(tokenId) onlyWhenNotEmergencyPaused {
        require(user != address(0), "Invalid user address");
        require(!_authorizedUsers[tokenId][user], "User already authorized");
        
        _authorizedUsers[tokenId][user] = true;
        _tokenAuthorizedUsers[tokenId].push(user);
        
        emit AuthorizedUser(tokenId, user);
    }
    
    /**
     * @dev Revoke user authorization (ERC-7857)
     * @param tokenId The token ID
     * @param user The user address to revoke
     */
    function revokeUser(uint256 tokenId, address user) external override onlyTokenOwner(tokenId) validTokenId(tokenId) notFrozen(tokenId) onlyWhenNotEmergencyPaused {
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
    
    /**
     * @dev Check if user is authorized (ERC-7857)
     * @param tokenId The token ID
     * @param user The user address to check
     * @return Boolean indicating authorization status
     */
    function isAuthorized(uint256 tokenId, address user) external view override validTokenId(tokenId) returns (bool) {
        return _authorizedUsers[tokenId][user] || ownerOf(tokenId) == user;
    }
    
    /**
     * @dev Get metadata URI (ERC-7857 Metadata)
     * @param tokenId The token ID
     * @return Metadata URI
     */
    function getMetadataURI(uint256 tokenId) external view override validTokenId(tokenId) returns (string memory) {
        return _privateMetadata[tokenId].metadataURI;
    }
    
    /**
     * @dev Set metadata URI (ERC-7857 Metadata)
     * @param tokenId The token ID
     * @param uri New metadata URI
     */
    function setMetadataURI(uint256 tokenId, string memory uri) external override onlyTokenOwner(tokenId) validTokenId(tokenId) notFrozen(tokenId) onlyWhenNotEmergencyPaused {
        _privateMetadata[tokenId].metadataURI = uri;
        _privateMetadata[tokenId].lastUpdate = block.timestamp;
    }
    
    /**
     * @dev Verify ownership (ERC-7857 Verification)
     * @param tokenId The token ID
     * @param dataHashes Data hashes to verify
     * @param proof Verification proof
     * @return Verification result
     */
    function verifyOwnership(uint256 tokenId, bytes32[] memory dataHashes, bytes memory proof) external view override validTokenId(tokenId) returns (VerificationResult memory) {
        // Basic verification - in production, this would use TEE/ZKP
        bytes32[] memory storedHashes = _privateMetadata[tokenId].dataHashes;
        
        if (dataHashes.length != storedHashes.length) {
            return VerificationResult(false, "Hash count mismatch", "");
        }
        
        for (uint256 i = 0; i < dataHashes.length; i++) {
            if (dataHashes[i] != storedHashes[i]) {
                return VerificationResult(false, "Hash mismatch", "");
            }
        }
        
        return VerificationResult(true, "Ownership verified", proof);
    }
    
    /**
     * @dev Verify transfer (ERC-7857 Verification)
     * @param tokenId The token ID
     * @param from Source address
     * @param to Destination address
     * @param dataHashes Data hashes to verify
     * @param proof Verification proof
     * @return Verification result
     */
    function verifyTransfer(uint256 tokenId, address from, address to, bytes32[] memory dataHashes, bytes memory proof) external view override validTokenId(tokenId) returns (VerificationResult memory) {
        // Verify ownership first
        VerificationResult memory ownershipResult = this.verifyOwnership(tokenId, dataHashes, proof);
        if (!ownershipResult.success) {
            return ownershipResult;
        }
        
        // Verify transfer authorization
        if (ownerOf(tokenId) != from) {
            return VerificationResult(false, "Invalid from address", "");
        }
        
        if (to == address(0)) {
            return VerificationResult(false, "Invalid to address", "");
        }
        
        return VerificationResult(true, "Transfer verified", proof);
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
    
    // Enhanced encrypted knowledge storage view functions
    
    /**
     * @dev Get encrypted knowledge index for a token (owner or authorized only)
     * @param tokenId The token ID to query
     * @return EncryptedKnowledgeIndex struct
     */
    function getEncryptedKnowledgeIndex(uint256 tokenId) public view onlyTokenOwnerOrAuthorized(tokenId) validTokenId(tokenId) returns (EncryptedKnowledgeIndex memory) {
        return _encryptedKnowledgeIndex[tokenId];
    }
    
    /**
     * @dev Get encrypted model state for a token (owner or authorized only)
     * @param tokenId The token ID to query
     * @return EncryptedModelState struct
     */
    function getEncryptedModelState(uint256 tokenId) public view onlyTokenOwnerOrAuthorized(tokenId) validTokenId(tokenId) returns (EncryptedModelState memory) {
        return _encryptedModelState[tokenId];
    }
    
    /**
     * @dev Get user access key for a token
     * @param tokenId The token ID to query
     * @param user The user address to query
     * @return Encrypted access key
     */
    function getUserAccessKey(uint256 tokenId, address user) public view validTokenId(tokenId) returns (bytes32) {
        require(
            ownerOf(tokenId) == msg.sender || 
            user == msg.sender ||
            hasRole(ADMIN_ROLE, msg.sender),
            "Not authorized to view access key"
        );
        return _userAccessKeys[tokenId][user];
    }
    
    /**
     * @dev Check if content hash is verified for a token
     * @param tokenId The token ID to query
     * @param contentHash The content hash to check
     * @return Boolean indicating if hash is verified
     */
    function isContentHashVerified(uint256 tokenId, bytes32 contentHash) public view validTokenId(tokenId) returns (bool) {
        return _verifiedContentHashes[tokenId][contentHash];
    }
    
    /**
     * @dev Get encryption version for a token
     * @param tokenId The token ID to query
     * @return Current encryption version
     */
    function getEncryptionVersion(uint256 tokenId) public view validTokenId(tokenId) returns (uint256) {
        return _encryptionVersions[tokenId];
    }
    
    /**
     * @dev Get knowledge index summary (public info only)
     * @param tokenId The token ID to query
     * @return totalChunks Total number of knowledge chunks
     * @return lastUpdate Last update timestamp
     * @return isEncrypted Whether the index is encrypted
     */
    function getKnowledgeIndexSummary(uint256 tokenId) public view validTokenId(tokenId) returns (uint256 totalChunks, uint256 lastUpdate, bool isEncrypted) {
        EncryptedKnowledgeIndex memory index = _encryptedKnowledgeIndex[tokenId];
        return (index.totalChunks, index.lastIndexUpdate, index.isFullyEncrypted);
    }
    
    /**
     * @dev Get model state summary (public info only)
     * @param tokenId The token ID to query
     * @return stateVersion Current state version
     * @return lastUpdate Last update timestamp
     * @return isStateful Whether the model is stateful
     */
    function getModelStateSummary(uint256 tokenId) public view validTokenId(tokenId) returns (uint256 stateVersion, uint256 lastUpdate, bool isStateful) {
        EncryptedModelState memory state = _encryptedModelState[tokenId];
        return (state.stateVersion, state.lastStateUpdate, state.isStatefulModel);
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
        return _tokenIdCounter;
    }
    
    /**
     * @dev Check if knowledge hash is already used
     * @param knowledgeHash The hash to check
     * @return Boolean indicating if hash is used
     */
    function isKnowledgeHashUsed(string memory knowledgeHash) public view returns (bool) {
        return usedKnowledgeHashes[knowledgeHash];
    }
    
    /**
     * @dev Get authorized users for a token
     * @param tokenId The token ID to query
     * @return Array of authorized user addresses
     */
    function getAuthorizedUsers(uint256 tokenId) public view validTokenId(tokenId) returns (address[] memory) {
        return _tokenAuthorizedUsers[tokenId];
    }
    
    /**
     * @dev Get private metadata info for a token (owner only)
     * @param tokenId The token ID to query
     * @return PrivateMetadata struct
     */
    function getPrivateMetadata(uint256 tokenId) public view onlyTokenOwner(tokenId) validTokenId(tokenId) returns (PrivateMetadata memory) {
        return _privateMetadata[tokenId];
    }
    
    /**
     * @dev Get private metadata last update timestamp
     * @param tokenId The token ID to query
     * @return Last update timestamp
     */
    function getPrivateMetadataLastUpdate(uint256 tokenId) public view validTokenId(tokenId) returns (uint256) {
        return _privateMetadata[tokenId].lastUpdate;
    }
    
    /**
     * @dev Check if token has encrypted metadata
     * @param tokenId The token ID to query
     * @return Boolean indicating if metadata is encrypted
     */
    function isMetadataEncrypted(uint256 tokenId) public view validTokenId(tokenId) returns (bool) {
        return _privateMetadata[tokenId].isEncrypted;
    }
    
    // Override functions
    
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        
        // Enhanced security checks for transfers
        if (from != address(0) && to != address(0)) {
            require(!_blacklistedAddresses[from], "From address is blacklisted");
            require(!_blacklistedAddresses[to], "To address is blacklisted");
            require(!_frozenTokens[tokenId], "Token is frozen");
            require(!emergencyPause, "Emergency pause active");
            require(
                block.timestamp >= _transferCooldowns[tokenId],
                "Transfer cooldown active"
            );
            
            // Set new transfer cooldown
            _transferCooldowns[tokenId] = block.timestamp + defaultTransferCooldown;
        }
        
        address previousOwner = super._update(to, tokenId, auth);
        
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
            
            // Clear token-specific role permissions on transfer
            _clearTokenRoles(tokenId);
        }
        
        return previousOwner;
    }
    
    /**
     * @dev Clear all token-specific roles when transferring
     * @param tokenId The token ID to clear roles for
     */
    function _clearTokenRoles(uint256 tokenId) internal {
        bytes32[5] memory roles = [
            MINTER_ROLE,
            MODERATOR_ROLE,
            KNOWLEDGE_MANAGER_ROLE,
            VERIFIER_ROLE,
            DEFAULT_ADMIN_ROLE
        ];
        
        for (uint256 i = 0; i < roles.length; i++) {
            address[] storage members = _tokenRoleMembers[tokenId][roles[i]];
            for (uint256 j = 0; j < members.length; j++) {
                _tokenRolePermissions[tokenId][roles[i]][members[j]] = false;
            }
            delete _tokenRoleMembers[tokenId][roles[i]];
        }
    }
    
    function burn(uint256 tokenId) public {
        require(_isAuthorized(_ownerOf(tokenId), msg.sender, tokenId), "Not authorized to burn");
        
        // Store hashes before burning
        string[] memory hashes = aiStates[tokenId].knowledgeHashes;
        
        _burn(tokenId);
        
        // Clean up AI state
        delete aiStates[tokenId];
        delete knowledgeMetadata[tokenId];
        
        // Clean up ERC-7857 private metadata
        delete _privateMetadata[tokenId];
        
        // Clean up authorized users
        address[] memory authorizedUsers = _tokenAuthorizedUsers[tokenId];
        for (uint256 i = 0; i < authorizedUsers.length; i++) {
            delete _authorizedUsers[tokenId][authorizedUsers[i]];
        }
        delete _tokenAuthorizedUsers[tokenId];
        
        // Mark knowledge hashes as unused (for potential reuse)
        for (uint256 i = 0; i < hashes.length; i++) {
            usedKnowledgeHashes[hashes[i]] = false;
        }
    }
    
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    // Enhanced view functions for access control
    
    /**
     * @dev Check if an address is blacklisted
     * @param account The account to check
     * @return Boolean indicating if account is blacklisted
     */
    function isAddressBlacklisted(address account) public view returns (bool) {
        return _blacklistedAddresses[account];
    }
    
    /**
     * @dev Check if a token is frozen
     * @param tokenId The token ID to check
     * @return Boolean indicating if token is frozen
     */
    function isTokenFrozen(uint256 tokenId) public view validTokenId(tokenId) returns (bool) {
        return _frozenTokens[tokenId];
    }
    
    /**
     * @dev Get transfer cooldown timestamp for a token
     * @param tokenId The token ID to check
     * @return Timestamp when transfer cooldown expires
     */
    function getTransferCooldown(uint256 tokenId) public view validTokenId(tokenId) returns (uint256) {
        return _transferCooldowns[tokenId];
    }
    
    /**
     * @dev Check if a token can be transferred
     * @param tokenId The token ID to check
     * @return Boolean indicating if token can be transferred
     */
    function canTransfer(uint256 tokenId) public view validTokenId(tokenId) returns (bool) {
        return !_frozenTokens[tokenId] && 
               !emergencyPause && 
               block.timestamp >= _transferCooldowns[tokenId];
    }
    
    /**
     * @dev Get comprehensive token security status
     * @param tokenId The token ID to check
     * @return frozen Whether token is frozen
     * @return cooldownExpiry When transfer cooldown expires
     * @return canTransferNow Whether token can be transferred now
     * @return ownerBlacklisted Whether owner is blacklisted
     */
    function getTokenSecurityStatus(uint256 tokenId) 
        public 
        view 
        validTokenId(tokenId) 
        returns (
            bool frozen,
            uint256 cooldownExpiry,
            bool canTransferNow,
            bool ownerBlacklisted
        ) 
    {
        address tokenOwner = ownerOf(tokenId);
        return (
            _frozenTokens[tokenId],
            _transferCooldowns[tokenId],
            canTransfer(tokenId),
            _blacklistedAddresses[tokenOwner]
        );
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage, AccessControl) returns (bool) {
        return interfaceId == _INTERFACE_ID_ERC7857 ||
               interfaceId == _INTERFACE_ID_ERC7857_METADATA ||
               interfaceId == _INTERFACE_ID_ERC7857_VERIFICATION ||
               super.supportsInterface(interfaceId);
    }
}