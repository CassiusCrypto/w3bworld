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
            walletContainer.innerHTML = `<div id="walletAddress">Connected: ${address.slice(0, 4)}...${address.slice(-4)}</div>`;
        } catch (error) {
            game.output(`Error connecting to MetaMask: ${error.message}`);
            return;
        }
    } else {
        game.output("Please install MetaMask to use blockchain features.");
    }
}


// Game data for W3bWorld
const gameData = {
    conditions: { // Define initial conditions here
        atriumDoorUnlocked: false,
        datacubeInserted: false
    },
    commands: { // Define bespoke commands here
        type: {
            execute: (agt, arg) => {
                if (agt.currentRoom !== "terminal") {
                    agt.output("You need to be at the terminal to type commands.");
                    return;
                }
                const room = agt.rooms[agt.currentRoom];
                if (!room.objects || !room.objects["terminal"]) {
                    agt.output("There is no terminal here to type on.");
                    return;
                }
                if (arg !== "unlock") {
                    agt.output("You can type 'unlock' at the terminal to unlock the atrium door.");
                    return;
                }
                if (agt.conditions.atriumDoorUnlocked) {
                    agt.output("The door in the atrium is already unlocked.");
                } else {
                    agt.conditions.atriumDoorUnlocked = true;
                    agt.output("You type 'unlock' into the terminal. The door in the atrium is now unlocked.");
                }
            }
        },
        insert: {
            execute: (agt, arg) => {
                if (agt.currentRoom !== "terminal") {
                    agt.output("You need to be at the terminal to insert a datacube into the drive.");
                    return;
                }
                const room = agt.rooms[agt.currentRoom];
                if (!room.objects || !room.objects["drive"]) {
                    agt.output("There is no drive here to insert a datacube into.");
                    return;
                }
                if (arg !== "datacube") {
                    agt.output("You need to insert a datacube into the drive.");
                    return;
                }
                if (!agt.inventory.some(i => i.name === "datacube")) {
                    agt.output("You don't have a datacube.");
                    return;
                }
                if (agt.conditions.datacubeInserted) {
                    agt.output("A datacube is already inserted in the drive.");
                    return;
                }
                agt.inventory = agt.inventory.filter(i => i.name !== "datacube");
                agt.conditions.datacubeInserted = true;
                agt.output("You insert the datacube into the drive. The scanner in the adjacent room is now active.");
            }
        }
    },		
    startRoom: "atrium",
    rooms: {
        scanner: {
            description: "You are in a small room containing a medical scanner.",
            exits: { north: "atrium", east: "terminal" },
            objects: { scanner: "The scanner contains a couch. On the outside of the scanner there is a 2cm square recess. Inside the scanner is a green button." },
            items: {}			
        },
        atrium: {
            description: "You are standing in a white room. A heavy metal door lies to the east. A broad window faces out onto a decaying city.",
            exits: { 
                south: "scanner", 
                east: {
					room: "outside",
                    condition: "atriumDoorUnlocked",
                    message: "The door is locked because the entropy outside is dangerously high. It can only be unlocked electronically."
                }					
            },
            items: {},
            objects: { door: "The door is electronically locked and has no keyhole or keypad. It has a thick seal around the edge.", window: "The window is made from 5cm-thick reinforced glass." },
        },
        outside: {
		    description: "You are outside of the secure enclave. Entropy is dangerously high. Electromagnetic radiation interfering with your brain activity causes pulses of light behind your eyes. You feel your heart go into arrhythmia.<p>",
            fatal: true,
            exits: {},
            objects: {},
            items: {}			
        },			
        terminal: {
            description: "You are in a room lit only by the light of a dusty computer terminal.",
            exits: { west: "scanner" },
            items: { datacube: "Beneath the shifting translucent surface of the datacube, thousands of petabytes of data can be stored at the subatomic level." },
            objects: { terminal: "The terminal is a Quantech 4 model with an Optical Drive for ultra-high-volume data transfer.", drive: "The Drive has a square recess, 2cm on each side, designed to accept a standard datacube."},
            itemArt: { datacube: "datacube" }
        }
    },

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
            walletContainer.innerHTML = `<div id="walletAddress">Connected: ${address.slice(0, 4)}...${address.slice(-4)}</div>`;
        } catch (error) {
            game.output(`Error connecting to MetaMask: ${error.message}`);
            return;
        }
    } else {
        game.output("Please install MetaMask to use blockchain features.");
    }
}