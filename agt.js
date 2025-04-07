// Adventure Game Toolkit (AGT)
class AGT {
    constructor(gameData) {
        this.gameData = gameData; // Store gameData for later use
        this.initialRooms = JSON.parse(JSON.stringify(gameData.rooms)); // Deep copy of rooms
        console.log("Initial rooms stored:", this.initialRooms);
        this.rooms = JSON.parse(JSON.stringify(gameData.rooms)); // Deep copy for working rooms
        console.log("Rooms:", this.rooms);
        this.currentRoom = gameData.startRoom || Object.keys(this.rooms)[0];
        console.log("Current room:", this.currentRoom);
        this.inventory = [];
        this.initialConditions = { ...gameData.conditions }; // Store initial conditions
        console.log("Initial conditions stored:", this.initialConditions);
        this.conditions = { ...gameData.conditions };
        console.log("this.conditions after init:", this.conditions);
        this.dead = false;
        this.outputElement = document.getElementById("output");
        this.artBoxElement = document.getElementById("artBox");
        console.log("artBoxElement:", this.artBoxElement); // Debug log
        this.customCommands = gameData.commands || {}; // Use gameData.commands from w3bworld.js for custom commands
        this.contract = null; // Initialize as null
        this.signer = null; // Initialize as null

        this.handleCommandInput = (event) => {
            if (event.key === "Enter" && !this.dead) { // Add check for !this.dead
                const input = event.target.value.trim();
                this.output(`> ${input}`);
                this.parseCommand(input);
                event.target.value = "";
            }
        };

        // Bind input handler
        document.getElementById("commandInput").addEventListener("keypress", (event) => {
            if (event.key === "Enter") {
                const input = event.target.value.trim();
                this.output(`> ${input}`);
                this.parseCommand(input);
                event.target.value = "";
            }
        });

        // Call displayRoom and catch any errors
        this.displayRoom().catch(error => {
            console.error("Error in initial displayRoom:", error);
        });
    }

    // Method to update contract and signer after connecting to MetaMask
    setBlockchainContext(contract, signer) {
        this.contract = contract;
        this.signer = signer;
    }

    // Output a message to the UI
    output(message) {
        this.outputElement.innerHTML += `<p>${message}</p>`;
        this.outputElement.scrollTop = this.outputElement.scrollHeight;
    }

