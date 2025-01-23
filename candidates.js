// Variabile globale
let provider, signer, contract;

// Configurație contract
const contractAddress = "0xa0Cf0c43b64E85578C34a07252E973AB6a59c032"; // Adresa contractului din Remix
const contractABI = [
    // ABI-ul contractului (copiat din Remix)
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
    },
    {
        "inputs": [{ "internalType": "string", "name": "name", "type": "string" }],
        "name": "addCandidate",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "candidateCount",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
        "name": "hasVoted",
        "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "fundContract",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "address payable", "name": "recipient", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }],
        "name": "withdrawFunds",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getContractBalance",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "calculateAverageVotes",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

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
          // Afișează media voturilor
          await displayAverageVotes();
    } catch (error) {
        console.error("Eroare la încărcarea candidaților din contract:", error);
    }
}

// Afișează timpul rămas pentru votare
async function loadRemainingTime() {
    try {
        const remainingTime = await contract.getRemainingTime();
        document.getElementById("remainingTime").innerText = `Remaining Time: ${remainingTime} seconds`;
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
        // Afișează spinner-ul
        document.getElementById("loadingSpinner").style.display = "block";

        // Estimează gazul necesar pentru tranzacție
        const estimatedGas = await estimateGasForVote(candidateId);
        const gasPrice = await provider.getGasPrice();
        const gasCost = ethers.utils.formatEther(estimatedGas.mul(gasPrice));

        // Afișează costul estimat al gazului
        const confirmVote = confirm(`Costul estimat al gazului este: ${gasCost} ETH. Continuați cu votul?`);
        if (!confirmVote) {
            document.getElementById("loadingSpinner").style.display = "none"; // Ascunde spinner-ul
            return; // Anulează dacă utilizatorul nu confirmă
        }

        // Trimite tranzacția cu limita de gaz estimată
        const tx = await contract.vote(candidateId, { gasLimit: estimatedGas.add(10000) });
        alert(`Tranzacția a fost trimisă: ${tx.hash}`);

        // Așteaptă confirmarea tranzacției
        const receipt = await tx.wait();
        if (receipt.status === 1) {
            alert("Votul a fost înregistrat cu succes!");
        } else {
            alert("Tranzacția a eșuat!");
        }

        // Reîncarcă lista de candidați după vot
        await loadCandidates();
    } catch (error) {
        console.error("Eroare la votare:", error);
        alert(`Eroare la votare: ${error.message}`);
    } finally {
        // Ascunde spinner-ul
        document.getElementById("loadingSpinner").style.display = "none";
    }
}

// Adaugă un candidat (doar pentru owner)
async function addCandidate() {
    const candidateName = prompt("Introduceți numele candidatului:");
    if (!candidateName) {
        alert("Numele candidatului nu poate fi gol!");
        return;
    }

    try {
        const tx = await contract.addCandidate(candidateName);
        alert(`Tranzacția a fost trimisă: ${tx.hash}`);
        await tx.wait();
        alert("Candidatul a fost adăugat!");

        // Reîncarcă lista de candidați
        await loadCandidates();
    } catch (error) {
        console.error("Eroare la adăugarea candidatului:", error);
        alert(`Eroare la adăugarea candidatului: ${error.message}`);
    }
}

// Afișează butonul "Add Candidate" doar pentru owner
// Verifică dacă utilizatorul este owner și afișează butoanele corespunzătoare
async function checkOwner() {
    const ownerAddress = "0x8f20c1Da4189E61A9bED3DBc9Cc3b913520dFA4D"; // Adresa owner-ului
    const account = await signer.getAddress();

    if (account.toLowerCase() === ownerAddress.toLowerCase()) {
        document.getElementById("addCandidateButton").style.display = "block";
        document.getElementById("fundContractButton").style.display = "block";
        document.getElementById("withdrawFundsButton").style.display = "block";
        document.getElementById("ownerStatus").innerText = "Acest cont este owner.";
    } else {
        document.getElementById("addCandidateButton").style.display = "none";
        document.getElementById("fundContractButton").style.display = "none";
        document.getElementById("withdrawFundsButton").style.display = "none";
        document.getElementById("ownerStatus").innerText = "Acest cont nu este owner.";
    }
}

// Afișează numărul de candidați
async function loadCandidateCount() {
    try {
        const count = await contract.candidateCount();
        document.getElementById("candidateCount").innerText = `Număr candidați: ${count}`;
    } catch (error) {
        console.error("Eroare la obținerea numărului de candidați:", error);
    }
}

// Verifică dacă utilizatorul curent a votat
async function checkHasVoted() {
    try {
        const account = await signer.getAddress();
        const hasVotedStatus = await contract.hasVoted(account);
        document.getElementById("hasVoted").innerText = `Ați votat: ${hasVotedStatus ? "Da" : "Nu"}`;
    } catch (error) {
        console.error("Eroare la verificarea votului:", error);
    }
}

// Inițializare MetaMask și contract
async function initialize() {
    if (typeof window.ethereum === "undefined") {
        alert("MetaMask nu este instalat!");
        return;
    }

    try {
        // Conectare la MetaMask
        provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []); // Solicită permisiunea de a accesa conturile
        signer = provider.getSigner();
        contract = new ethers.Contract(contractAddress, contractABI, signer);

        const account = await signer.getAddress();
        console.log("Connected account:", account);
        document.getElementById("account").innerText = `Account: ${account}`;

        // Încarcă informațiile inițiale
        await loadCandidates(); // Încarcă candidații din contract
        await loadRemainingTime(); // Afișează timpul rămas
        await loadCandidateCount(); // Afișează numărul de candidați
        await checkHasVoted(); // Verifică dacă utilizatorul a votat
        await checkOwner(); // Verifică dacă utilizatorul este owner
        await loadContractBalance(); // Încarcă balanța contractului
        // Ascultă evenimentele
        listenToEvents(); 
    } catch (error) {
        console.error("Eroare la inițializare:", error);
        alert(`Eroare la inițializare: ${error.message}`);
    }
}

