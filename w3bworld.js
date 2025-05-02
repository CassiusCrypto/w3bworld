// W3bWorld Game Definition using AGT

// W3b token integration
const w3bAddress = "0x1E2a5DBE9d0cEd108D97e8c5ef38d3BaCda8d46B"; // w3b token address 
const w3bABI = [
    "function buyTokens() external payable",
    "function balanceOf(address account) external view returns (uint256)",
    "function decimals() view returns (uint8)"
];

const nexusAddress = "0x3a109F1356c004cb6B066E2C57f444525E5caA67"; // Nexus NFT contract address
const nexusAbi = [
    "function mint() external payable returns (uint256)",
    "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
    "function balanceOf(address owner) external view returns (uint256)"
];

// Base Mainnet chain ID
const BASE_MAINNET_CHAIN_ID = 8453;

let provider;
let signer;

// Shared function for use actions
function useItemWithDevice(agt, item, target, condition, itemDescription, itemArt, successMessage) {
    if (agt.conditions[condition]) {
        agt.output(`A ${item} was already used with the ${target}.`);
        return;
    }
    if (!agt.inventory.some(i => i.name.toLowerCase() === item.toLowerCase())) {
        agt.output(`You don't have a ${item}.`);
        return;
    }
    agt.inventory = agt.inventory.filter(i => i.name.toLowerCase() !== item.toLowerCase());
    agt.rooms[agt.currentRoom].items[item] = itemDescription;
    agt.rooms[agt.currentRoom].itemArt = agt.rooms[agt.currentRoom].itemArt || {};
    agt.rooms[agt.currentRoom].itemArt[item] = itemArt;
    agt.conditions[condition] = true;
    agt.output(successMessage || `You use the ${item} with the ${target}.`);
    agt.updateRoomItemsList();
}