    // Display ASCII art in the artBox by fetching from a file
    async displayArt(artFile) {
        console.log("Fetching art for:", artFile);
        try {
            const response = await fetch(`art/${artFile}.txt`);
            if (!response.ok) {
                throw new Error(`Failed to load art for ${artFile}`);
            }
            let art = await response.text();
            // Normalize line endings and trim trailing whitespace
            // art = art.replace(/\r\n/g, '\n').split('\n').map(line => line.trimEnd()).join('\n');
            art = art.replace(/\r\n/g, '\n');
            console.log("Fetched art (raw):", JSON.stringify(art));

            // Escape HTML characters to prevent rendering issues
            const escapeHTML = (str) => {
                return str.replace(/&/g, '&amp;')
                         .replace(/</g, '&lt;')
                         .replace(/>/g, '&gt;')
                         .replace(/"/g, '&quot;')
                         .replace(/'/g, '&#39;');
            };
            const escapedArt = escapeHTML(art);

            // Split the art into lines to find the widest line
            const lines = escapedArt.split('\n');
            const maxWidthChars = Math.max(...lines.map(line => line.length));
        
            // Estimate the pixel width of the art (font-size: 12px, monospace font)
            const charWidth = 12 * 0.6;
            const artWidthPx = maxWidthChars * charWidth;

            // Output the art in a centered container
            this.artBoxElement.innerHTML = `
                <div class="artWrapper" style="min-width: ${artWidthPx}px;">
                    <pre>${escapedArt}</pre>
                </div>
            `;
        } catch (error) {
            console.log("Error fetching art:", error);
            // Do nothing, preserving current art
        }
    }

    // Display the current room's description and art
    async displayRoom() {
        console.log("Starting displayRoom for room:", this.currentRoom);
        const room = this.rooms[this.currentRoom];
        console.log("Room data:", room);
        if (!room) {
            this.output("Error: Room not found.");
            console.error("Room not found:", this.currentRoom);
            return;
        }
        this.output(room.description);
        console.log("Output description done");
        if (Object.keys(room.items).length) {
            this.output("Items: " + Object.keys(room.items).join(", "));
            console.log("Output items done");
        }
        if (Object.keys(room.exits).length) {
            this.output("Exits: " + Object.keys(room.exits).join(", "));
            console.log("Output exits done");
        }
        console.log("Calling displayArt");
        await this.displayArt(this.currentRoom);
        console.log("displayArt completed");
    }
	
    // Parse and handle player commands
    async parseCommand(input) {
        // Ignore commands if the player is dead
        if (this.dead) {
            return;
        }
	
        const [command, ...args] = input.toLowerCase().split(" ");
        const argStr = args.join(" ");

        // Movement commands
        if (["north", "south", "east", "west", "n", "s", "e", "w"].includes(command)) {
            this.move(command);
            return; // Exit early
        }
        // Standard commands
        if (command === "look" || command === "l") {
            await this.displayRoom();
            return; // Exit early
        }
        if (command === "examine" || command === "exam" && argStr) {
            this.examine(argStr);
            return; // Exit early
        }
        if (command === "take" && argStr) {
            this.take(argStr);
            return; // Exit early
        }
        if (command === "use" && argStr) {
            this.use(argStr);
            return; // Exit early
        }
        if (command === "inventory" || command === "i") {
            await this.showInventory();
            return; // Exit early
        }
        if (command === "mint") {
            this.mintKhoyn(argStr);
            return;
        }
        if (command === "balance") {
            this.checkBalance(argStr);
            return;
        }		
        if (command === "help" || command === "h") {
            this.output(`Available Commands:<br>north/n, south/s, west/w, east/e - Move to new location<br>look/l - Look around the current location<br>inventory/i - Check your inventory<br>examine/exam <item> - Examine an item in the current location<br>take <item> - Pick up an item<br>help - Show this help message<br>about - About W3bWorld`);
            return;			
        }			
        if (command === "about") {
            this.output(`<i>Quantum broke us. We knew the risks but the lure of unlimited processing power was too strong. In seeking to unlock the mysteries of the universe, we almost destroyed them, corrupting the source code that underpins our very existence. Now the world is unstable, its tendency towards increasing entropy harsher and more unpredictable. The consequences rippled through the four-dimensional structure of reality. We do not know if we can fix it.<p>You have been placed in a secure enclave: an encrypted fortress of bits that will, for now, withstand the encroaching chaos. Your task is to explore, understand the nature of the damage we have done, address it where you can, and seek instances of pristine code to repair it where you cannot. Good luck.</i><p><b>W3bWorld: Source Code</b> is a blockchain-powered text adventure game. It's built on Base Network with heavy use of AI. W3bWorld is a work-in-progress. No smart contracts have been audited. Please do not commit significant funds to any process. Play is at your own risk.`);
            return;
        }
        // Custom commands
        if (this.customCommands[command]) {
            const commandDef = this.customCommands[command];
            // Check if the command has a condition
            if (commandDef.condition && !this.conditions[commandDef.condition]) {
                this.output(commandDef.message);
                return;
            }
            // Execute the custom command
            commandDef.execute(this, argStr);
            return;
        }		


        // If no command matches, output the error
        this.output("I don't understand. Try help for a list of commands.");
    }

    // Show the player's inventory, including Khoyn balance
    async showInventory() {
        let inventoryDisplay = this.inventory.map(item => item.name); // Extract names

        // Debug: Log contract and signer
        console.log("showInventory - this.contract:", this.contract);
        console.log("showInventory - this.signer:", this.signer);

        // Fetch Khoyn balance if connected to MetaMask
        let khoynDisplay = "";
        if (this.contract && this.signer) {
            try {
                const address = await this.signer.getAddress();
                const balance = await this.contract.balanceOf(address);
                const formattedBalance = ethers.formatEther(balance);
                khoynDisplay = `<span class="khoyn-balance">${formattedBalance} khoyn</span>`;
            } catch (error) {
                khoynDisplay = `<span class="khoyn-balance">Khoyn: error (${error.message})</span>`;
            }
        } else {
            khoynDisplay = `<span class="khoyn-balance">Khoyn: unavailable (connect to MetaMask)</span>`;
        }

        // Combine Khoyn balance with the rest of the inventory
        if (inventoryDisplay.length) {
            this.output(`Inventory<br>On-chain: ${khoynDisplay}${inventoryDisplay.length ? "<br>Off-chain: " + inventoryDisplay.join(", ") : ""}`);
        } else {
            this.output(`Inventory<br>On-chain: ${khoynDisplay}`);
        }
    }

    // Move to a new room
    move(direction) {
        const room = this.rooms[this.currentRoom];
        const dir = direction === "n" ? "north" : direction === "s" ? "south" : direction === "e" ? "east" : direction === "w" ? "west" : direction;
        if (room.exits && room.exits[dir]) {
            let nextRoom;
            // Check if the exit is a conditional exit (an object)
            if (typeof room.exits[dir] === "object") {
                const exit = room.exits[dir];
                if (this.conditions[exit.condition]) {
                    nextRoom = exit.room;
                } else {
                    this.output(exit.message);
                    return;
                }
            } else {
                // Simple exit (string)
                nextRoom = room.exits[dir];
            }

            if (!this.rooms[nextRoom]) {
                this.output("Error: The destination room does not exist.");
                console.error("Invalid room:", nextRoom);
                return;
            }

            // Move to the new room
            this.currentRoom = nextRoom;

            // Check if the new room is fatal
            const newRoom = this.rooms[this.currentRoom];
            if (newRoom.fatal) {
                this.displayRoom(); // Display the room description first
                setTimeout(() => this.die(), 100); // Delay die to ensure displayRoom renders
                return;
            }

            this.displayRoom();
        } else {
            this.output("You can't go that way.");
        }
    }
	
    // Examine an item
    examine(target) {
        const room = this.rooms[this.currentRoom];
        // Check room items first
        if (room.items[target]) {
            this.output(room.items[target]); // Description is the value directly
            if (room.itemArt && room.itemArt[target]) {
                this.displayArt(room.itemArt[target]);
            }
            return;
        }
        // Check room objects
        if (room.objects && room.objects[target]) {
            this.output(room.objects[target]); // Description is the value directly
            if (room.objectArt && room.objectArt[target]) {
                this.displayArt(room.objectArt[target]);
            }
            return;
        }
        // Check inventory
        const inventoryItem = this.inventory.find(item => item.name === target);
        if (inventoryItem) {
            this.output(inventoryItem.description);
            // Look up the art from the current room's itemArt (or search all rooms if needed)
            if (room.itemArt && room.itemArt[target]) {
                this.displayArt(room.itemArt[target]);
            } else {
                // Optionally search all rooms for the item's art
                for (const roomKey in this.rooms) {
                    if (this.rooms[roomKey].itemArt && this.rooms[roomKey].itemArt[target]) {
                        this.displayArt(this.rooms[roomKey].itemArt[target]);
                        break;
                    }
                }
            }
            return;
        }
        // If not found anywhere
        this.output("There's nothing like that to examine.");
    }

    // Take an item
    take(item) {
        const room = this.rooms[this.currentRoom];
        if (room.items[item]) {
            this.inventory.push({ name: item, description: room.items[item] });
            delete room.items[item];
            this.output(`You take the ${item}.`);
        } else if (room.objects && room.objects[item]) {
            this.output(`You can't take the ${item}.`);
        } else {
            this.output("There's nothing like that to take.");
        }
    }

    // Use an item
    use(itemStr) {
        const [item, preposition, target] = itemStr.split(" ");
        if (preposition !== "on" || !target) {
            this.output("Use items like this: use &lt;item&gt; on &lt;target&gt;");
            return;
        }
        const room = this.rooms[this.currentRoom];
        if (!this.inventory.some(i => i.name === item)) {
            this.output(`You don't have a ${item}.`);
            return;
        }
        if (room.items[target] || (room.objects && room.objects[target])) {
            if (room.useActions && room.useActions[item] && room.useActions[item][target]) {
                const action = room.useActions[item][target];
                action(this);
            } else {
                this.output(`You can't use the ${item} on the ${target}.`);
            }
        } else {
            this.output(`There's no ${target} here.`);
        }
    }

    async mintKhoyn(arg) {
        if (!this.contract) {
            this.output("Please connect to MetaMask first using the 'Connect to MetaMask' button.");
            return;
        }
        try {
            const ethAmount = ethers.parseEther("0.0001"); // Deposit 0.0001 ETH
            const tx = await this.contract.deposit({ value: ethAmount });
            this.output("Minting Khoyn... Waiting for transaction confirmation.");
            await tx.wait();
            this.output("Successfully minted Khoyn!");
        } catch (error) {
            this.output(`Error minting Khoyn: ${error.message}`);
            if (error.code === "INSUFFICIENT_FUNDS") {
                this.output("You don't have enough ETH to mint Khoyn. You need at least 0.0001 ETH plus gas fees.");
            }
        }
    }

    async checkBalance(arg) {
        if (!this.contract) {
            this.output("Please connect to MetaMask first using the 'Connect to MetaMask' button.");
            return;
        }
        try {
            const address = await this.signer.getAddress();
            const balance = await this.contract.balanceOf(address);
            this.output(`Your Khoyn balance: ${ethers.formatEther(balance)} KHOYN`);
        } catch (error) {
            this.output(`Error checking balance: ${error.message}`);
        }
    }


    die() {
        console.log("Triggering death");
        this.dead = true;
        this.output("You are dead. Press any key.");
        document.getElementById("commandInput").value = "";
        // Remove the command input listener to prevent interference
        document.getElementById("commandInput").removeEventListener("keypress", this.handleCommandInput);
        const restartListener = (event) => {
            console.log("Restart triggered by keypress");
            this.restart();
            document.removeEventListener("keypress", restartListener);
        };
        document.addEventListener("keypress", restartListener);
    }

    restart() {
        console.log("Restarting game - Setting room to:", this.gameData.startRoom || Object.keys(this.rooms)[0]);
        console.log("Conditions before reset:", this.conditions);
        console.log("Initial conditions from initialConditions:", this.initialConditions);
        this.dead = false;
        this.currentRoom = this.gameData.startRoom || Object.keys(this.rooms)[0];
        console.log("Current room after reset:", this.currentRoom);
        this.inventory = [];
        this.rooms = JSON.parse(JSON.stringify(this.initialRooms)); // Reset rooms to initial state
        console.log("Rooms after reset:", this.rooms);
        this.conditions = { ...this.initialConditions }; // Use initialConditions for reset
        console.log("Conditions after reset:", this.conditions);
        this.outputElement.innerHTML = "";
        // document.getElementById("commandInput").addEventListener("keypress", this.handleCommandInput); // Superfluous, causing problems
        this.displayRoom().catch(error => {
            console.error("Error in restart displayRoom:", error);
        });
    }

}