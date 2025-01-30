// Variabile globale
let provider, signer, contract;

// Configurație contract
const contractAddress = "0xf39a9bD7f14689d5EA86D57cBBC073F1a711cf35"; // Înlocuiește cu adresa contractului pe care s-a dat deploy
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
    }
];

// Eveniment pentru conectare la MetaMask
document.getElementById("connect").addEventListener("click", async () => {
    console.log("Connect button clicked");

    if (typeof window.ethereum === "undefined") {
        alert("MetaMask is not installed. Please install MetaMask and try again.");
        return;
    }

    try {
        // Conectare la MetaMask
        provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []); // Solicita permisiunea de a accesa conturile
        signer = provider.getSigner();

        // Afiseaza contul conectat
        const account = await signer.getAddress();
        console.log("Connected account:", account);
        document.getElementById("account").innerText = `Account: ${account}`;

        // Afiseaza balanta contului conectat
        const balance = await provider.getBalance(account);
        document.getElementById("balance").innerText = `Balance: ${ethers.utils.formatEther(balance)} ETH`;

        // Initializeaza contractul
        contract = new ethers.Contract(contractAddress, contractABI, signer);

        // Redirectioneaza catre pagina cu candidati
        window.location.href = "candidates.html"; 
    } catch (error) {
        console.error("Error connecting to MetaMask:", error);
        alert(`Failed to connect to MetaMask: ${error.message}`);
    }
});