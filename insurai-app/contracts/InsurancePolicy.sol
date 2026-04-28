// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title InsurAI — Parametric Insurance on 0G Chain
 * @notice Trustless parametric insurance with AI-verified claims via 0G Compute TEE
 * @dev Deployed on 0G Galileo Testnet (Chain ID: 16602)
 *      TEE enclave address signs claim approvals using ECDSA
 */
contract InsurancePolicy {
    // ─── Types ────────────────────────────────────────────────────────────────

    enum PolicyType { FlightDelay, GadgetWarranty, EventCancellation, TravelMedical }
    enum ClaimStatus { None, Pending, Approved, Rejected, Paid }

    struct Policy {
        uint256 id;
        address holder;
        string agentId;       // .0g domain e.g. "alice.0g"
        PolicyType policyType;
        uint256 coverage;     // max payout in wei
        uint256 premium;      // premium paid
        uint256 createdAt;
        uint256 expiresAt;
        bool active;
        string storageCid;    // 0G Storage root hash of policy metadata
    }

    struct Claim {
        uint256 id;
        uint256 policyId;
        address holder;
        string evidenceCid;   // 0G Storage CID of claim evidence
        ClaimStatus status;
        uint256 submittedAt;
        uint256 settledAt;
        uint256 payout;
        bytes teeSignature;   // ECDSA signature from 0G Compute TEE enclave
    }

    // ─── State ────────────────────────────────────────────────────────────────

    address public owner;
    address public teeSignerAddress;  // Registered TEE enclave signer
    uint256 public policyCount;
    uint256 public claimCount;
    uint256 public totalPremiumsCollected;
    uint256 public totalPayoutsReleased;
    uint256 public constant PROTOCOL_FEE_BPS = 200; // 2% protocol fee

    mapping(uint256 => Policy) public policies;
    mapping(uint256 => Claim) public claims;
    mapping(address => uint256[]) public holderPolicies;
    mapping(address => uint256[]) public holderClaims;
    mapping(uint256 => uint256) public policyActiveClaim; // policyId => claimId

    // ─── Events ───────────────────────────────────────────────────────────────

    event PolicyPurchased(
        uint256 indexed policyId,
        address indexed holder,
        string agentId,
        PolicyType policyType,
        uint256 coverage,
        uint256 premium,
        string storageCid
    );

    event ClaimSubmitted(
        uint256 indexed claimId,
        uint256 indexed policyId,
        address indexed holder,
        string evidenceCid
    );

    event ClaimApproved(
        uint256 indexed claimId,
        uint256 indexed policyId,
        address indexed holder,
        uint256 payout,
        bytes teeSignature
    );

    event ClaimRejected(
        uint256 indexed claimId,
        uint256 indexed policyId,
        string reason
    );

    event TeeSignerUpdated(address indexed newSigner);
    event FundsDeposited(address indexed depositor, uint256 amount);

    // ─── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "InsurAI: Not owner");
        _;
    }

    modifier policyExists(uint256 policyId) {
        require(policyId > 0 && policyId <= policyCount, "InsurAI: Policy not found");
        _;
    }

    modifier claimExists(uint256 claimId) {
        require(claimId > 0 && claimId <= claimCount, "InsurAI: Claim not found");
        _;
    }

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor(address _teeSignerAddress) payable {
        owner = msg.sender;
        teeSignerAddress = _teeSignerAddress;
    }

    // ─── Core Functions ───────────────────────────────────────────────────────

    /**
     * @notice Purchase a parametric insurance policy
     * @param agentId Human-readable .0g domain identifier
     * @param policyType Type of insurance product
     * @param coverage Maximum payout in wei
     * @param durationDays Duration of coverage in days
     * @param storageCid 0G Storage CID for policy metadata blob
     */
    function buyPolicy(
        string calldata agentId,
        PolicyType policyType,
        uint256 coverage,
        uint256 durationDays,
        string calldata storageCid
    ) external payable returns (uint256 policyId) {
        require(msg.value > 0, "InsurAI: Premium required");
        require(coverage > 0, "InsurAI: Coverage must be > 0");
        require(coverage <= address(this).balance, "InsurAI: Insufficient pool liquidity");
        require(durationDays >= 1 && durationDays <= 365, "InsurAI: Invalid duration");
        require(bytes(agentId).length > 0, "InsurAI: Agent ID required");

        policyCount++;
        policyId = policyCount;

        uint256 protocolFee = (msg.value * PROTOCOL_FEE_BPS) / 10000;
        uint256 netPremium = msg.value - protocolFee;

        policies[policyId] = Policy({
            id: policyId,
            holder: msg.sender,
            agentId: agentId,
            policyType: policyType,
            coverage: coverage,
            premium: msg.value,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + (durationDays * 1 days),
            active: true,
            storageCid: storageCid
        });

        holderPolicies[msg.sender].push(policyId);
        totalPremiumsCollected += netPremium;

        // Transfer protocol fee to owner
        (bool sent,) = owner.call{value: protocolFee}("");
        require(sent, "InsurAI: Fee transfer failed");

        emit PolicyPurchased(policyId, msg.sender, agentId, policyType, coverage, msg.value, storageCid);
    }

    /**
     * @notice Submit a claim for an active policy
     * @param policyId The ID of the policy to claim on
     * @param evidenceCid 0G Storage CID of the uploaded claim evidence
     */
    function submitClaim(
        uint256 policyId,
        string calldata evidenceCid
    ) external policyExists(policyId) returns (uint256 claimId) {
        Policy storage policy = policies[policyId];

        require(policy.holder == msg.sender, "InsurAI: Not policy holder");
        require(policy.active, "InsurAI: Policy not active");
        require(block.timestamp <= policy.expiresAt, "InsurAI: Policy expired");
        require(policyActiveClaim[policyId] == 0, "InsurAI: Claim already pending");
        require(bytes(evidenceCid).length > 0, "InsurAI: Evidence CID required");

        claimCount++;
        claimId = claimCount;

        claims[claimId] = Claim({
            id: claimId,
            policyId: policyId,
            holder: msg.sender,
            evidenceCid: evidenceCid,
            status: ClaimStatus.Pending,
            submittedAt: block.timestamp,
            settledAt: 0,
            payout: 0,
            teeSignature: ""
        });

        holderClaims[msg.sender].push(claimId);
        policyActiveClaim[policyId] = claimId;

        emit ClaimSubmitted(claimId, policyId, msg.sender, evidenceCid);
    }

    /**
     * @notice Settle a claim using a TEE enclave signature
     * @dev The TEE enclave signs the hash of (claimId, policyId, holder, payout, approved)
     *      Only valid TEE signatures are accepted — verified on-chain
     * @param claimId The claim to settle
     * @param approved Whether the claim was approved by the AI model
     * @param payoutAmount Amount to pay out (0 if rejected)
     * @param teeSignature ECDSA signature from the registered TEE enclave
     */
    function settleClaim(
        uint256 claimId,
        bool approved,
        uint256 payoutAmount,
        bytes calldata teeSignature
    ) external claimExists(claimId) {
        Claim storage claim = claims[claimId];
        require(claim.status == ClaimStatus.Pending, "InsurAI: Claim not pending");

        Policy storage policy = policies[claim.policyId];
        if (approved) {
            require(payoutAmount > 0, "InsurAI: Payout must be > 0");
            require(payoutAmount <= policy.coverage, "InsurAI: Payout exceeds coverage");
        }

        // Verify TEE enclave signature
        bytes32 messageHash = keccak256(
            abi.encodePacked(
                "\x19Ethereum Signed Message:\n32",
                keccak256(abi.encodePacked(
                    claimId,
                    claim.policyId,
                    claim.holder,
                    payoutAmount,
                    approved
                ))
            )
        );

        address recovered = _recoverSigner(messageHash, teeSignature);
        require(recovered == teeSignerAddress, "InsurAI: Invalid TEE signature");

        claim.settledAt = block.timestamp;
        claim.teeSignature = teeSignature;
        policyActiveClaim[claim.policyId] = 0;

        if (approved) {
            require(address(this).balance >= payoutAmount, "InsurAI: Insufficient pool funds");

            claim.status = ClaimStatus.Paid;
            claim.payout = payoutAmount;
            policy.active = false;
            totalPayoutsReleased += payoutAmount;

            (bool sent,) = claim.holder.call{value: payoutAmount}("");
            require(sent, "InsurAI: Payout transfer failed");

            emit ClaimApproved(claimId, claim.policyId, claim.holder, payoutAmount, teeSignature);
        } else {
            claim.status = ClaimStatus.Rejected;
            emit ClaimRejected(claimId, claim.policyId, "AI model rejected claim");
        }
    }

    // ─── Admin Functions ──────────────────────────────────────────────────────

    /// @notice Deposit funds into the insurance pool
    function depositFunds() external payable onlyOwner {
        emit FundsDeposited(msg.sender, msg.value);
    }

    /// @notice Update the TEE enclave signer address
    function updateTeeSigner(address newSigner) external onlyOwner {
        require(newSigner != address(0), "InsurAI: Zero address");
        teeSignerAddress = newSigner;
        emit TeeSignerUpdated(newSigner);
    }

    // ─── View Functions ───────────────────────────────────────────────────────

    function getPolicy(uint256 policyId) external view returns (Policy memory) {
        return policies[policyId];
    }

    function getClaim(uint256 claimId) external view returns (Claim memory) {
        return claims[claimId];
    }

    function getHolderPolicies(address holder) external view returns (uint256[] memory) {
        return holderPolicies[holder];
    }

    function getHolderClaims(address holder) external view returns (uint256[] memory) {
        return holderClaims[holder];
    }

    function getPoolBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getStats() external view returns (
        uint256 _policyCount,
        uint256 _claimCount,
        uint256 _totalPremiums,
        uint256 _totalPayouts,
        uint256 _poolBalance
    ) {
        return (policyCount, claimCount, totalPremiumsCollected, totalPayoutsReleased, address(this).balance);
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

    function _recoverSigner(bytes32 messageHash, bytes memory sig) internal pure returns (address) {
        require(sig.length == 65, "InsurAI: Invalid signature length");
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
        if (v < 27) v += 27;
        require(v == 27 || v == 28, "InsurAI: Invalid v value");
        return ecrecover(messageHash, v, r, s);
    }

    receive() external payable {}
    fallback() external payable {}
}
