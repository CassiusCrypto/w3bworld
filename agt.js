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

    async imgToAscii(imageUrl) {
        try {
            const density = '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,"^`\'. ';
            const densityLength = density.length;

            const img = new Image();
            // Remove img.crossOrigin = "Anonymous" for local files
            img.src = imageUrl;

            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            const targetWidth = 128;
            const aspectRatio = img.height / img.width;
            const targetHeight = Math.round(targetWidth * aspectRatio);

            canvas.width = targetWidth;
            canvas.height = targetHeight;

            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

            const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
            const pixels = imageData.data;

            let asciiArt = '';
            for (let y = 0; y < targetHeight; y++) {
                for (let x = 0; x < targetWidth; x++) {
                    const index = (y * targetWidth + x) * 4;
                    const r = pixels[index];
                    const g = pixels[index + 1];
                    const b = pixels[index + 2];
                    const brightness = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
                    const charIndex = Math.floor((brightness / 255) * (densityLength - 1));
                    asciiArt += density[charIndex];
                }
                asciiArt += '\n';
            }

            const artOutput = `<pre style="font-family: monospace; line-height: 1; color: #00ff00; background: #000;">${asciiArt}</pre>`;
            this.artBoxElement.innerHTML = artOutput; // Set directly
            return artOutput; // Return the ASCII art
        } catch (error) {
            console.error("Error in imgToAscii:", error);
            const errorOutput = '<pre style="font-family: monospace; line-height: 1; background: #000;">Error loading ASCII art.</pre>';
            this.artBoxElement.innerHTML = errorOutput; // Set directly
            return errorOutput; // Return the error message
        }
    }

    // Display ASCII art in the artBox by fetching from a file
    async imgToAscii(imageUrl) {
        try {
            const density = '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,"^`\'. ';
            const densityLength = density.length;

            const img = new Image();
            img.src = imageUrl;

            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Target width in characters
            const targetWidth = 128;
            // Adjust for aspect ratio of ASCII characters (approx. 2:1 height:width)
            const asciiAspectRatio = 2; // Characters are twice as tall as wide
            const aspectRatio = img.height / img.width;
            // Calculate target height in characters, accounting for ASCII aspect ratio
            const targetHeight = Math.round((targetWidth * aspectRatio) / asciiAspectRatio);

            canvas.width = targetWidth;
            canvas.height = targetHeight;

            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

            const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
            const pixels = imageData.data;

            let asciiArt = '';
            for (let y = 0; y < targetHeight; y++) {
                for (let x = 0; x < targetWidth; x++) {
                    const index = (y * targetWidth + x) * 4;
                    const r = pixels[index];
                    const g = pixels[index + 1];
                    const b = pixels[index + 2];
                    const brightness = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
                    const charIndex = Math.floor((brightness / 255) * (densityLength - 1));
                    const char = density[charIndex];
                    // Apply brightness-based shading (green gradient)
                    const greenValue = Math.round(50 + (brightness / 255) * (255 - 50));
                    const color = `rgb(0, ${greenValue}, 0)`;
                    asciiArt += `<span style="color: ${color}">${char}</span>`;
                }
                asciiArt += '\n';
            }

            const artOutput = `<pre style="font-family: monospace; line-height: 1; background: #000;">${asciiArt}</pre>`;
            this.artBoxElement.innerHTML = artOutput;
            return artOutput;
        } catch (error) {
            console.error("Error in imgToAscii:", error);
            const errorOutput = '<pre style="font-family: monospace; line-height: 1; background: #000;">Error loading ASCII art.</pre>';
            this.artBoxElement.innerHTML = errorOutput;
            return errorOutput;
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
        console.log("Generating ASCII art for room");
        if (room.roomArt) {
            const roomArt = await this.imgToAscii(room.roomArt);
            this.artBoxElement.innerHTML = roomArt;
        } else {
            this.artBoxElement.innerHTML = '';
        }

        console.log("imgToAscii completed");
    }
	
    // Parse and handle player commands
    async parseCommand(input) {
        // Ignore commands if the player is dead
        if (this.dead) {
            return;
        }
	
        const [command, ...args] = input.toLowerCase().split(" ");
        const argStr = args.join(" ");

        // Check custom commands in case there are special conditions
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
            this.output(`Standard commands:<br>north/n, south/s, west/w, east/e - Move to new location<br>look/l - Look around the current location<br>inventory/i - Check your inventory<br>examine/exam <item> - Examine an item in the current location<br>take <item> - Pick up an item<br>use item/object with item/object - use something with something else<br>mint - mint khoyn (on-chain)<br>balance - check khoyn balance<br>help/h - Show this help message<br>about - About W3bWorld`);
            return;			
        }			
        if (command === "about") {
            this.output(`<i>Quantum broke us. We knew the risks but the lure of unlimited processing power was too strong. In seeking to unlock the mysteries of the universe, we almost destroyed them, corrupting the source code that underpins our very existence. Now the world is unstable, its tendency towards increasing entropy harsher and more unpredictable. The consequences rippled through the four-dimensional structure of reality. We do not know if we can fix it.<p>You have been placed in a secure enclave: an encrypted fortress of bits that will, for now, withstand the encroaching chaos. Your task is to explore, understand the nature of the damage we have done, address it where you can, and seek instances of pristine code to repair it where you cannot. Good luck.</i><p><b>W3bWorld: Source Code</b> is a blockchain-powered text adventure game. It's built on Base Network with heavy use of AI. W3bWorld is a work-in-progress. No smart contracts have been audited. Please do not commit significant funds to any process. Play is at your own risk.`);
            return;
        }

        // If no command matches, output the error
        this.output("I don't understand. Try help for a list of commands.");
    }

    // Show the player's inventory, including on-chain assets
    async showInventory() {
        let inventoryDisplay = this.inventory.map(item => item.name); // Off-chain items

        // On-chain assets
        let onChainDisplay = [];

        // Fetch Khoyn balance if connected
        if (this.contract && this.signer) {
            try {
                const address = await this.signer.getAddress();
                const balance = await this.contract.balanceOf(address);
                const formattedBalance = ethers.formatEther(balance);
                onChainDisplay.push(`<span class="khoyn-balance">${formattedBalance} khoyn</span>`);
            } catch (error) {
                onChainDisplay.push(`<span class="khoyn-balance">Khoyn: error (${error.message})</span>`);
            }
        } else {
            onChainDisplay.push(`<span class="khoyn-balance">Khoyn: unavailable (connect to MetaMask)</span>`);
        }

        // Check whitelisted assets (e.g., Nexus NFT)
        if (this.signer && this.gameData.whitelistedAssets) {
            const address = await this.signer.getAddress();
            for (const asset of this.gameData.whitelistedAssets) {
                if (asset.type === "ERC721") {
                    try {
                        const contract = new ethers.Contract(asset.contractAddress, asset.abi, this.signer);
                        const balance = await contract.balanceOf(address);
                        if (balance > 0) {
                            onChainDisplay.push(`<span class="khoyn-balance">${asset.name}</span>`);
                        }
                    } catch (error) {
                        onChainDisplay.push(`${asset.name}: error (${error.message})`);
                    }
                }
                // Add support for other token types (e.g., ERC20) here if needed
            }
        }

        // Combine on-chain and off-chain inventory
        if (inventoryDisplay.length || onChainDisplay.length) {
            const output = [];
            if (onChainDisplay.length) {
                output.push(`On-chain: ${onChainDisplay.join(", ")}`);
            }
            if (inventoryDisplay.length) {
                output.push(`Off-chain: ${inventoryDisplay.join(", ")}`);
            }
            this.output(`Inventory<br>${output.join("<br>")}`);
        } else {
            this.output("Inventory is empty.");
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
	
    examine(target) {
        const room = this.rooms[this.currentRoom];
        let found = false;

        // Check room items first
        if (room.items && room.items[target]) {
            this.output(room.items[target]); // Description is the string value directly
            if (room.itemArt && room.itemArt[target]) {
                this.imgToAscii(room.itemArt[target]).then(art => {
                    this.artBoxElement.innerHTML = art;
                }).catch(error => {
                    console.error("Error displaying item art:", error);
                    this.artBoxElement.innerHTML = "Error loading item art.";
                });
            } else {
                this.artBoxElement.innerHTML = ''; // Clear art box if no art
            }
            found = true;
        }

        // Check room objects
        if (room.objects && room.objects[target]) {
            this.output(room.objects[target]); // Description is the string value directly
            if (room.objectArt && room.objectArt[target]) {
                this.imgToAscii(room.objectArt[target]).then(art => {
                    this.artBoxElement.innerHTML = art;
                }).catch(error => {
                    console.error("Error displaying object art:", error);
                    this.artBoxElement.innerHTML = "Error loading object art.";
                });
            } else {
                this.artBoxElement.innerHTML = ''; // Clear art box if no art
            }
            found = true;
        }

        // Check inventory
        const inventoryItem = this.inventory.find(item => item.name === target);
        if (inventoryItem) {
            this.output(inventoryItem.description); // Use the description from the inventory item
            // Look up the art from the current room's itemArt, or search all rooms
            if (room.itemArt && room.itemArt[target]) {
                this.imgToAscii(room.itemArt[target]).then(art => {
                    this.artBoxElement.innerHTML = art;
                }).catch(error => {
                    console.error("Error displaying inventory item art:", error);
                    this.artBoxElement.innerHTML = "Error loading item art.";
                });
            } else {
                let artFound = false;
                for (const roomKey in this.rooms) {
                    if (this.rooms[roomKey].itemArt && this.rooms[roomKey].itemArt[target]) {
                        this.imgToAscii(this.rooms[roomKey].itemArt[target]).then(art => {
                            this.artBoxElement.innerHTML = art;
                        }).catch(error => {
                            console.error("Error displaying inventory item art:", error);
                            this.artBoxElement.innerHTML = "Error loading item art.";
                        });
                        artFound = true;
                        break;
                    }
                }
                if (!artFound) {
                    this.artBoxElement.innerHTML = ''; // Clear art box if no art found
                }
            }
            found = true;
        }

        // If not found anywhere
        if (!found) {
            this.output("There's nothing like that to examine.");
            this.artBoxElement.innerHTML = ''; // Clear art box
        }
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
        if (preposition !== "with" || !target) {
            this.output("Use items like this: use &lt;item&gt; with &lt;target&gt;");
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
                this.output(`You can't use the ${item} with the ${target}.`);
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
            this.output(`Your khoyn balance: ${ethers.formatEther(balance)} khoyn`);
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