// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract JusticeChain {

    /* ========== ADMIN ========== */
    address public admin;

    constructor() {
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin allowed");
        _;
    }

    modifier onlyPolice() {
        require(police[msg.sender], "Only police allowed");
        _;
    }

    modifier onlyForensic() {
        require(forensic[msg.sender], "Only forensic allowed");
        _;
    }

    modifier onlyJudge() {
        require(judge[msg.sender], "Only judge allowed");
        _;
    }

    /* ========== ROLE REGISTRY ========== */
    mapping(address => bool) public police;
    mapping(address => bool) public forensic;
    mapping(address => bool) public judge;

    function registerPolice(address _addr) public onlyAdmin {
        police[_addr] = true;
    }

    function registerForensic(address _addr) public onlyAdmin {
        forensic[_addr] = true;
    }

    function registerJudge(address _addr) public onlyAdmin {
        judge[_addr] = true;
    }

    /* ========== DATA STRUCTURES ========== */

    struct CaseFile {
        uint caseId;
        address policeOfficer;
        address forensicOfficer;
        address judgeOfficer;
        bool approved;
        bool closed;
    }

    struct Evidence {
        string ipfsHash;
        bytes32 hash;
        address uploadedBy;
        uint timestamp;
    }

    struct ForensicReport {
        string ipfsHash;
        bytes32 hash;
        address forensicOfficer;
        uint timestamp;
    }

    struct Verdict {
        string decision;
        address judgeOfficer;
        uint timestamp;
    }

    struct AccessLog {
        address user;
        uint timestamp;
    }

    /* ========== STORAGE ========== */

    mapping(uint => CaseFile) public cases;
    mapping(uint => Evidence[]) public evidences;
    mapping(uint => ForensicReport) public reports;
    mapping(uint => Verdict) public verdicts;
    mapping(uint => AccessLog[]) public accessLogs;

    uint public totalCases;

    /* ========== EVENTS ========== */

    event CaseCreated(uint caseId, address police);
    event CaseApproved(uint caseId);
    event EvidenceAdded(uint caseId, string ipfsHash);
    event ForensicSubmitted(uint caseId, string ipfsHash);
    event VerdictGiven(uint caseId, string decision);
    event Accessed(uint caseId, address user);

    /* ========== POLICE FUNCTIONS ========== */

    function createCase() public onlyPolice {
        totalCases++;

        cases[totalCases] = CaseFile({
            caseId: totalCases,
            policeOfficer: msg.sender,
            forensicOfficer: address(0),
            judgeOfficer: address(0),
            approved: false,
            closed: false
        });

        emit CaseCreated(totalCases, msg.sender);
    }

    function addEvidence(uint caseId, string memory ipfsHash) public onlyPolice {
        require(cases[caseId].approved, "Case not approved");
        require(!cases[caseId].closed, "Case closed");

        bytes32 fileHash = keccak256(abi.encodePacked(ipfsHash));

        evidences[caseId].push(
            Evidence(ipfsHash, fileHash, msg.sender, block.timestamp)
        );

        emit EvidenceAdded(caseId, ipfsHash);
    }

    /* ========== ADMIN FUNCTIONS ========== */

    function approveCase(uint caseId) public onlyAdmin {
        cases[caseId].approved = true;
        emit CaseApproved(caseId);
    }

    function assignCase(
        uint caseId,
        address forensicAddr,
        address judgeAddr
    ) public onlyAdmin {
        require(forensic[forensicAddr], "Not forensic");
        require(judge[judgeAddr], "Not judge");

        cases[caseId].forensicOfficer = forensicAddr;
        cases[caseId].judgeOfficer = judgeAddr;
    }

    /* ========== FORENSIC FUNCTIONS ========== */

    function submitForensicReport(uint caseId, string memory ipfsHash)
        public onlyForensic
    {
        require(cases[caseId].forensicOfficer == msg.sender, "Not assigned");
        require(!cases[caseId].closed, "Case closed");

        bytes32 reportHash = keccak256(abi.encodePacked(ipfsHash));

        reports[caseId] = ForensicReport(
            ipfsHash,
            reportHash,
            msg.sender,
            block.timestamp
        );

        emit ForensicSubmitted(caseId, ipfsHash);
    }

    /* ========== JUDGE FUNCTIONS ========== */

    function giveVerdict(uint caseId, string memory decision)
        public onlyJudge
    {
        require(cases[caseId].judgeOfficer == msg.sender, "Not assigned");
        require(reports[caseId].timestamp > 0, "Forensic not submitted");

        verdicts[caseId] = Verdict(
            decision,
            msg.sender,
            block.timestamp
        );

        cases[caseId].closed = true;

        emit VerdictGiven(caseId, decision);
    }

    /* ========== ACCESS LOGGING ========== */

    function logAccess(uint caseId) public {
        accessLogs[caseId].push(
            AccessLog(msg.sender, block.timestamp)
        );
        emit Accessed(caseId, msg.sender);
    }

    /* ========== VERIFICATION FUNCTIONS ========== */

    function verifyEvidence(uint caseId, uint index)
        public view returns (bytes32)
    {
        return evidences[caseId][index].hash;
    }

    function verifyReport(uint caseId)
        public view returns (bytes32)
    {
        return reports[caseId].hash;
    }

    /* ========== VIEW HELPERS ========== */

    function getEvidenceCount(uint caseId)
        public view returns (uint)
    {
        return evidences[caseId].length;
    }

    function getAccessLogCount(uint caseId)
        public view returns (uint)
    {
        return accessLogs[caseId].length;
    }
}
