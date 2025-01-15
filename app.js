// Variabile globale
let provider, signer, contract;

// Configurație contract
const contractAddress = "0x81dE7cD4157946AEf50fF241a809829262A67620"; // Înlocuiește cu adresa contractului deployat
const contractABI = [
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "user",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "points",
                "type": "uint256"
            }
        ],
        "name": "addReputation",
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
        await provider.send("eth_requestAccounts", []); // Solicită permisiunea de a accesa conturile
        signer = provider.getSigner();

        // Afișează contul conectat
        const account = await signer.getAddress();
        console.log("Connected account:", account);
        document.getElementById("account").innerText = `Account: ${account}`;

        // Afișează balanța contului conectat
        const balance = await provider.getBalance(account);
        document.getElementById("balance").innerText = `Balance: ${ethers.utils.formatEther(balance)} ETH`;

        // Inițializează contractul
        contract = new ethers.Contract(contractAddress, contractABI, signer);

        // Redirecționează către pagina cu candidați
        window.location.href = "candidates.html"; // Asigură-te că această pagină există
    } catch (error) {
        console.error("Error connecting to MetaMask:", error);
        alert(`Failed to connect to MetaMask: ${error.message}`);
    }
});