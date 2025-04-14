// Adventure Game Toolkit (AGT)
class AGT {
    constructor(gameData) {
        this.gameData = gameData;
        this.initialRooms = JSON.parse(JSON.stringify(gameData.rooms));
        console.log("Initial rooms stored:", this.initialRooms);
        this.rooms = JSON.parse(JSON.stringify(gameData.rooms));
        console.log("Rooms:", this.rooms);
        this.currentRoom = gameData.startRoom || Object.keys(this.rooms)[0];
        console.log("Current room:", this.currentRoom);
        this.inventory = [];
        this.initialConditions = { ...gameData.conditions };
        this.isExamineMode = false; // Track if examine mode is active
        this.examineButton = null; // Reference to examine button for styling
        this.isTakeMode = false; // Track take mode
        this.takeButton = null; // Reference to take button		
        this.roomItemsList = document.getElementById("roomItemsList");		
        console.log("Initial conditions stored:", this.initialConditions);
        this.conditions = { ...gameData.conditions };
        console.log("this.conditions after init:", this.conditions);
        this.dead = false;
        this.outputElement = document.getElementById("output");
        this.artBoxElement = document.getElementById("artBox");
        this.mapContainer = document.getElementById("mapContainer");
        this.commandsContainer = document.getElementById("commandsContainer");
        this.inventoryBox = document.getElementById("inventoryBox");
        console.log("artBoxElement:", this.artBoxElement);
        this.customCommands = gameData.commands || {};
        this.contract = null;
        this.signer = null;

        this.handleCommandInput = (event) => {
            if (event.key === "Enter" && !this.dead) {
                const input = event.target.value.trim();
                if (this.isExamineMode) {
                    // Exit examine mode on any text input
                    this.exitExamineMode();
                    this.output("Examine cancelled.");
                }				
                if (this.isTakeMode) {
                    this.exitTakeMode(); // Exit take mode
                    this.output("Take cancelled.");
                }
                this.output(`> ${input}`);
                this.parseCommand(input);
                event.target.value = "";
            }
        };

        document.getElementById("commandInput").addEventListener("keypress", this.handleCommandInput);

        this.setupCommandButtons();
        this.displayRoom().catch(error => {
            console.error("Error in initial displayRoom:", error);
        });
        this.updateInventoryBox(); // Populate inventory box on game start
    }

    setupCommandButtons() {
        if (!this.commandsContainer) return;

        const buttons = [
            // Row 1
            { label: "Look", command: "look", action: () => this.parseCommand("look") },
            { label: "Examine", command: "examine", action: () => this.enterExamineMode() },
            { label: "Search", command: null, action: () => console.log("Search button clicked (not implemented)") },
            // Row 2
            { label: "Inventory", command: "inventory", action: () => this.parseCommand("inventory") },
            { label: "Take", command: "take", action: () => this.enterTakeMode() },
            { label: "Use (With)", command: null, action: () => console.log("Use (With) button clicked (not implemented)") },
            // Row 3
            { label: "Press", command: null, action: () => console.log("Press button clicked (not implemented)") },
            { label: "Type", command: null, action: () => console.log("Type button clicked (not implemented)") },
            { label: "Fight", command: null, action: () => console.log("Fight button clicked (not implemented)") },
            // Row 4
            { label: "Talk To", command: null, action: () => console.log("Talk To button clicked (not implemented)") },
            { label: "Help", command: "help", action: () => this.parseCommand("help") },
            { label: "About", command: null, action: () => console.log("About button clicked (not implemented)") },
            // Row 5: Port (centered)
            { label: "", command: null, action: () => {}, placeholder: true }, // Empty cell
            { label: "Port", command: null, action: () => console.log("Port button clicked (not implemented)"), isPort: true },
            { label: "", command: null, action: () => {}, placeholder: true } // Empty cell
        ];

        this.commandsContainer.innerHTML = '';
        buttons.forEach(buttonData => {
            const button = document.createElement("div");
            if (buttonData.placeholder) {
                button.className = "placeholderButton"; // Add a class for empty cells
                button.style.visibility = "hidden"; // Hide but maintain grid space
            } else {
                button.className = buttonData.isPort ? "portButton" : "commandButton";
                button.textContent = buttonData.label;
                if (buttonData.label === "Examine") {
                    this.examineButton = button;
                }
                if (buttonData.label === "Take") {
                    this.takeButton = button;
                }
                button.addEventListener("click", () => {
                    if (!this.dead) {
                        if (this.isExamineMode && buttonData.label !== "Examine") {
                            this.exitExamineMode();
                            this.output("Examine cancelled.");
                        }
                        if (this.isTakeMode && buttonData.label !== "Take") {
                            this.exitTakeMode();
                            this.output("Take cancelled.");
                        }
                        if (buttonData.command && buttonData.label !== "Examine" && buttonData.label !== "Take") {
                            this.output(`> ${buttonData.command}`);
                        }
                        buttonData.action();
                    }
                });
            }
            this.commandsContainer.appendChild(button);
        });
    }

