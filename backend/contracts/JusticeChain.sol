// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract JusticeChain {

    /* ========== ADMIN ========== */
    address public admin;
    address public backend;

    constructor() {
        admin = msg.sender;
        backend = msg.sender; // Backend can also register roles initially
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin allowed");
        _;
    }

    modifier onlyAdminOrBackend() {
        require(msg.sender == admin || msg.sender == backend, "Only admin or backend allowed");
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

    /* ========== EVENTS ========== */
    event RoleRegistered(address indexed wallet, string role);
    event BackendAddressUpdated(address newBackend);

    /* ========== ADMIN FUNCTIONS ========== */
    function setBackendAddress(address _backend) public onlyAdmin {
        backend = _backend;
        emit BackendAddressUpdated(_backend);
    }

    /* ========== ROLE REGISTRY ========== */
    mapping(address => bool) public police;
    mapping(address => bool) public forensic;
    mapping(address => bool) public judge;

    function registerPolice(address _addr) public onlyAdminOrBackend {
        require(_addr != address(0), "Invalid address");
        police[_addr] = true;
        emit RoleRegistered(_addr, "POLICE");
    }

    function registerForensic(address _addr) public onlyAdminOrBackend {
        require(_addr != address(0), "Invalid address");
        forensic[_addr] = true;
        emit RoleRegistered(_addr, "FORENSIC");
    }

    function registerJudge(address _addr) public onlyAdminOrBackend {
        require(_addr != address(0), "Invalid address");
        judge[_addr] = true;
        emit RoleRegistered(_addr, "JUDGE");
    }

    // Batch registration for multiple users
    function registerMultiplePolice(address[] calldata _addresses) public onlyAdminOrBackend {
        for (uint i = 0; i < _addresses.length; i++) {
            require(_addresses[i] != address(0), "Invalid address");
            police[_addresses[i]] = true;
            emit RoleRegistered(_addresses[i], "POLICE");
        }
    }

    function registerMultipleForensic(address[] calldata _addresses) public onlyAdminOrBackend {
        for (uint i = 0; i < _addresses.length; i++) {
            require(_addresses[i] != address(0), "Invalid address");
            forensic[_addresses[i]] = true;
            emit RoleRegistered(_addresses[i], "FORENSIC");
        }
    }

    function registerMultipleJudge(address[] calldata _addresses) public onlyAdminOrBackend {
        for (uint i = 0; i < _addresses.length; i++) {
            require(_addresses[i] != address(0), "Invalid address");
            judge[_addresses[i]] = true;
            emit RoleRegistered(_addresses[i], "JUDGE");
        }
    }

    // Check if wallet has any role
    function hasAnyRole(address _addr) public view returns (bool) {
        return police[_addr] || forensic[_addr] || judge[_addr];
    }

    // Get user's role (returns empty string if no role)
    function getUserRole(address _addr) public view returns (string memory) {
        if (police[_addr]) return "POLICE";
        if (forensic[_addr]) return "FORENSIC";
        if (judge[_addr]) return "JUDGE";
        return "NONE";
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
