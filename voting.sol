// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// [Cerinta opționala] Utilizare librarie - manipularea stringurilor
library StringUtils {
    function isEmpty(string memory str) internal pure returns (bool) {
        return bytes(str).length == 0;
    }
}

// [Cerință opțională] Utilizare interfata (OOP - Abstractizare)
// Interfata pentru votare
interface IVoting {
    function addCandidate(string calldata name) external;
    function vote(uint candidateId) external;
    function getAllCandidates() external view returns (string[] memory, uint[] memory);
}

// [Cerință obligatorie] Implementarea unui contract principal care interactionează cu o interfata
// Contract principal care implementeaza interfata IVoting
contract VotingSystem is IVoting {
    // Struct pentru candidați
    struct Candidate {
        string name;
        uint voteCount;
    }

    // [Cerință opțională] Utilizarea librăriei StringUtils
    using StringUtils for string;
    
    // [Cerință obligatorie]
    // 1. Utilizarea tipurilor de date specifice Solidity (mappings, address)
    mapping(address => bool) public hasVoted; // Evidenta voturilor
    mapping(uint => Candidate) public candidates; // Evidenta candidatilor

    // Variabile
    address public owner;
    uint public candidateCount;
    uint public votingStart;
    uint public votingEnd;
    
    // [Cerință obligatorie]
    // 2. Înregistrarea de events
    event CandidateRegistered(uint candidateId, string name);
    event VoteCast(address voter, uint candidateId);
    event FundsTransferred(address recipient, uint amount);

    // [Cerință obligatorie]
    // 3. Utilizarea de modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function");
        _;
    }

    modifier hasNotVoted() {
        require(!hasVoted[msg.sender], "You have already voted");
        _;
    }

    constructor(uint durationInMinutes) {
        owner = msg.sender;
        votingStart = block.timestamp;
        votingEnd = block.timestamp + (durationInMinutes * 1 minutes);
    }

    // Functie public: Adauga candidat
    function addCandidate(string calldata name) public override onlyOwner {
        require(!name.isEmpty(), "Candidate name cannot be empty");
        candidates[candidateCount] = Candidate(name, 0);
        emit CandidateRegistered(candidateCount, name);
        candidateCount++;
    }

    // Functie public: Voteaza
    function vote(uint candidateId) public override hasNotVoted {
        require(candidateId < candidateCount, "Invalid candidate ID");
        require(block.timestamp >= votingStart && block.timestamp < votingEnd, "Voting is not active");
        candidates[candidateId].voteCount++;
        hasVoted[msg.sender] = true;
        emit VoteCast(msg.sender, candidateId);
    }

    // // [Cerință obligatorie] Functie pentru transfer ETH
    function withdrawFunds(address payable recipient, uint amount) external onlyOwner {
        uint contractBalance = address(this).balance;
        require(contractBalance >= amount, "Insufficient balance in contract");
        recipient.transfer(amount);
        emit FundsTransferred(recipient, amount);
    }

    // Functie explicita pentru alimentarea contractului
    function fundContract() external payable onlyOwner {
        require(msg.value > 0, "Must send ETH to fund the contract");
    }

    // Functie pentru verificarea balanței contractului
    function getContractBalance() public view returns (uint) {
        return address(this).balance;
    }
    
    function getTotalVotes() public view returns (uint) {
    uint totalVotes = 0;
    for (uint i = 0; i < candidateCount; i++) {
        totalVotes += candidates[i].voteCount;
    }
    return totalVotes;
    }

    function calculateAverageVotes() public view returns (uint) {
        require(candidateCount > 0, unicode"Nu există candidați înregistrați.");
        uint totalVotes = getTotalVotes(); // Obține numărul total de voturi
        return totalVotes / candidateCount; // Calculează media
    }
    

     // Functie internal: Validare ID candidat
    function isValidCandidate(uint candidateId) internal view returns (bool) {
        return candidateId < candidateCount;
    }

    // [Cerință obligatorie] Functie fallback pentru a primi ETH
    receive() external payable {}

    // Functionalitate noua: Adaugare automata de candidați pentru testare - 4
    function addSampleCandidates() external onlyOwner {
        candidates[candidateCount] = Candidate("Candidate 1", 0);
        emit CandidateRegistered(candidateCount, "Candidate 1");
        candidateCount++;

        candidates[candidateCount] = Candidate("Candidate 2", 0);
        emit CandidateRegistered(candidateCount, "Candidate 2");
        candidateCount++;

        candidates[candidateCount] = Candidate("Candidate 3", 0);
        emit CandidateRegistered(candidateCount, "Candidate 3");
        candidateCount++;
    }

    // Functionalitate noua: Votare pentru testare
    function castSampleVotes() external {
        vote(0);
        vote(1);
        vote(2);
    }

    // Functionalitate noua: Vizualizare detalii pentru toți candidații
    function getAllCandidates() external view override returns (string[] memory, uint[] memory) {
        string[] memory names = new string[](candidateCount);
        uint[] memory votes = new uint[](candidateCount);
        for (uint i = 0; i < candidateCount; i++) {
            names[i] = candidates[i].name;
            votes[i] = candidates[i].voteCount;
        }
        return (names, votes);
    }

    // Functie view: Verificare status votare
    function getVotingStatus() private view returns (bool) {
        return (block.timestamp >= votingStart && block.timestamp < votingEnd);
    }

    // Functie view: Timp ramas pana la finalizarea votarii
    function getRemainingTime() public view returns (uint) {
        require(block.timestamp >= votingStart, "Voting has not started yet.");
        if (block.timestamp >= votingEnd) {
            return 0;
        }
        return votingEnd - block.timestamp;
    }
}

// [Cerință obligatorie] Interacțiune între smart contracte
// Contract secundar pentru interactiune - 6 
contract HelperContract {
    function getBalance(address contractAddress) external view returns (uint) {
        return contractAddress.balance;
    }
}