    setBlockchainContext(contract, signer) {
        this.contract = contract;
        this.signer = signer;
        this.updateInventoryBox(); // Update inventory box after setting blockchain context
    }

    output(message) {
        this.outputElement.innerHTML += `<p>${message}</p>`;
        this.outputElement.scrollTop = this.outputElement.scrollHeight;
    }

    async updateInventoryBox() {
        if (!this.inventoryBox) return;

        const title = this.inventoryBox.querySelector(".title");
        this.inventoryBox.innerHTML = "";
        this.inventoryBox.appendChild(title);

        let inventoryDisplay = this.inventory.map(item => ({ name: item.name, type: "off-chain" }));
        let onChainDisplay = [];

        if (this.signer && this.gameData.whitelistedAssets) {
            const address = await this.signer.getAddress();
            for (const asset of this.gameData.whitelistedAssets) {
                if (asset.type === "ERC721") {
                    try {
                        const contract = new ethers.Contract(asset.contractAddress, asset.abi, this.signer);
                        const balance = await contract.balanceOf(address);
                        if (balance > 0) {
                            onChainDisplay.push({ name: asset.name, type: "on-chain" });
                        }
                    } catch (error) {
                        onChainDisplay.push({ name: `${asset.name}: error (${error.message})`, type: "on-chain" });
                    }
                }
            }
        }

        const allItems = [...onChainDisplay, ...inventoryDisplay];

        if (allItems.length) {
            allItems.forEach(item => {
                const itemDiv = document.createElement("div");
                itemDiv.className = "inventoryItem";
                if (item.type === "on-chain") {
                    itemDiv.classList.add("khoyn-balance");
                }
                itemDiv.textContent = item.name;
                itemDiv.addEventListener("click", () => {
                    if (this.isExamineMode && !this.dead) {
                        this.output(`> examine ${item.name}`);
                        this.examine(item.name);
                        this.exitExamineMode();
                    } else {
                        console.log(`Clicked inventory item: ${item.name}`);
                    }
                });
                this.inventoryBox.appendChild(itemDiv);
            });
        } else {
            const emptyMessage = document.createElement("div");
            emptyMessage.className = "emptyMessage";
            emptyMessage.textContent = "Inventory is empty.";
            this.inventoryBox.appendChild(emptyMessage);
        }

        this.inventoryBox.scrollTop = 0;
    }

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

