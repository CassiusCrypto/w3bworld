// W3bWorld Game Definition using AGT

// Blockchain integration
const contractAddress = "0xa876eA30592a2576566C490360d2916F2D6ADf87"; // KhoynExchange contract address
const contractABI = [
    "function deposit() external payable",
    "function balanceOf(address account) external view returns (uint256)"
];

// Base Mainnet chain ID
const BASE_MAINNET_CHAIN_ID = 8453;

let provider;
let signer;
let contract;

// Initialize Web3 provider (MetaMask)
async function initWeb3(game) {
    // Ensure ethers is defined
    if (typeof ethers === "undefined") {
        game.output("Error: ethers.js is not loaded. Please refresh the page or check your internet connection.");
        return;
    }

    if (window.ethereum) {
        try {
            provider = new ethers.BrowserProvider(window.ethereum);
            await provider.send("eth_requestAccounts", []);

            // Check the network
            const network = await provider.getNetwork();
            if (Number(network.chainId) !== BASE_MAINNET_CHAIN_ID) {
                game.output(`Error: Please switch MetaMask to Base Mainnet (chain ID ${BASE_MAINNET_CHAIN_ID}). Current network: ${network.name} (chain ID ${network.chainId}).`);
                return;
            }

            signer = await provider.getSigner();
            // Get the connected wallet address
            const address = await signer.getAddress();
            // Explicitly resolve the contract address to avoid ENS lookup
            const resolvedAddress = ethers.getAddress(contractAddress);
            contract = new ethers.Contract(resolvedAddress, contractABI, signer);
            game.output("Connected to MetaMask on Base Mainnet.");

            // Update the UI to show the connected address
            const walletContainer = document.getElementById("walletContainer");
            walletContainer.innerHTML = `<div id="walletAddress">Connected: ${address}</div>`;
        } catch (error) {
            game.output(`Error connecting to MetaMask: ${error.message}`);
            return;
        }
    } else {
        game.output("Please install MetaMask to use blockchain features.");
    }
}


// Mint Khoyn by depositing ETH
async function mintKhoyn(arg, game) {
    if (!contract) {
        game.output("Please connect to MetaMask first using the 'Connect to MetaMask' button.");
        return;
    }
    try {
        const ethAmount = ethers.parseEther("0.0001"); // Deposit 0.0001 ETH
        const tx = await contract.deposit({ value: ethAmount });
        game.output("Minting Khoyn... Waiting for transaction confirmation.");
        await tx.wait();
        game.output("Successfully minted Khoyn!");
    } catch (error) {
        game.output(`Error minting Khoyn: ${error.message}`);
        if (error.code === "INSUFFICIENT_FUNDS") {
            game.output("You don't have enough ETH to mint Khoyn. You need at least 0.0001 ETH plus gas fees.");
        }
    }
}

// Check Khoyn balance
async function checkBalance(arg, game) {
    if (!contract) {
        game.output("Please connect to MetaMask first using the 'Connect to MetaMask' button.");
        return;
    }
    try {
        const address = await signer.getAddress();
        const balance = await contract.balanceOf(address);
        game.output(`Your Khoyn balance: ${ethers.formatEther(balance)} KHOYN`);
    } catch (error) {
        game.output(`Error checking balance: ${error.message}`);
    }
}

// Game data for W3bWorld
const gameData = {
    startRoom: "atrium",
    rooms: {
        chair: {
            description: "You are in a small room containing a padded chair set into the wall.",
            exits: { north: "atrium", east: "terminal" },
            items: { chair: "The chair has a headrest that is covered in electrodes. On the arm of the chair there is a keypad with a green button." }
        },
        atrium: {
            description: "You are standing in a white room. A locked door lies to the east. A broad window with thick plexiglass faces outside.",
            exits: { south: "chair", east: "secret_room" },
            items: { door: "The door is locked." },
            conditions: {
                east: { item: "key", message: "You should not go that way. The door is locked because the entropy outside has become dangerously high." }
            },
            useActions: {
                key: {
                    door: (game) => {
                        game.output("You unlock the door with the key.");
                        game.inventory = game.inventory.filter(i => i !== "key");
                        delete game.rooms.atrium.conditions.east; // Unlock the door
                    }
                }
            }
        },
        secret_room: {
            description: "A hidden room with ancient runes.",
            exits: { west: "atrium" },
            items: {}
        },
        terminal: {
            description: "You are in a room lit only by the light of a dusty computer terminal. A stack of datacubes lies on the table.",
            exits: { west: "chair" },
            items: { datacube: "Beneath the shifting translucent surface of the datacube, thousands of petabytes of data can be stored at the subatomic level." }
        }
    },
    customCommands: {
        "mint": (arg, game) => {
            if (arg === "khoyn") mintKhoyn(arg, game);
            else game.output("Use 'mint khoyn' to mint Khoyn tokens.");
        },
        "check": (arg, game) => {
            if (arg === "balance") checkBalance(arg, game);
            else game.output("Use 'check balance' to check your Khoyn balance.");
        },
        "shout": (arg, game) => {
            game.output("Your voice echoes in the room, but nothing happens.");
        },
        "light": (arg, game) => {
            if (arg === "torch" && game.currentRoom === "atrium") {
                game.output("You light a torch, revealing the atrium's details.");
            } else {
                game.output("There's no need to light a torch here.");
            }
        }
    }
};

// Initialize the game with AGT
const game = new AGT(gameData);

// Add event listener for the Connect to MetaMask button
document.getElementById("connectButton").addEventListener("click", () => {
    initWeb3(game);
});

// Initialize Web3 provider (MetaMask)
async function initWeb3(game) {
    // Ensure ethers is defined
    if (typeof ethers === "undefined") {
        game.output("Error: ethers.js is not loaded. Please refresh the page or check your internet connection.");
        return;
    }

    if (window.ethereum) {
        try {
            provider = new ethers.BrowserProvider(window.ethereum);
            await provider.send("eth_requestAccounts", []);

            // Check the network
            const network = await provider.getNetwork();
            if (Number(network.chainId) !== BASE_MAINNET_CHAIN_ID) {
                game.output(`Error: Please switch MetaMask to Base Mainnet (chain ID ${BASE_MAINNET_CHAIN_ID}). Current network: ${network.name} (chain ID ${network.chainId}).`);
                return;
            }

            signer = await provider.getSigner();
            // Get the connected wallet address
            const address = await signer.getAddress();
            // Explicitly resolve the contract address to avoid ENS lookup
            const resolvedAddress = ethers.getAddress(contractAddress);
            contract = new ethers.Contract(resolvedAddress, contractABI, signer);
            game.output("Connected to MetaMask on Base Mainnet.");

            // Update the AGT instance with contract and signer
            game.setBlockchainContext(contract, signer);

            // Update the UI to show the connected address
            const walletContainer = document.getElementById("walletContainer");
            walletContainer.innerHTML = `<div id="walletAddress">Connected: ${address}</div>`;
        } catch (error) {
            game.output(`Error connecting to MetaMask: ${error.message}`);
            return;
        }
    } else {
        game.output("Please install MetaMask to use blockchain features.");
    }
}