// Funcție pentru alimentarea contractului cu ETH
async function fundContract() {
    const amount = prompt("Introduceți suma de ETH pe care doriți să o trimiteți către contract:");
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
        alert("Introduceți o sumă validă de ETH!");
        return;
    }

    try {
        const tx = await contract.fundContract({
            value: ethers.utils.parseEther(amount) // Convertim ETH în wei
        });
        alert(`Tranzacția a fost trimisă: ${tx.hash}`);
        await tx.wait();
        alert(`Contractul a fost alimentat cu ${amount} ETH!`);

        // Actualizează balanța contractului
        await loadContractBalance();
    } catch (error) {
        console.error("Eroare la alimentarea contractului:", error);
        alert(`Eroare la alimentarea contractului: ${error.message}`);
    }
}
// Afișează balanța contractului doar pentru owner
async function loadContractBalance() {
    const ownerAddress = "0x8f20c1Da4189E61A9bED3DBc9Cc3b913520dFA4D"; // Adresa owner-ului
    const account = await signer.getAddress();

    if (account.toLowerCase() === ownerAddress.toLowerCase()) {
        try {
            const balance = await contract.getContractBalance();
            const balanceInETH = ethers.utils.formatEther(balance); // Convertim din wei în ETH
            document.getElementById("contractBalance").innerText = `Balanța contractului: ${balanceInETH} ETH`;
        } catch (error) {
            console.error("Eroare la obținerea balanței contractului:", error);
            document.getElementById("contractBalance").innerText = "Balanța contractului: Eroare";
        }
    } else {
        document.getElementById("contractBalance").innerText = "Balanța contractului: Disponibilă doar pentru owner.";
    }
}
// Funcție pentru retragerea fondurilor din contract
async function withdrawFunds() {
    const recipient = prompt("Introduceți adresa destinatarului:");
    if (!ethers.utils.isAddress(recipient)) {
        alert("Adresa introdusă nu este validă!");
        return;
    }

    const amount = prompt("Introduceți suma de ETH pe care doriți să o retrageți:");
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
        alert("Introduceți o sumă validă de ETH!");
        return;
    }

    try {
        const tx = await contract.withdrawFunds(recipient, ethers.utils.parseEther(amount));
        alert(`Tranzacția a fost trimisă: ${tx.hash}`);
        await tx.wait();
        alert(`Fondurile au fost retrase către ${recipient}!`);

        // Actualizează balanța contractului
        await loadContractBalance();
    } catch (error) {
        console.error("Eroare la retragerea fondurilor:", error);
        alert(`Eroare la retragerea fondurilor: ${error.message}`);
    }
}

async function listenToEvents() {
    // Ascultă evenimentul "VoteCast"
    contract.on("VoteCast", (voter, candidateId, event) => {
        console.log(`Vot înregistrat: ${voter} a votat pentru candidatul ${candidateId}`);
        alert(`Vot înregistrat: ${voter} a votat pentru candidatul ${candidateId}`);
    });

    // Ascultă evenimentul "CandidateRegistered"
    contract.on("CandidateRegistered", (candidateId, name, event) => {
        console.log(`Candidat adăugat: ${name} cu ID-ul ${candidateId}`);
        loadCandidates(); // Reîncarcă lista de candidați
    });
}

async function estimateGasForVote(candidateId) {
    try {
        const estimatedGas = await contract.estimateGas.vote(candidateId);
        console.log(`Gaz estimat pentru vot: ${estimatedGas.toString()}`);
        return estimatedGas;
    } catch (error) {
        console.error("Eroare la estimarea gazului:", error);
        throw error;
    }
}

async function displayAverageVotes() {
    try {
        const averageVotes = await contract.calculateAverageVotes();
        const candidateCount = await contract.candidateCount();

        // Calculează media cu zecimale
        const average = averageVotes / candidateCount;

        // Afișează media cu 2 zecimale
        document.getElementById("averageVotes").innerText = `Media voturilor per candidat: ${average.toFixed(2)}`;
    } catch (error) {
        console.error("Eroare la calcularea mediei voturilor:", error);
        alert(`Eroare la calcularea mediei voturilor: ${error.message}`);
    }
}


// Apelează funcția după inițializare
initialize().then(() => {
    displayAverageVotes();
});


// Adaugă eveniment pentru butonul de votare
document.getElementById("voteButton").addEventListener("click", castVote);

/*
// Buton pentru reîncărcarea listei de candidați
document.getElementById("refreshButton").addEventListener("click", async () => {
    await loadCandidates();
});
*/

// Eveniment pentru butonul "Fund Contract"
document.getElementById("fundContractButton").addEventListener("click", fundContract);

// Eveniment pentru butonul "Withdraw Funds"
document.getElementById("withdrawFundsButton").addEventListener("click", withdrawFunds);

// Eveniment pentru butonul "Add Candidate"
document.getElementById("addCandidateButton").addEventListener("click", addCandidate);

// Inițializează aplicația
initialize();