            const targetWidth = 128;
            const asciiAspectRatio = 2;
            const aspectRatio = img.height / img.width;
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
        this.updateMap();
        this.updateRoomItemsList(); // Add this
    }

    updateMap() {
        if (!this.mapContainer) return;

        const room = this.rooms[this.currentRoom];
        this.mapContainer.innerHTML = "";

        const directions = {
            north: { gridRow: 1, gridColumn: 2, command: "n" },
            west: { gridRow: 2, gridColumn: 1, command: "w" },
            center: { gridRow: 2, gridColumn: 2 },
            east: { gridRow: 2, gridColumn: 3, command: "e" },
            south: { gridRow: 3, gridColumn: 2, command: "s" }
        };

        // Track accessible exits for the current room
        const accessibleExits = {};
        if (room.exits) {
            for (const [direction, exit] of Object.entries(room.exits)) {
                let isAccessible = true;
                if (typeof exit === "object") {
                    if (!this.conditions[exit.condition]) {
                        isAccessible = false;
                    }
                }
                if (isAccessible) {
                    accessibleExits[direction] = true;
                }
            }
        }

        // Add current room (center)
        const centerBox = document.createElement("div");
        centerBox.className = "roomBox currentRoom";
        centerBox.textContent = this.currentRoom.toUpperCase();
        centerBox.style.gridRow = directions.center.gridRow;
        centerBox.style.gridColumn = directions.center.gridColumn;
        // Use dashed border where there are exits
        if (accessibleExits.north) centerBox.style.borderTopStyle = "dashed";
        if (accessibleExits.south) centerBox.style.borderBottomStyle = "dashed";
        if (accessibleExits.east) centerBox.style.borderRightStyle = "dashed";
        if (accessibleExits.west) centerBox.style.borderLeftStyle = "dashed";
        this.mapContainer.appendChild(centerBox);

        // Add adjacent rooms based on exits
        if (room.exits) {
            for (const [direction, exit] of Object.entries(room.exits)) {
                const dirConfig = directions[direction];
                if (dirConfig) {
                    let nextRoom;
                    let isAccessible = true;
                    if (typeof exit === "object") {
                        if (this.conditions[exit.condition]) {
                            nextRoom = exit.room;
                        } else {
                            isAccessible = false;
                        }
                    } else {
                        nextRoom = exit;
                    }

                    if (isAccessible) {
                        const roomBox = document.createElement("div");
                        roomBox.className = "roomBox";
                        roomBox.textContent = nextRoom.toUpperCase();
                        roomBox.style.gridRow = dirConfig.gridRow;
                        roomBox.style.gridColumn = dirConfig.gridColumn;
                        // Use dashed border on the side facing the current room
                        if (direction === "north") roomBox.style.borderBottomStyle = "dashed";
                        if (direction === "south") roomBox.style.borderTopStyle = "dashed";
                        if (direction === "east") roomBox.style.borderLeftStyle = "dashed";
                        if (direction === "west") roomBox.style.borderRightStyle = "dashed";
                        roomBox.addEventListener("click", () => {
                            this.parseCommand(dirConfig.command);
                        });
                        this.mapContainer.appendChild(roomBox);
                    }
                }
            }
        }
    }

    updateRoomItemsList() {
        if (!this.roomItemsList) return;

        this.roomItemsList.innerHTML = '';

        const room = this.rooms[this.currentRoom];
        const items = Object.keys(room.items || {});
        const objects = Object.keys(room.objects || {});
        const allItems = [...items, ...objects];

        if (allItems.length) {
            allItems.forEach(item => {
                const button = document.createElement("div");
                button.className = "roomItemButton";
                button.textContent = item.toUpperCase();
                button.addEventListener("click", () => {
                    if (this.isExamineMode && !this.dead) {
                        this.output(`> examine ${item}`);
                        this.examine(item);
                        this.exitExamineMode();
                    } else if (this.isTakeMode && !this.dead && items.includes(item)) {
                        this.output(`> take ${item}`);
                        this.parseCommand(`take ${item}`); // Use parseCommand to respect w3bworld.js override
                        this.exitTakeMode();
                    }
                });
                this.roomItemsList.appendChild(button);
            });
        } else {
            const emptyMessage = document.createElement("div");
            emptyMessage.className = "emptyMessage";
            emptyMessage.textContent = "No items or objects here.";
            this.roomItemsList.appendChild(emptyMessage);
        }
    }

    async parseCommand(input) {
        if (this.dead) {
            return;
        }

        const [command, ...args] = input.toLowerCase().split(" ");
        const argStr = args.join(" ");

        if (this.customCommands[command]) {
            const commandDef = this.customCommands[command];
            if (commandDef.condition && !this.conditions[commandDef.condition]) {
                this.output(commandDef.message);
                return;
            }
            commandDef.execute(this, argStr);
            return;
        }

        if (["north", "south", "east", "west", "n", "s", "e", "w"].includes(command)) {
            this.move(command);
            return;
        }
        if (command === "look" || command === "l") {
            await this.displayRoom();
            return;
        }
        if (command === "examine" || command === "exam" && argStr) {
            this.examine(argStr);
            return;
        }
        if (command === "take" && argStr) {
            this.take(argStr);
            return;
        }
        if (command === "use" && argStr) {
            this.use(argStr);
            return;
        }
        if (command === "inventory" || command === "i") {
            await this.showInventory();
            return;
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

        this.output("I don't understand. Try help for a list of commands.");
    }

    async showInventory() {
        let inventoryDisplay = this.inventory.map(item => item.name);
        let onChainDisplay = [];

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
            onChainDisplay.push(`<span class="khoyn-balance">Unavailable (connect to MetaMask)</span>`);
        }

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
            }
        }

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

    move(direction) {
        const room = this.rooms[this.currentRoom];
        const dir = direction === "n" ? "north" : direction === "s" ? "south" : direction === "e" ? "east" : direction === "w" ? "west" : direction;
        if (room.exits && room.exits[dir]) {
            let nextRoom;
            if (typeof room.exits[dir] === "object") {
                const exit = room.exits[dir];
                if (this.conditions[exit.condition]) {
                    nextRoom = exit.room;
                } else {
                    this.output(exit.message);
                    return;
                }
            } else {
                nextRoom = room.exits[dir];
            }

            if (!this.rooms[nextRoom]) {
                this.output("Error: The destination room does not exist.");
                console.error("Invalid room:", nextRoom);
                return;
            }

            this.currentRoom = nextRoom;

            const newRoom = this.rooms[this.currentRoom];
            if (newRoom.fatal) {
                this.displayRoom();
                setTimeout(() => this.die(), 100);
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

        // Check room items
        if (room.items && room.items[target]) {
            this.output(room.items[target]);
            if (room.itemArt && room.itemArt[target]) {
                this.imgToAscii(room.itemArt[target]).then(art => {
                    this.artBoxElement.innerHTML = art;
                }).catch(error => {
                    console.error("Error displaying item art:", error);
                    this.artBoxElement.innerHTML = "Error loading item art.";
                });
            } else {
                this.artBoxElement.innerHTML = '';
            }
            found = true;
        }

        // Check room objects
        if (room.objects && room.objects[target]) {
            this.output(room.objects[target]);
            if (room.objectArt && room.objectArt[target]) {
                this.imgToAscii(room.objectArt[target]).then(art => {
                    this.artBoxElement.innerHTML = art;
                }).catch(error => {
                    console.error("Error displaying object art:", error);
                    this.artBoxElement.innerHTML = "Error loading object art.";
                });
            } else {
                this.artBoxElement.innerHTML = '';
            }
            found = true;
        }

        // Check inventory items (off-chain)
        const inventoryItem = this.inventory.find(item => item.name === target);
        if (inventoryItem) {
            this.output(inventoryItem.description);
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
                this.artBoxElement.innerHTML = '';
            }
            found = true;
        }

        // Check on-chain items (e.g., Nexus Key)
        if (this.gameData.whitelistedAssets) {
            const asset = this.gameData.whitelistedAssets.find(asset => asset.name.toLowerCase() === target.toLowerCase());
            if (asset) {
                this.output(asset.description || `${asset.name}: No description available.`);
                this.artBoxElement.innerHTML = ''; // No art for on-chain items unless specified
                found = true;
            }
        }

        // If nothing was found
        if (!found) {
            this.output("There's nothing like that to examine.");
            this.artBoxElement.innerHTML = '';
        }
    }

    enterExamineMode() {
        if (this.dead) return;
        this.isExamineMode = true;
        this.output("> examine");
        if (this.examineButton) {
            this.examineButton.classList.add("active");
        }
    }

    exitExamineMode() {
        this.isExamineMode = false;
        if (this.examineButton) {
            this.examineButton.classList.remove("active");
        }
    }

    take(item) {
        const room = this.rooms[this.currentRoom];
        if (room.items[item]) {
            this.inventory.push({ name: item, description: room.items[item] });
            delete room.items[item];
            this.output(`You take the ${item}.`);
            this.updateInventoryBox(); // Update inventory box after taking an item
            this.updateRoomItemsList(); // Refresh room items panel
        } else if (room.objects && room.objects[item]) {
            this.output(`You can't take the ${item}.`);
        } else {
            this.output("There's nothing like that to take.");
        }
    }

    enterTakeMode() {
        if (this.dead) return;
        this.isTakeMode = true;
        this.output("> take");
        if (this.takeButton) {
            this.takeButton.classList.add("active");
        }
    }

    exitTakeMode() {
        this.isTakeMode = false;
        if (this.takeButton) {
            this.takeButton.classList.remove("active");
        }
    }

    use(itemStr) {
        const [item, preposition, target] = itemStr.split(" ");
        if (preposition !== "with" || !target) {
            this.output("Use items like this: use <item> with <target>");
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
                this.updateInventoryBox(); // Update inventory box after using an item
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
            const ethAmount = ethers.parseEther("0.0001");
            const tx = await this.contract.deposit({ value: ethAmount });
            this.output("Minting Khoyn... Waiting for transaction confirmation.");
            await tx.wait();
            this.output("Successfully minted Khoyn!");
            this.updateInventoryBox(); // Update inventory box after minting khoyn
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
            this.updateInventoryBox(); // Update inventory box after checking balance
        } catch (error) {
            this.output(`Error checking balance: ${error.message}`);
        }
    }

    die() {
        console.log("Triggering death");
        this.dead = true;
        this.output("You are dead. Press any key.");
        document.getElementById("commandInput").value = "";
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
        this.rooms = JSON.parse(JSON.stringify(this.initialRooms));
        this.inventory = [];
        this.conditions = { ...this.initialConditions };
        console.log("Conditions after reset:", this.conditions);
        this.outputElement.innerHTML = "";
        this.artBoxElement.innerHTML = "";
        this.exitExamineMode(); // Reset examine mode		
        this.exitTakeMode();		
        document.getElementById("commandInput").addEventListener("keypress", this.handleCommandInput);
        document.getElementById("commandInput").addEventListener("keypress", this.handleCommandInput);
        this.displayRoom();
        this.updateInventoryBox(); // Update inventory box after restarting
        this.updateRoomItemsList(); 
    }
}