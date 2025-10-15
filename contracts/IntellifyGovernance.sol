// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./IntellifyINFT.sol";

/**
 * @title IntellifyGovernance
 * @dev Governance contract for Intellify protocol allowing INFT holders to vote on proposals
 */
contract IntellifyGovernance is Ownable, ReentrancyGuard, Pausable {
    IntellifyINFT public immutable inftContract;
    
    enum ProposalState {
        Pending,
        Active,
        Succeeded,
        Defeated,
        Executed,
        Cancelled
    }
    
    enum VoteType {
        Against,
        For,
        Abstain
    }
    
    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string description;
        address[] targets;
        uint256[] values;
        bytes[] calldatas;
        uint256 startBlock;
        uint256 endBlock;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        bool executed;
        bool cancelled;
        mapping(address => Receipt) receipts;
    }
    
    struct Receipt {
        bool hasVoted;
        VoteType support;
        uint256 votes;
        uint256[] tokenIds;
    }
    
    struct ProposalView {
        uint256 id;
        address proposer;
        string title;
        string description;
        address[] targets;
        uint256[] values;
        bytes[] calldatas;
        uint256 startBlock;
        uint256 endBlock;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        bool executed;
        bool cancelled;
        ProposalState state;
    }
    
    // Governance parameters
    uint256 public votingDelay = 1; // 1 block
    uint256 public votingPeriod = 17280; // ~3 days in blocks (assuming 15s blocks)
    uint256 public proposalThreshold = 1; // Minimum INFTs to create proposal
    uint256 public quorumNumerator = 4; // 4% quorum
    uint256 public constant QUORUM_DENOMINATOR = 100;
    
    // State variables
    uint256 private _proposalCounter;
    mapping(uint256 => Proposal) private _proposals;
    mapping(address => uint256) public latestProposalIds;
    
    // Events
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string title,
        string description,
        uint256 startBlock,
        uint256 endBlock
    );
    
    event VoteCast(
        address indexed voter,
        uint256 indexed proposalId,
        VoteType support,
        uint256 weight,
        uint256[] tokenIds
    );
    
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCancelled(uint256 indexed proposalId);
    
    event VotingDelaySet(uint256 oldVotingDelay, uint256 newVotingDelay);
    event VotingPeriodSet(uint256 oldVotingPeriod, uint256 newVotingPeriod);
    event ProposalThresholdSet(uint256 oldProposalThreshold, uint256 newProposalThreshold);
    event QuorumNumeratorUpdated(uint256 oldQuorumNumerator, uint256 newQuorumNumerator);
    
    constructor(address _inftContract) Ownable(msg.sender) {
        require(_inftContract != address(0), "Invalid INFT contract");
        inftContract = IntellifyINFT(_inftContract);
    }
    
    /**
     * @dev Create a new proposal
     */
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory title,
        string memory description
    ) public returns (uint256) {
        require(
            getVotes(msg.sender, block.number - 1) >= proposalThreshold,
            "Proposer votes below proposal threshold"
        );
        require(
            targets.length == values.length && targets.length == calldatas.length,
            "Proposal function information arity mismatch"
        );
        require(targets.length > 0, "Must provide actions");
        require(bytes(title).length > 0, "Title cannot be empty");
        require(bytes(description).length > 0, "Description cannot be empty");
        
        uint256 latestProposalId = latestProposalIds[msg.sender];
        if (latestProposalId != 0) {
            ProposalState proposerLatestProposalState = state(latestProposalId);
            require(
                proposerLatestProposalState != ProposalState.Active,
                "One live proposal per proposer, found an already active proposal"
            );
            require(
                proposerLatestProposalState != ProposalState.Pending,
                "One live proposal per proposer, found an already pending proposal"
            );
        }
        
        uint256 proposalId = ++_proposalCounter;
        uint256 startBlock = block.number + votingDelay;
        uint256 endBlock = startBlock + votingPeriod;
        
        Proposal storage newProposal = _proposals[proposalId];
        newProposal.id = proposalId;
        newProposal.proposer = msg.sender;
        newProposal.title = title;
        newProposal.description = description;
        newProposal.targets = targets;
        newProposal.values = values;
        newProposal.calldatas = calldatas;
        newProposal.startBlock = startBlock;
        newProposal.endBlock = endBlock;
        
        latestProposalIds[msg.sender] = proposalId;
        
        emit ProposalCreated(proposalId, msg.sender, title, description, startBlock, endBlock);
        
        return proposalId;
    }
    
    /**
     * @dev Cast a vote for a proposal
     */
    function castVote(uint256 proposalId, VoteType support) public returns (uint256) {
        uint256[] memory tokenIds = inftContract.getUserINFTs(msg.sender);
        return _castVote(msg.sender, proposalId, support, tokenIds);
    }
    
    /**
     * @dev Cast a vote with specific token IDs
     */
    function castVoteWithTokens(
        uint256 proposalId,
        VoteType support,
        uint256[] memory tokenIds
    ) public returns (uint256) {
        // Verify all tokens belong to the voter
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(inftContract.ownerOf(tokenIds[i]) == msg.sender, "Not token owner");
        }
        return _castVote(msg.sender, proposalId, support, tokenIds);
    }
    
    /**
     * @dev Internal vote casting logic
     */
    function _castVote(
        address voter,
        uint256 proposalId,
        VoteType support,
        uint256[] memory tokenIds
    ) internal returns (uint256) {
        require(state(proposalId) == ProposalState.Active, "Voting is closed");
        
        Proposal storage proposal = _proposals[proposalId];
        Receipt storage receipt = proposal.receipts[voter];
        require(!receipt.hasVoted, "Voter already voted");
        
        uint256 weight = _getVotingWeight(tokenIds);
        require(weight > 0, "No voting power");
        
        receipt.hasVoted = true;
        receipt.support = support;
        receipt.votes = weight;
        receipt.tokenIds = tokenIds;
        
        if (support == VoteType.Against) {
            proposal.againstVotes += weight;
        } else if (support == VoteType.For) {
            proposal.forVotes += weight;
        } else {
            proposal.abstainVotes += weight;
        }
        
        emit VoteCast(voter, proposalId, support, weight, tokenIds);
        
        return weight;
    }
    
    /**
     * @dev Execute a successful proposal
     */
    function execute(uint256 proposalId) public payable nonReentrant {
        require(state(proposalId) == ProposalState.Succeeded, "Proposal not succeeded");
        
        Proposal storage proposal = _proposals[proposalId];
        proposal.executed = true;
        
        for (uint256 i = 0; i < proposal.targets.length; i++) {
            (bool success, ) = proposal.targets[i].call{value: proposal.values[i]}(
                proposal.calldatas[i]
            );
            require(success, "Transaction execution reverted");
        }
        
        emit ProposalExecuted(proposalId);
    }
    
    /**
     * @dev Cancel a proposal
     */
    function cancel(uint256 proposalId) public {
        require(state(proposalId) != ProposalState.Executed, "Cannot cancel executed proposal");
        
        Proposal storage proposal = _proposals[proposalId];
        require(
            msg.sender == proposal.proposer || msg.sender == owner(),
            "Only proposer or owner can cancel"
        );
        
        proposal.cancelled = true;
        
        emit ProposalCancelled(proposalId);
    }
    
    /**
     * @dev Get the current state of a proposal
     */
    function state(uint256 proposalId) public view returns (ProposalState) {
        require(_proposals[proposalId].id != 0, "Unknown proposal id");
        
        Proposal storage proposal = _proposals[proposalId];
        
        if (proposal.cancelled) {
            return ProposalState.Cancelled;
        } else if (proposal.executed) {
            return ProposalState.Executed;
        } else if (block.number <= proposal.startBlock) {
            return ProposalState.Pending;
        } else if (block.number <= proposal.endBlock) {
            return ProposalState.Active;
        } else if (proposal.forVotes <= proposal.againstVotes || !_quorumReached(proposalId)) {
            return ProposalState.Defeated;
        } else {
            return ProposalState.Succeeded;
        }
    }
    
    /**
     * @dev Get proposal details
     */
    function getProposal(uint256 proposalId) public view returns (ProposalView memory) {
        require(_proposals[proposalId].id != 0, "Unknown proposal id");
        
        Proposal storage proposal = _proposals[proposalId];
        
        return ProposalView({
            id: proposal.id,
            proposer: proposal.proposer,
            title: proposal.title,
            description: proposal.description,
            targets: proposal.targets,
            values: proposal.values,
            calldatas: proposal.calldatas,
            startBlock: proposal.startBlock,
            endBlock: proposal.endBlock,
            forVotes: proposal.forVotes,
            againstVotes: proposal.againstVotes,
            abstainVotes: proposal.abstainVotes,
            executed: proposal.executed,
            cancelled: proposal.cancelled,
            state: state(proposalId)
        });
    }
    
    /**
     * @dev Get voting receipt for a voter on a proposal
     */
    function getReceipt(uint256 proposalId, address voter) public view returns (Receipt memory) {
        return _proposals[proposalId].receipts[voter];
    }
    
    /**
     * @dev Get voting power for an address at a specific block
     */
    function getVotes(address account, uint256 blockNumber) public view returns (uint256) {
        require(blockNumber < block.number, "Block not yet mined");
        uint256[] memory tokenIds = inftContract.getUserINFTs(account);
        return _getVotingWeight(tokenIds);
    }
    
    /**
     * @dev Calculate voting weight based on INFT characteristics
     */
    function _getVotingWeight(uint256[] memory tokenIds) internal view returns (uint256) {
        uint256 totalWeight = 0;
        
        for (uint256 i = 0; i < tokenIds.length; i++) {
            IntellifyINFT.AIState memory aiState = inftContract.getAIState(tokenIds[i]);
            
            // Base weight of 1 per INFT
            uint256 weight = 1;
            
            // Bonus for interaction count (max 2x multiplier)
            if (aiState.interactionCount > 0) {
                uint256 interactionBonus = aiState.interactionCount / 100; // 1% per 100 interactions
                weight += (weight * interactionBonus) / 100;
                if (weight > 2) weight = 2; // Cap at 2x
            }
            
            // Bonus for knowledge diversity (max 1.5x multiplier)
            uint256 knowledgeCount = aiState.knowledgeHashes.length;
            if (knowledgeCount > 1) {
                uint256 knowledgeBonus = (knowledgeCount - 1) * 10; // 10% per additional knowledge
                weight += (weight * knowledgeBonus) / 100;
                if (weight > 3) weight = 3; // Cap total at 3x
            }
            
            totalWeight += weight;
        }
        
        return totalWeight;
    }
    
    /**
     * @dev Check if quorum is reached for a proposal
     */
    function _quorumReached(uint256 proposalId) internal view returns (bool) {
        Proposal storage proposal = _proposals[proposalId];
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
        uint256 totalSupply = inftContract.totalSupply();
        
        return totalVotes >= (totalSupply * quorumNumerator) / QUORUM_DENOMINATOR;
    }
    
    /**
     * @dev Get total number of proposals
     */
    function proposalCount() public view returns (uint256) {
        return _proposalCounter;
    }
    
    /**
     * @dev Get quorum for current total supply
     */
    function quorum(uint256 blockNumber) public view returns (uint256) {
        return (inftContract.totalSupply() * quorumNumerator) / QUORUM_DENOMINATOR;
    }
    
    // Admin functions
    
    function setVotingDelay(uint256 newVotingDelay) public onlyOwner {
        emit VotingDelaySet(votingDelay, newVotingDelay);
        votingDelay = newVotingDelay;
    }
    
    function setVotingPeriod(uint256 newVotingPeriod) public onlyOwner {
        require(newVotingPeriod > 0, "Voting period too low");
        emit VotingPeriodSet(votingPeriod, newVotingPeriod);
        votingPeriod = newVotingPeriod;
    }
    
    function setProposalThreshold(uint256 newProposalThreshold) public onlyOwner {
        emit ProposalThresholdSet(proposalThreshold, newProposalThreshold);
        proposalThreshold = newProposalThreshold;
    }
    
    function updateQuorumNumerator(uint256 newQuorumNumerator) public onlyOwner {
        require(newQuorumNumerator <= QUORUM_DENOMINATOR, "Quorum numerator too high");
        emit QuorumNumeratorUpdated(quorumNumerator, newQuorumNumerator);
        quorumNumerator = newQuorumNumerator;
    }
    
    // Emergency functions
    
    function pause() public onlyOwner {
        _pause();
    }
    
    function unpause() public onlyOwner {
        _unpause();
    }
    
    receive() external payable {}
}