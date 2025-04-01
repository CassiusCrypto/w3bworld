// Adventure Game Toolkit (AGT)
class AGT {
    constructor(gameData) {
        this.rooms = gameData.rooms || {};
        this.currentRoom = gameData.startRoom || Object.keys(this.rooms)[0];
        console.log("Rooms:", this.rooms);
        console.log("Current room:", this.currentRoom);
        this.inventory = [];
        this.outputElement = document.getElementById("output");
        this.artBoxElement = document.getElementById("artBox");
        console.log("artBoxElement:", this.artBoxElement); // Debug log
        this.customCommands = gameData.customCommands || {};
        this.contract = null; // Initialize as null
        this.signer = null; // Initialize as null

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
            console.log("Fetch response:", response);
            if (!response.ok) {
                throw new Error(`Failed to load art for ${artFile}`);
            }
            const art = await response.text();
            console.log("Fetched art:", art);

            // Split the art into lines to find the widest line
            const lines = art.split('\n');
            const maxWidthChars = Math.max(...lines.map(line => line.length));
        
            // Estimate the pixel width of the art (font-size: 12px, monospace font)
            // Monospace fonts typically have a width-to-height ratio of about 0.6
            const charWidth = 12 * 0.6; // Approximate width of each character in pixels
            const artWidthPx = maxWidthChars * charWidth;

            // Output the art in a centered container
            this.artBoxElement.innerHTML = `
                <div class="artWrapper" style="min-width: ${artWidthPx}px;">
                    <pre>${art}</pre>
                </div>
            `;
        } catch (error) {
            console.log("Error fetching art:", error);
            this.artBoxElement.innerHTML = `<pre>No art available: ${error.message}</pre>`;
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
        if (command === "help" || command === "h") {
            this.output(`Available Commands:<br>north/n, south/s, west/w, east/e - Move to new location<br>look/l - Look around the current location<br>inventory/i - Check your inventory<br>examine/exam <item> - Examine an item in the current location<br>take <item> - Pick up an item<br>help - Show this help message<br>about - About W3bWorld`);
            return;			
        }			
        if (command === "about") {
            this.output(`<i>Quantum broke us. We knew the risks but the lure of unlimited processing power was too strong. In seeking to unlock the mysteries of the universe, we almost destroyed them, corrupting the source code that underpins our very existence. Now the world is unstable, its tendency towards increasing entropy harsher and more unpredictable. The consequences rippled through the four-dimensional structure of reality. We do not know if we can fix it.<p>You have been placed in a secure enclave: an encrypted fortress of bits that will, for now, withstand the encroaching chaos. Your task is to explore, understand the nature of the damage we have done, address it where you can, and seek instances of pristine code to repair it where you cannot. Good luck.</i><p><b>W3bWorld: Source Code</b> is a blockchain-powered text adventure game. It's built on Base Network with heavy use of AI. W3bWorld is a work-in-progress. No smart contracts have been audited. Please do not commit significant funds to any process. Play is at your own risk.`);
            return;
        }
        // Custom commands (e.g., blockchain interactions)
        if (this.customCommands[command]) {
            this.customCommands[command](argStr, this);
            return; // Exit early
        }

        // If no command matches, output the error
        this.output("I don't understand. Try help for a list of commands.");
    }

    // Show the player's inventory, including Khoyn balance
    async showInventory() {
        let inventoryDisplay = this.inventory.slice(); // Copy the inventory array

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
            this.output(`Inventory<br>${khoynDisplay}`);
        }
    }

    // Move to a new room
    move(direction) {
        const room = this.rooms[this.currentRoom];
        const dir = direction === "n" ? "north" : direction === "s" ? "south" : direction === "e" ? "east" : direction === "w" ? "west" : direction;
        if (room.exits[dir]) {
            // Check for conditions (e.g., locked doors)
            if (room.conditions && room.conditions[dir]) {
                const { item, message } = room.conditions[dir];
                if (!this.inventory.includes(item)) {
                    this.output(message);
                    return;
                }
            }
            this.currentRoom = room.exits[dir];
            this.displayRoom();
        } else {
            this.output("You can't go that way.");
        }
    }

    // Examine an item
    examine(item) {
        const room = this.rooms[this.currentRoom];
        if (room.items[item]) {
            this.output(room.items[item]);
        } else {
            this.output("There's nothing like that here.");
        }
    }

    // Take an item
    take(item) {
        const room = this.rooms[this.currentRoom];
        if (room.items[item]) {
            this.inventory.push(item);
            delete room.items[item];
            this.output(`You take the ${item}.`);
        } else {
            this.output("There's nothing like that to take.");
        }
    }

    // Use an item
    use(itemStr) {
        const [item, preposition, target] = itemStr.split(" ");
        if (preposition !== "on" || !target) {
            this.output("Use items like this: use <item> on <target>");
            return;
        }
        const room = this.rooms[this.currentRoom];
        if (!this.inventory.includes(item)) {
            this.output(`You don't have a ${item}.`);
            return;
        }
        if (room.items[target]) {
            // Check for use conditions
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
}