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
                if (!["unlock", "help", "upload", "sudo unlock"].includes(arg)) {
                    agt.output("Recognized commands include 'upload', 'unlock', 'lock', 'help'.");
                    return;
                }
                if (arg === "help") {
                    // Placeholder for help subcommand
                    agt.output("Terminal Help:<br><i>My name's Carter, and if you're reading this, you're a Porter like me, which means you're going to need all the help you can get. I managed to hack a message into the console on one of my brief return journeys.<br>You need to remember that everything you see is real. The fact that this is simulation doesn't change that. When you can manipulate the fabric of reality then there's no difference between reality and simulation. It's just a shame we started tampering with the universe before we properly understood it. Stay safe and Godspeed. I guess it's possible I'll see you in 'there', somewhere, but the odds of us overlapping are remote and the odds I'm already dead are high. I'm sorry, but those are the risks we all take.</i><p>Recognized commands include 'upload', 'unlock', 'help'.");
                    return;
                }
                if (arg === "upload") {
                    if (agt.conditions.soulCubeInserted) {
                        agt.output("You type 'upload' into the terminal. Your memories and neural connections are uploaded into the quantum firmament, allowing you to port to an infinite universe of real and simulated existences. To access these you need to mint a Qkey. This is an on-chain operation.");
                        // Optionally reset soulCubeInserted or trigger a new condition
                    } else if (agt.conditions.datacubeInserted) {
                        agt.output("You type 'upload' into the terminal. Nothing happens.");
                    } else {
                        agt.output("You type 'upload' into the terminal. Nothing happens.");
                    }
                    return;
                }				
                if (arg === "unlock") {
                    agt.output("Permission denied.");	
                    return;				   
                }				   
                if (arg === "sudo unlock") {
                    if (agt.conditions.atriumDoorUnlocked) {
                        agt.output("The door in the atrium is already unlocked.");
                    } else {
                        agt.conditions.atriumDoorUnlocked = true;
                        agt.output("You type 'sudo unlock' into the terminal. You hear the whine of servo motors and the sound of heavy bolts moving in the next room. A klaxon begins to sound throughout the building and a red light starts flashing.");
                    }
                    return;
				}
            }
        },
        insert: {
            execute: (agt, arg) => {
                // Check if the player is in a room where inserting is allowed
                if (!["terminal", "scanner"].includes(agt.currentRoom)) {
                    agt.output("There is nowhere to place that here.");
                    return;
                }

                const room = agt.rooms[agt.currentRoom];
                // Check for the appropriate object based on the room and item
                if (agt.currentRoom === "terminal") {
                    if (!room.objects || !room.objects["drive"]) {
                        agt.output("There is no drive here to insert that into.");
                        return;
                    }
                } else if (agt.currentRoom === "scanner") {
                    if (!room.objects || !room.objects["scanner"]) {
                        agt.output("There is nowhere here to insert that.");
                        return;
                    }
                }

                // Check if the argument is valid ("datacube" or "soulcube")
                if (!["datacube", "soulcube"].includes(arg)) {
                    agt.output("You cannot insert that.");
                    return;
                }

                // For soulcube, ensure we're in the terminal room
                if (arg === "soulcube" && agt.currentRoom !== "terminal") {
                    agt.output("You cannot insert the soulcube into that.");
                    return;
                }

                // Check if the player has the item in their inventory
                if (!agt.inventory.some(i => i.name === arg)) {
                    agt.output(`You don't have a ${arg}.`);
                    return;
                }

                // Check if an item is already inserted in the current room's device
                if (agt.currentRoom === "terminal") {
                    if (arg === "datacube" && agt.conditions.datacubeInserted) {
                        agt.output("A datacube is already in the drive.");
                        return;
                    }
                    if (arg === "soulcube" && agt.conditions.soulCubeInserted) {
                        agt.output("A soulcube is already in the drive.");
                        return;
                    }
                }
                if (agt.currentRoom === "scanner" && agt.conditions.dataScannerInserted) {
                    agt.output("A datacube is already in the scanner.");
                    return;
                }

                // Remove the item from inventory
                agt.inventory = agt.inventory.filter(i => i.name !== arg);

                // Set the appropriate condition and output message based on the room and item
                if (agt.currentRoom === "terminal") {
                    if (arg === "datacube") {
                        agt.conditions.datacubeInserted = true;					
                        agt.output("You insert the datacube into the drive."); 
                        room.items["datacube"] = "The datacube can hold thousands of petabytes of data at the subatomic level. This one is a dull grey color, indicating it is empty.";
                    } else if (arg === "soulcube") {
                        agt.conditions.soulCubeInserted = true;
                        room.itemArt = room.itemArt || {};
                        room.itemArt["soulcube"] = "art/soulcube.jpg";	// Needs to go back in the room to be examinable						
                        agt.output("You insert the soulcube into the drive.");
                        room.items["soulcube"] = "Swirling shapes move across the surface of the glowing soulcube, which holds information representing every memory and neural connection in your brain.";
                    }
                } else if (agt.currentRoom === "scanner") {
                    agt.conditions.dataScannerInserted = true;
                    agt.output("You insert the datacube into the scanner.");
                    room.items["datacube"] = "The datacube can hold thousands of petabytes of data at the subatomic level. This one is a dull grey color, indicating it is empty.";
                    room.itemArt = room.itemArt || {};
                    room.itemArt["datacube"] = "art/cube.jpg";	// Needs to go back in the room to be examinable											
                }
            }
        },

        take: {
            execute: (agt, arg) => {
                // Check if the item being taken is datacube or soulcube and if it's inserted
                if (arg === "datacube") {
                    if (agt.currentRoom === "terminal" && agt.conditions.datacubeInserted) {
                        agt.output("The datacube is currently in the drive.");
                        agt.conditions.datacubeInserted = false;
                    } else if (agt.currentRoom === "scanner" && agt.conditions.dataScannerInserted) {
                        agt.output("The datacube is currently in the scanner console.");
                        agt.conditions.dataScannerInserted = false;
                    }
                } else if (arg === "soulcube") {
                    if (agt.currentRoom === "terminal" && agt.conditions.soulCubeInserted) {
                        agt.output("The soulcube is currently in the drive.");
                        agt.conditions.soulCubeInserted = false;
                    }
                }

                // Call the core take command to handle the default behavior
                agt.take(arg);
            }
        },
		
        press: {
            execute: (agt, arg) => {
                // Check if the player is in the scanner room
                if (agt.currentRoom !== "scanner") {
                    agt.output("You need to be in the scanner room to press anything.");
                    return;
                }

                // Check if a button object exists in the room
                const room = agt.rooms[agt.currentRoom];
                if (!room.objects || !room.objects["button"]) {
                    agt.output("There is no button here to press.");
                    return;
                }

                // Check if an argument was provided
                if (!arg) {
                    agt.output("You need to press something.");
                    return;
                }

                // Check if the argument is "button"
                if (arg !== "button") {
                    agt.output(`There's nothing like that to press here.`);
                    return;
                }

                // At this point, arg === "button", the player is in the scanner room, and a button exists
                if (agt.conditions.dataScannerInserted) {
                    agt.output("You press the button. There is a whirring noise as scanners rapidly move around your head and body. The datacube in the scanner fills with light. You see a message on the screen: 'Scan complete. Soulcube is ready.'");
                    room.items["soulcube"] = "Swirling shapes move across the surface of the glowing datacube, which now holds information representing every memory and neural connection in your brain.";
                    room.itemArt = room.itemArt || {};
                    room.itemArt["soulcube"] = "art/soulcube.jpg";					
                    delete room.items["datacube"]; // Remove datacube and set inserted condition to false
                    agt.conditions.dataScannerInserted = false;					
                } else {
                    agt.output("You press the button, but nothing happens.");
                }
            }
        }			
    },		
    startRoom: "atrium",
    rooms: {
        scanner: {
            description: "You are in a medical scanning booth. There is a console with a screen in front of you.",
            exits: { north: "atrium" },
            objects: { console: "The console has a 2cm square recess. Below the console is a button.", button: "The button is green and round.", scanner: "Hi-resolution medical scanning equipment is built into the walls of the booth." },
            items: {},
            itemArt: {},			
            roomArt: "art/scan.jpg"			
        },
        atrium: {
            description: "You are standing in a white room. A heavy metal door lies to the east. A broad window faces out onto a decaying city.",
            exits: { 
                south: "scanner", west: "terminal", 
                east: {
					room: "outside",
                    condition: "atriumDoorUnlocked",
                    message: "The door is locked because the entropy outside is dangerously high. It can only be unlocked electronically."
                }					
            },
            items: {},
            objects: { door: "The door is electronically locked and has no keyhole or keypad. It has a thick seal around the edge.", window: "The window is made from 5cm-thick reinforced glass." },
            roomArt: "art/city2.jpg" // Room image URL
        },
        outside: {
		    description: "You are outside of the secure enclave. Entropy is dangerously high. Electromagnetic radiation interfering with your brain activity causes pulses of light behind your eyes. You feel your heart go into arrhythmia.<p>",
            fatal: true,
            exits: {},
            objects: {},
            items: {},
            roomArt: "art/rip.png"			
        },			
        terminal: {
            description: "You are in a room lit only by the light of a dusty computer terminal.",
            exits: { east: "atrium" },
            items: { datacube: "The datacube can hold thousands of petabytes of data at the subatomic level. This one is a matt black color, indicating it is empty." },
            objects: { terminal: "The terminal is a Quantech 4 model with an Optical Drive for ultra-high-volume data transfer.", drive: "The Drive has a square recess, 2cm on each side, designed to accept a standard datacube."},
            itemArt: { datacube: "art/cube.jpg" },
            roomArt: "art/terminal.jpg"
        }
    },

}


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