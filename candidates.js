// Variabile globale
let provider, signer, contract;

// Configurație contract
const contractAddress = "0x81dE7cD4157946AEf50fF241a809829262A67620"; // Adresa contractului din Remix
const contractABI = [
    {
        "inputs": [],
        "name": "getAllCandidates",
        "outputs": [
            { "internalType": "string[]", "name": "", "type": "string[]" },
            { "internalType": "uint[]", "name": "", "type": "uint[]" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getRemainingTime",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "candidateId", "type": "uint256" }],
        "name": "vote",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

// Inițializare MetaMask și contract
async function initialize() {
    if (typeof window.ethereum === "undefined") {
        alert("MetaMask nu este instalat!");
        return;
    }

    provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();
    contract = new ethers.Contract(contractAddress, contractABI, signer);

    const account = await signer.getAddress();
        console.log("Connected account:", account);
        document.getElementById("account").innerText = `Account: ${account}`;
        
    // Încarcă informațiile inițiale
    await loadCandidates(); // Încarcă candidații din contract
    await loadRemainingTime(); // Afișează timpul rămas
}

// Încarcă candidații din contractul inteligent
async function loadCandidates() {
    try {
        const [names, votes] = await contract.getAllCandidates();

        // Actualizează tabelul și meniul dropdown
        const tableBody = document.getElementById("candidatesTable");
        const candidateSelect = document.getElementById("candidateSelect");

        tableBody.innerHTML = ""; // Curăță tabelul
        candidateSelect.innerHTML = '<option value="" disabled selected>Select a candidate</option>'; // Curăță dropdown-ul

        for (let i = 0; i < names.length; i++) {
            // Adaugă candidați în tabel
            const row = document.createElement("tr");

            const idCell = document.createElement("td");
            idCell.innerText = i;
            row.appendChild(idCell);

            const nameCell = document.createElement("td");
            nameCell.innerText = names[i];
            row.appendChild(nameCell);

            const voteCell = document.createElement("td");
            voteCell.innerText = votes[i];
            row.appendChild(voteCell);

            tableBody.appendChild(row);

            // Adaugă candidați în dropdown
            const option = document.createElement("option");
            option.value = i;
            option.innerText = names[i];
            candidateSelect.appendChild(option);
        }
    } catch (error) {
        console.error("Eroare la încărcarea candidaților din contract:", error);
    }
}

// Afișează timpul rămas pentru votare
async function loadRemainingTime() {
    try {
        const remainingTime = await contract.getRemainingTime();
        document.getElementById("remainingTime").innerText = `Remaining Time: ${remainingTime}`;
    } catch (error) {
        console.error("Eroare la obținerea timpului rămas:", error);
    }
}

// Votează pentru un candidat selectat
async function castVote() {
    const candidateId = document.getElementById("candidateSelect").value;
    if (!candidateId) {
        alert("Selectați un candidat înainte de a vota.");
        return;
    }

    try {
        const tx = await contract.vote(candidateId);
        alert(`Tranzacția a fost trimisă: ${tx.hash}`);
        await tx.wait();
        alert("Votul a fost înregistrat!");

        // Actualizează tabelul cu candidați după vot
        await loadCandidates();
    } catch (error) {
        console.error("Eroare la votare:", error);
    }
}

// Adaugă eveniment pentru butonul de votare
document.getElementById("voteButton").addEventListener("click", castVote);

// Inițializează aplicația
initialize();