// Game data for W3bWorld
const gameData = {
    conditions: { // Define initial conditions here
        atriumDoorUnlocked: false,
        datacubeInserted: false,
        soulCubeInserted: false,
        dataScannerInserted: false 		
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
                    agt.output("Recognized commands include 'upload', 'unlock', 'help'.");
                    return;
                }
                if (arg === "help") {
                    // Placeholder for help subcommand
                    agt.output("Terminal Help:<br><i>My name's Carter, and if you're reading this, you're a Porter like me, which means you're going to need all the help you can get. I managed to hack a message into the console on one of my brief return journeys.<br>You need to remember that everything you see is real. The fact that this is simulation doesn't change that. When you can manipulate the fabric of reality then there's no difference between reality and simulation. It's just a shame we started tampering with the universe before we properly understood it. Stay safe and Godspeed. I guess it's possible I'll see you in 'there', somewhere, but the odds of us overlapping are remote and the chances I'm already dead are high. I'm sorry, but those are the risks we all take.</i><p>Recognized commands include 'upload', 'unlock', 'help'.");
                    return;
                }
                if (arg === "upload") {
                    if (agt.conditions.soulCubeInserted) {
                        agt.output("You type 'upload' into the terminal. Your memories and neural connections are uploaded into the quantum firmament, allowing you to port to an infinite universe of real and simulated existences. To access these you need to mint a Nexus key. This is an on-chain operation.");
                        // Trigger Nexus NFT mint
                        mintNexus(agt);						
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

        return: {
            execute: (agt) => {
                agt.returnToAtrium();
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
					
    },		
    startRoom: "atrium",

    rooms: {
        scanner: {
            description: "You are in a medical scanning booth. There is a console with a screen in front of you.",
            exits: { north: "atrium" },
            objects: { 
                console: "The console has a 2cm square recess. Below the console is a button.", 
                button: "The button is green and round.", 
                scanner: "Hi-resolution medical scanning equipment is built into the walls of the booth." 
            },
            items: {},
            itemArt: {},			
            roomArt: "art/scan.jpg",
            useActions: {
                datacube: {
                    console: (agt) => useItemWithDevice(
                        agt,
                        "datacube",
                        "console",
                        "dataScannerInserted",
                        "The datacube can hold thousands of petabytes of data at the subatomic level. This one is a dull grey color, indicating it is empty.",
                        "art/cube.jpg",
                        "The datacube slides into the scanner console with a smooth click."
                    )
                }
            },
            pressActions: {
                button: {
                    condition: "dataScannerInserted",
                    conditionMessage: "You press the button. Nothing happens.",
                    message: "You press the button. There is a whirring noise as scanners rapidly move around your head and body. The datacube in the scanner fills with light. You see a message on the screen: 'Scan complete. Soulcube is ready.'",
                    createItem: "soulcube",
                    createItemDescription: "Swirling shapes move across the surface of the glowing soulcube, which holds information representing every memory and neural connection in your brain.",
                    createItemArt: "art/soulcube.jpg",
                    removeItem: "datacube",
                    setCondition: "dataScannerInserted",
                    setConditionValue: false
                }
            }			
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
            roomArt: "art/terminal.jpg",
            useActions: {
                datacube: {
                    drive: (agt) => useItemWithDevice(
                        agt,
                        "datacube",
                        "drive",
                        "datacubeInserted",
                        "The datacube can hold thousands of petabytes of data at the subatomic level. This one is a dull grey color, indicating it is empty.",
                        "art/cube.jpg",
                        "The datacube slides into the terminal drive with a smooth click."
                    )
                },
                soulcube: {
                    drive: (agt) => useItemWithDevice(
                        agt,
                        "soulcube",
                        "drive",
                        "soulCubeInserted",
                        "Swirling shapes move across the surface of the glowing soulcube, which holds information representing every memory and neural connection in your brain.",
                        "art/soulcube.jpg",
                        "The swirling shapes on the soulcube shift and glow brighter as you slide the memory device into the terminal drive."
                    )
                }
            }
        },
        nexus: {
            description: "You are in a large, empty room. This is the Nexus of the Quantum world: a digital reality synthesized through quantum manipulation of the fabric of the universe.",
            exits: {},
            items: {}, 
            objects: {},
            roomArt: "art/nexus.jpg"
        }			
    },
    whitelistedAssets: [
        {
            name: "Nexus Key",
            type: "ERC721",
            contractAddress: nexusAddress,
            abi: nexusAbi,
            description: "The card holds access codes to the Quantum Nexus. Its featureless, matt-black surface soaks in the light, making it seem more like a hole in the fabric of reality than a physical object."
        }
        // Add more assets here if needed (e.g., other NFTs or tokens)
    ]
}


// Nexus NFT mint function
async function mintNexus(agt) {
    if (!provider || !signer) {
        agt.output("Please connect to MetaMask first using the 'Connect' button.");
        return;
    }

    try {
        const nexusContract = new ethers.Contract(nexusAddress, nexusAbi, signer);
        const mintPrice = ethers.parseEther("0.0001");

        agt.output("Minting Nexus key... Please confirm the transaction in MetaMask.");
        const tx = await nexusContract.mint({ value: mintPrice });

        agt.output("Transaction sent. Waiting for confirmation...");
        const receipt = await tx.wait();

        // Parse the Transfer event log
        const transferEvent = nexusContract.interface.parseLog(receipt.logs[0]);
        const tokenId = transferEvent.args.tokenId.toString();

        agt.output(`Nexus key minted successfully! Token ID: ${tokenId}. Use <i>port &lt;location&gt;</i> to access this sector.`);
        return tokenId;
    } catch (error) {
        agt.output(`Minting failed: ${error.message}`);
        return null;
    }
}

// Initialize the game with AGT
const game = new AGT(gameData);

// Add event listener for the Connect to MetaMask button
document.getElementById("connectButton").addEventListener("click", () => {
    initWeb3(game);
});

// Initialize Web3 provider (MetaMask)
// In w3bworld.js, replace the initWeb3 function
async function initWeb3(game) {
    if (typeof ethers === "undefined") {
        game.output("Error: ethers.js is not loaded. Please refresh the page or check your internet connection.");
        return;
    }

    const mintButton = document.getElementById("mintButton");
    const mintAmount = document.getElementById("mintAmount");
    const walletContainer = document.getElementById("walletContainer");

    // Disable mint button by default
    if (mintButton) mintButton.disabled = true;

    if (window.ethereum) {
        try {
            game.output("Connecting to MetaMask...");
            provider = new ethers.BrowserProvider(window.ethereum);
            await provider.send("eth_requestAccounts", []);

            const network = await provider.getNetwork();
            if (Number(network.chainId) !== BASE_MAINNET_CHAIN_ID) {
                game.output(`Error: Please switch MetaMask to Base Mainnet (chain ID ${BASE_MAINNET_CHAIN_ID}). Current network: ${network.name} (chain ID ${network.chainId}).`);
                return;
            }

            signer = await provider.getSigner();
            const address = await signer.getAddress();
            const w3bContract = new ethers.Contract(w3bAddress, w3bABI, signer);

            // Fetch and display W3b balance
            try {
                const balance = await w3bContract.balanceOf(address);
                const decimals = await w3bContract.decimals();
                const formattedBalance = ethers.formatUnits(balance, decimals);
                document.getElementById("w3bBalance").textContent = `W3B: ${formattedBalance}`;
            } catch (error) {
                document.getElementById("w3bBalance").textContent = `W3B: Error (${error.message})`;
            }

            game.output("Connected to MetaMask on Base Mainnet.");
            game.setBlockchainContext(w3bContract, signer);

            // Update walletContainer to show balance, dropdown, mint button, and wallet address
            walletContainer.innerHTML = `
                <div id="w3bBalance">${document.getElementById("w3bBalance").textContent}</div>
                <select id="mintAmount">
                    <option value="" disabled selected>Select amount</option>
                    <option value="0.0005">0.0005 ETH (10,000 W3B)</option>
                    <option value="0.001">0.001 ETH (20,000 W3B)</option>
                    <option value="0.0025">0.0025 ETH (50,000 W3B)</option>
                    <option value="0.005">0.005 ETH (100,000 W3B)</option>
                </select>
                <button id="mintButton">Mint W3B</button>
                <div id="walletAddress">Connected: ${address.slice(0, 4)}...${address.slice(-4)}</div>
            `;

            // Re-attach mint button listener
            const newMintButton = document.getElementById("mintButton");
            const newMintAmount = document.getElementById("mintAmount");
            if (newMintButton && newMintAmount) {
                newMintButton.disabled = false;
                newMintButton.addEventListener("click", () => {
                    const ethAmount = newMintAmount.value;
                    if (!ethAmount) {
                        game.output("Please select an amount to mint.");
                        return;
                    }
                    game.mintW3b(ethAmount);
                });
            }
        } catch (error) {
            game.output(`Error connecting to MetaMask: ${error.message}`);
            document.getElementById("w3bBalance").textContent = "W3B: Unavailable";
            if (mintButton) mintButton.disabled = true;
            return;
        }
    } else {
        game.output("Please install MetaMask to use blockchain features.");
        document.getElementById("w3bBalance").textContent = "W3B: Unavailable";
        if (mintButton) mintButton.disabled = true;
    }
}