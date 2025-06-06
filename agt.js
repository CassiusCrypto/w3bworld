// Adventure Game Toolkit (AGT)
class AGT {
    constructor(gameData) {
        this.gameData = gameData;
        
        // Helper function to deep copy objects while preserving functions
        function deepCopyWithFunctions(obj) {
            if (obj === null || typeof obj !== 'object') {
                return obj;
            }
            if (Array.isArray(obj)) {
                return obj.map(deepCopyWithFunctions);
            }
            const copy = {};
            for (const key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    copy[key] = deepCopyWithFunctions(obj[key]);
                }
            }
            return copy;
        }
        
        // Clone rooms and initialRooms with functions preserved
        this.initialRooms = deepCopyWithFunctions(gameData.rooms);
        this.rooms = deepCopyWithFunctions(gameData.rooms);
        
        console.log("Initial rooms stored:", this.initialRooms);
        console.log("Rooms:", this.rooms);
        this.currentRoom = gameData.startRoom || Object.keys(this.rooms)[0];
        console.log("Current room:", this.currentRoom);
        this.inventory = [];
        this.initialConditions = { ...gameData.conditions };
        this.isSearchMode = false;
        this.searchButton = null;
        this.isExamineMode = false;
        this.examineButton = null;
        this.isTakeMode = false;
        this.takeButton = null;
        this.isPressMode = false;
        this.pressButton = null;
        this.isTypeMode = false;
        this.typeButton = null;
        this.isUseMode = false;
        this.useButton = null;
        this.selectedUseItem = null;
        this.isPortMode = false;
        this.portButton = null;
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
                    this.exitExamineMode();
                }
                if (this.isTakeMode) {
                    this.exitTakeMode();
                }
                if (this.isPressMode) {
                    this.exitPressMode();
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
        this.updateInventoryBox();
        this.updateRoomItemsList();		
    }

    setupCommandButtons() {
        if (!this.commandsContainer) return;

        const buttons = [
            // Row 1
            { label: "Look", command: "look", action: () => this.parseCommand("look") },
            { label: "Examine", command: "examine", action: () => this.enterExamineMode() },
            { label: "Search", command: "search", action: () => this.enterSearchMode() },
            // Row 2
            { label: "Inventory", command: "inventory", action: () => this.parseCommand("inventory") },
            { label: "Take", command: "take", action: () => this.enterTakeMode() },
            { label: "Use", command: "use", action: () => this.enterUseMode() },
            // Row 3
            { label: "Press", command: "press", action: () => this.enterPressMode() },
            { label: "Type", command: "type", action: () => this.enterTypeMode() },
            { label: "Fight", command: null, action: () => console.log("Fight button clicked (not implemented)") },
            // Row 4
            { label: "Talk To", command: null, action: () => console.log("Talk To button clicked (not implemented)") },
            { label: "Help", command: "help", action: () => this.parseCommand("help") },
            { label: "About", command: "about", action: () => this.parseCommand("about") },
            // Row 5: Port (centered)
            { label: "", command: null, action: () => {}, placeholder: true }, // Empty cell
            { label: "Port", command: "port", action: () => this.enterPortMode(), isPort: true },
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
                if (buttonData.label === "Examine") this.examineButton = button;
                if (buttonData.label === "Take") this.takeButton = button;
                if (buttonData.label === "Press") this.pressButton = button;
                if (buttonData.label === "Type") this.typeButton = button;
                if (buttonData.label === "Use") this.useButton = button;
                if (buttonData.label === "Port") this.portButton = button;
                if (buttonData.label === "Search") this.searchButton = button; 
                button.addEventListener("click", () => {
                    if (!this.dead) {
                        if (buttonData.label === "Port" && this.isPortMode) {
                            this.exitPortMode();
                            return;
                        }
                        if (buttonData.label === "Examine" && this.isExamineMode) {
                            this.exitExamineMode();
                            return;
                        }
                        if (buttonData.label === "Take" && this.isTakeMode) {
                            this.exitTakeMode();
                            return;
                        }
                        if (buttonData.label === "Press" && this.isPressMode) {
                            this.exitPressMode();
                            return;
                        }
                        if (buttonData.label === "Type" && this.isTypeMode) {
                            this.exitTypeMode();
                            return;
                        }
                        if (buttonData.label === "Use" && this.isUseMode) {
                            this.exitUseMode();
                            return;
                        }
                        if (buttonData.label === "Search" && this.isSearchMode) { 
                            this.exitSearchMode();
                            return;
                        }
                        // Exit all modes before entering a new one
                        if (this.isExamineMode) this.exitExamineMode();
                        if (this.isTakeMode) this.exitTakeMode();
                        if (this.isPressMode) this.exitPressMode();
                        if (this.isTypeMode) this.exitTypeMode();
                        if (this.isUseMode) this.exitUseMode();
                        if (this.isPortMode) this.exitPortMode();
                        if (this.isSearchMode) this.exitSearchMode();
                        // Output command for non-mode buttons
                        if (buttonData.command && !["Examine", "Take", "Press", "Type", "Use", "Port", "Search"].includes(buttonData.label)) {
                            this.output(`> ${buttonData.command}`);
                        }
                        buttonData.action();
                    }
                });
            }
            this.commandsContainer.appendChild(button);
        });
        this.updateButtonStates(); // Initialize button states
    }

    // Add port mode methods
    async enterPortMode() {
        if (this.dead) return;
        if (!this.signer) {
            this.output("You need to connect to MetaMask to use the Port function.");
            return;
        }
        // Check if Nexus Key is in inventory
        let hasNexusKey = false;
        if (this.gameData.whitelistedAssets) {
            const address = await this.signer.getAddress();
            for (const asset of this.gameData.whitelistedAssets) {
                if (asset.name.toLowerCase() === "nexus key") {
                    try {
                        const contract = new ethers.Contract(asset.contractAddress, asset.abi, this.signer);
                        const balance = await contract.balanceOf(address);
                        if (balance > 0) {
                            hasNexusKey = true;
                            break;
                        }
                    } catch (error) {
                        console.error("Error checking Nexus Key balance:", error);
                    }
                }
            }
        }
        if (!hasNexusKey) {
            this.output("You need a Nexus Key to use the Port function.");
            return;
        }
        this.isPortMode = true;
        if (this.portButton) {
            this.portButton.classList.add("active");
        }
        this.updateInventoryBox();
    }

    enterSearchMode() {
        if (this.dead) return;
        this.isSearchMode = true;
        if (this.searchButton) {
            this.searchButton.classList.add("active");
        }
        this.updateRoomItemsList(); // Refresh to show clickable objects
    }

    exitSearchMode() {
        this.isSearchMode = false;
        if (this.searchButton) {
            this.searchButton.classList.remove("active");
        }
        this.updateRoomItemsList(); // Refresh to remove click handlers
    }

    exitPortMode() {
        this.isPortMode = false;
        if (this.portButton) {
            this.portButton.classList.remove("active");
        }
        this.updateInventoryBox();
    }

    enterTypeMode() {
        if (this.dead) return;

        // If already in typeMode, exit to close the modal (toggle behavior)
        if (this.isTypeMode) {
            this.exitTypeMode();
            return;
        }

        // Set typeMode and highlight button
        this.isTypeMode = true;
        if (this.typeButton) {
            this.typeButton.classList.add("active");
        }
        this.showTypeModal();
    }

    // Update exitTypeMode to ensure clean state
    exitTypeMode() {
        this.isTypeMode = false;
        if (this.typeButton) {
            this.typeButton.classList.remove("active");
        }
        const modal = document.getElementById("typeModal");
        if (modal) {
            modal.remove(); // Remove modal and its event listeners
        }
    }

    // Update showTypeModal to prevent multiple modals
    showTypeModal() {
        // Remove any existing modal to prevent duplicates
        const existingModal = document.getElementById("typeModal");
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement("div");
        modal.id = "typeModal";
        modal.innerHTML = `
            <div>ENTER COMMAND:</div>
            <input type="text" id="typeModalInput" value="type " style="width: 100%;">
        `;

        document.body.appendChild(modal);

        const input = modal.querySelector("#typeModalInput");
        input.focus();
        input.setSelectionRange(5, 5); // Place cursor after "type "

        input.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                const command = input.value.trim().replace(/^type\s+/, "");
                if (command) {
                    this.output(`> type ${command}`);
                    this.parseCommand(`type ${command}`);
                }
                this.exitTypeMode();
            }
        });

        // Handle Escape key to close modal
        input.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                this.exitTypeMode();
            }
        });

        // Close modal on click outside
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                this.exitTypeMode();
            }
        });
    }

    handleCommandInput = (event) => {
        if (event.key === "Enter" && !this.dead) {
            const input = event.target.value.trim();
            if (this.isTypeMode) {
                event.target.value = "";
                return;
            }
            if (this.isExamineMode) this.exitExamineMode();
            if (this.isTakeMode) this.exitTakeMode();
            if (this.isPressMode) this.exitPressMode();
            if (this.isUseMode) this.exitUseMode();
            if (this.isSearchMode) this.exitSearchMode();
            this.output(`> ${input}`);
            this.parseCommand(input);
            event.target.value = "";
        }
    };

    enterUseMode() {
        if (this.dead) return;
        if (!this.inventory.length && !this.signer) {
            this.output("You have no items to use.");
            return;
        }
        this.isUseMode = true;
        if (this.useButton) {
            this.useButton.classList.add("active");
        }
        this.selectedUseItem = null;
        this.updateInventoryBox();
        this.updateRoomItemsList();
    }

    exitUseMode() {
        this.isUseMode = false;
        this.selectedUseItem = null;
        if (this.useButton) {
            this.useButton.classList.remove("active");
        }
        this.updateRoomItemsList();
    }

    updateButtonStates() {
        if (this.useButton) {
            if (!this.inventory.length && !this.signer) {
                this.useButton.classList.add("disabled");
            } else {
                this.useButton.classList.remove("disabled");
            }
        }
    }

    setBlockchainContext(w3bContract, signer) {
        this.w3bContract = w3bContract;
        this.signer = signer;
        this.updateW3bBalance(); // Update balance on context set
        this.updateInventoryBox(); // Update inventory box
    }

    // In agt.js, add the updateW3bBalance method after setBlockchainContext
    async updateW3bBalance() {
        const w3bBalanceDiv = document.getElementById("w3bBalance");
        if (!this.w3bContract || !this.signer) {
            if (w3bBalanceDiv) w3bBalanceDiv.textContent = "W3B: Unavailable";
            return;
        }
        try {
            const address = await this.signer.getAddress();
            const balance = await this.w3bContract.balanceOf(address);
            const decimals = await this.w3bContract.decimals();
            const formattedBalance = ethers.formatUnits(balance, decimals);
            if (w3bBalanceDiv) w3bBalanceDiv.textContent = `W3B: ${formattedBalance}`;
        } catch (error) {
            if (w3bBalanceDiv) w3bBalanceDiv.textContent = `W3B: Error (${error.message})`;
        }
    }

    output(message) {
        this.outputElement.innerHTML += `<p>${message}</p>`;
        this.outputElement.scrollTop = this.outputElement.scrollHeight;
    }

// In agt.js, replace the setBlockchainContext method
setBlockchainContext(w3bContract, signer) {
    this.w3bContract = w3bContract;
    this.signer = signer;
    this.updateW3bBalance(); // Update balance on context set
    this.updateInventoryBox(); // Update inventory box
}

// In agt.js, add the updateW3bBalance method after setBlockchainContext
async updateW3bBalance() {
    const w3bBalanceDiv = document.getElementById("w3bBalance");
    if (!this.w3bContract || !this.signer) {
        if (w3bBalanceDiv) w3bBalanceDiv.textContent = "W3B: Unavailable";
        return;
    }
    try {
        const address = await this.signer.getAddress();
        const balance = await this.w3bContract.balanceOf(address);
        const decimals = await this.w3bContract.decimals();
        const formattedBalance = ethers.formatUnits(balance, decimals);
        if (w3bBalanceDiv) w3bBalanceDiv.textContent = `W3B: ${formattedBalance}`;
    } catch (error) {
        if (w3bBalanceDiv) w3bBalanceDiv.textContent = `W3B: Error (${error.message})`;
    }
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
            const seenAssets = new Set();
            const balanceMap = new Map();

            for (const asset of this.gameData.whitelistedAssets) {
                if (asset.type === "ERC721") {
                    const normalizedName = asset.name.toLowerCase();
                    if (normalizedName.includes("nexus key") && seenAssets.has("nexus key")) {
                        continue;
                    }

                    try {
                        const contract = new ethers.Contract(asset.contractAddress, asset.abi, this.signer);
                        const balance = await contract.balanceOf(address);
                        if (balance > 0) {
                            if (normalizedName.includes("nexus key")) {
                                const currentBalance = balanceMap.get("nexus key") || 0;
                                balanceMap.set("nexus key", currentBalance + parseInt(balance));
                                if (!seenAssets.has("nexus key")) {
                                    const totalBalance = balanceMap.get("nexus key");
                                    const displayName = totalBalance > 1 ? `Nexus Key (x${totalBalance})` : "Nexus Key";
                                    onChainDisplay.push({ name: displayName, type: "on-chain", baseName: "Nexus Key" });
                                    seenAssets.add("nexus key");
                                }
                            } else if (!seenAssets.has(normalizedName)) {
                                const displayName = balance > 1 ? `${asset.name} (x${balance})` : asset.name;
                                onChainDisplay.push({ name: displayName, type: "on-chain", baseName: asset.name });
                                seenAssets.add(normalizedName);
                            }
                        }
                    } catch (error) {
                        if (!seenAssets.has(normalizedName)) {
                            onChainDisplay.push({ name: `${asset.name}: error (${error.message})`, type: "on-chain", baseName: asset.name });
                            seenAssets.add(normalizedName);
                        }
                    }
                }
            }
        }

        const allItems = [...onChainDisplay, ...inventoryDisplay];

        if (allItems.length) {
            allItems.forEach(item => {
                const itemDiv = document.createElement("div");
                itemDiv.className = item.type === "on-chain" ? "inventoryOnChainButton" : "roomItemButton";
                itemDiv.textContent = item.name.toUpperCase();
                if (this.isPortMode && item.baseName === "Nexus Key") {
                    itemDiv.addEventListener("click", () => {
                        if (this.isPortMode && !this.dead) {
                            this.output(`> port with ${item.baseName}`);
                            this.port(item.baseName);
                            this.exitPortMode();
                        }
                    });
                } else if (this.isUseMode && !this.selectedUseItem) {
                    itemDiv.addEventListener("click", () => {
                        if (this.isUseMode && !this.dead && !this.selectedUseItem) {
                            this.selectedUseItem = item.baseName || item.name;
                            this.updateInventoryBox();
                            this.updateRoomItemsList();
                        }
                    });
                } else if (this.isExamineMode) {
                    itemDiv.addEventListener("click", () => {
                        if (!this.dead) {
                            this.output(`> examine ${item.baseName || item.name}`);
                            this.examine(item.baseName || item.name);
                            this.exitExamineMode();
                        }
                    });
                } else if ((item.baseName || item.name) === this.selectedUseItem) {
                    itemDiv.classList.add("active");
                }
                this.inventoryBox.appendChild(itemDiv);
            });
        } else {
            const emptyMessage = document.createElement("div");
            emptyMessage.className = "emptyMessage";
            emptyMessage.textContent = "Inventory is empty.";
            this.inventoryBox.appendChild(emptyMessage);
        }

        this.inventoryBox.scrollTop = 0;
        this.updateButtonStates();
        this.updateW3bBalance(); // Refresh W3b balance
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
        this.updateRoomItemsList(); 
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
        let displayItems;
        if (this.isExamineMode) {
            displayItems = [...items, ...objects];
        } else if (this.isTakeMode) {
            displayItems = [...items, ...objects];
        } else if (this.isPressMode) {
            displayItems = objects;
        } else if (this.isUseMode) {
            displayItems = [...items, ...objects];
        } else if (this.isSearchMode) {
            displayItems = objects; // Only objects can be searched
        } else {
            displayItems = [...items, ...objects];
        }

        displayItems.forEach(item => {
            const button = document.createElement("div");
            button.className = "roomItemButton";
            button.textContent = item.toUpperCase();
            if (this.isUseMode && this.selectedUseItem) {
                // Removed button.classList.add("selectable");
                button.addEventListener("click", () => {
                    if (this.isUseMode && !this.dead && this.selectedUseItem) {
                        this.output(`> use ${this.selectedUseItem} with ${item}`);
                        this.use(`${this.selectedUseItem} with ${item}`);
                        this.exitUseMode();
                    }
                });
            } else if (this.isExamineMode) {
                // Removed button.classList.add("selectable");
                button.addEventListener("click", () => {
                    if (!this.dead) {
                        this.output(`> examine ${item}`);
                        this.examine(item);
                        this.exitExamineMode();
                    }
                });
            } else if (this.isTakeMode) {
                // Removed button.classList.add("selectable");
                button.addEventListener("click", () => {
                    if (!this.dead) {
                        this.output(`> take ${item}`);
                        this.parseCommand(`take ${item}`);
                        this.exitTakeMode();
                        this.updateRoomItemsList();
                    }
                });
            } else if (this.isPressMode) {
                // Removed button.classList.add("selectable");
                button.addEventListener("click", () => {
                    if (!this.dead) {
                        this.output(`> press ${item}`);
                        this.parseCommand(`press ${item}`);
                        this.exitPressMode();
                        this.updateRoomItemsList();
                    }
                });
            } else if (this.isSearchMode) {
                button.addEventListener("click", () => {
                    if (!this.dead) {
                        this.output(`> search ${item}`);
                        this.search(item);
                        this.exitSearchMode();
                    }
                });
            }
            this.roomItemsList.appendChild(button);
        });

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
        if (command === "search" && argStr) { // New search command
            this.search(argStr);
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
        if (command === "press" && argStr) {
            this.press(argStr);
            return;
        }
        if (command === "port" && argStr) {
            this.port(argStr);
            return;
        }
        if (command === "return") {
            this.returnToAtrium();
            return;
        }
        if (command === "help" || command === "h") {
            this.output(`Standard commands:<br>north/n, south/s, west/w, east/e - Move to new location<br>look/l - Look around the current location<br>inventory/i - Check your inventory<br>examine/exam <item> - Examine an item in the current location<br>take <item> - Pick up an item<br>use item/object with item/object - use something with something else<br>port <key> - port to a new location<br>mint - mint khoyn (on-chain)<br>balance - check khoyn balance<br>help/h - Show this help message<br>about - About W3bWorld`);
            return;
        }
        if (command === "about") {
            this.output(`<i>Quantum broke us. We knew the risks but the lure of unlimited processing power was too strong. In seeking to unlock the mysteries of the universe, we almost destroyed them, corrupting the source code that underpins our very existence. Now the world is unstable, its tendency towards increasing entropy harsher and more unpredictable. The consequences rippled through the four-dimensional structure of reality. We do not know if we can fix it.<p>You have been placed in a secure enclave: an encrypted fortress of bits that will, for now, withstand the encroaching chaos. Your task is to explore, understand the nature of the damage we have done, address it where you can, and seek instances of pristine code to repair it where you cannot. Good luck.</i><p><b>W3bWorld: Source Code</b> is a blockchain-powered text adventure game. It's built on Base Network with heavy use of AI. W3bWorld is a work-in-progress. No smart contracts have been audited. Please do not commit significant funds to any process. Play is at your own risk.`);
            return;
        }

        this.output("I don't understand. Try help for a list of commands.");
    }

    async mintW3b(ethAmount) {
        if (!this.w3bContract || !this.signer) {
            this.output("Please connect to MetaMask first using the 'Connect to MetaMask' button.");
            return;
        }
        if (!ethAmount || isNaN(ethAmount) || ethAmount <= 0) {
            this.output("Please select a valid amount to mint.");
            return;
        }
        try {
            const ethValue = ethers.parseEther(ethAmount.toString());
            this.output(`Minting W3B tokens for ${ethAmount} ETH... Please confirm in MetaMask.`);
            const tx = await this.w3bContract.buyTokens({ value: ethValue });
            this.output("Transaction sent. Waiting for confirmation...");
            await tx.wait();
            this.output("Successfully minted W3B tokens!");
            this.updateW3bBalance(); // Refresh balance display
            this.updateInventoryBox(); // Refresh inventory UI
        } catch (error) {
            this.output(`Error minting W3B tokens: ${error.message}`);
            if (error.code === "INSUFFICIENT_FUNDS") {
                this.output(`Insufficient ETH. You need at least ${ethAmount} ETH plus gas fees.`);
            }
        }
    }

    async showInventory() {
        let inventoryDisplay = this.inventory.map(item => item.name);
        let onChainDisplay = [];

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

    search(target) {
        const room = this.rooms[this.currentRoom];
        let found = false;

        if (room.objects && room.objects[target] && room.searchActions && room.searchActions[target]) {
            const action = room.searchActions[target];
            // Handle condition check
            let conditionMet = true;
            if (action.condition) {
                const isNegated = action.condition.startsWith("!");
                const conditionKey = isNegated ? action.condition.slice(1) : action.condition;
                const conditionValue = this.conditions[conditionKey];
                conditionMet = isNegated ? !conditionValue : conditionValue;
            }
            if (!conditionMet) {
                this.output(action.conditionMessage || `Searching the ${target} reveals nothing.`);
                return;
            }
            // Check if item already exists in room
            if (room.items && room.items[action.createItem]) {
                this.output(`The ${action.createItem} is already here.`);
                return;
            }
            this.output(action.message || `You search the ${target} and find a ${action.createItem}.`);
            room.items = room.items || {};
            room.items[action.createItem] = action.createItemDescription || "";
            if (action.createItemArt) {
                room.itemArt = room.itemArt || {};
                room.itemArt[action.createItem] = action.createItemArt;
            }
            if (action.setCondition) {
                this.conditions[action.setCondition] = action.setConditionValue !== undefined ? action.setConditionValue : true;
            }
            this.updateRoomItemsList();
            found = true;
            } else if (room.objects && room.objects[target]) {
            this.output(`Searching the ${target} reveals nothing.`);
            found = true;
        }

        if (!found) {
            this.output(`There's nothing to search or no ${target} here.`);
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
            found = true;
        }

        // Check on-chain items (e.g., Nexus Key)
        if (this.gameData.whitelistedAssets) {
            const asset = this.gameData.whitelistedAssets.find(asset => asset.name.toLowerCase() === target.toLowerCase());
            if (asset) {
                this.output(asset.description || `${asset.name}: No description available.`);
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
        if (this.examineButton) {
            this.examineButton.classList.add("active");
        }
        this.updateRoomItemsList(); // Refresh to show clickable items/objects
        this.updateInventoryBox(); // Refresh inventory for examine
    }

    exitExamineMode() {
        this.isExamineMode = false;
        if (this.examineButton) {
            this.examineButton.classList.remove("active");
        }
        this.updateRoomItemsList(); // Refresh to remove click handlers
        this.updateInventoryBox(); // Refresh inventory
    }

    enterPressMode() {
        if (this.dead) return;
        this.isPressMode = true;
        if (this.pressButton) {
            this.pressButton.classList.add("active");
        }
        this.updateRoomItemsList(); // Refresh to show clickable objects
    }

    exitPressMode() {
        this.isPressMode = false;
        if (this.pressButton) {
            this.pressButton.classList.remove("active");
        }
        this.updateRoomItemsList(); // Refresh to remove click handlers
    }

    async port(item) {
        if (item.toLowerCase() !== "nexus key") {
            this.output("You can only port with a Nexus Key.");
            return;
        }
        // Verify Nexus Key ownership
        let hasNexusKey = false;
        if (this.signer && this.gameData.whitelistedAssets) {
            const address = await this.signer.getAddress();
            for (const asset of this.gameData.whitelistedAssets) {
                if (asset.name.toLowerCase() === "nexus key") {
                    try {
                        const contract = new ethers.Contract(asset.contractAddress, asset.abi, this.signer);
                        const balance = await contract.balanceOf(address);
                        if (balance > 0) {
                            hasNexusKey = true;
                            break;
                        }
                    } catch (error) {
                        this.output(`Error verifying Nexus Key: ${error.message}`);
                        return;
                    }
                }
            }
        }
        if (!hasNexusKey) {
            this.output("You don't have a Nexus Key to port with.");
            return;
        }
        if (!this.rooms.nexus) {
            this.output("Error: The Nexus room does not exist.");
            return;
        }
        this.currentRoom = "nexus";
        this.output("Reality shifts.");
        await this.displayRoom();
        this.updateRoomItemsList();
    }

    async returnToAtrium() {
        if (this.currentRoom === "atrium") {
            this.output("You are already in the atrium.");
            return;
        }
        if (!this.rooms.atrium) {
            this.output("Error: The atrium room does not exist.");
            return;
        }
        this.currentRoom = "atrium";
        this.output("Reality shifts.");
        await this.displayRoom();
        this.updateInventoryBox();
        this.updateRoomItemsList();
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
        if (this.takeButton) {
            this.takeButton.classList.add("active");
        }
        this.updateRoomItemsList(); // Refresh to show clickable items
    }

    exitTakeMode() {
        this.isTakeMode = false;
        if (this.takeButton) {
            this.takeButton.classList.remove("active");
        }
    }

    use(itemStr) {
        const match = itemStr.match(/(\S+)\s+with\s+(.+)/i);
        if (!match) {
            this.output("Use items like this: use <item> with <target>");
            return;
        }
        const [, item, target] = match;
        const room = this.rooms[this.currentRoom];

        if (!this.inventory.some(i => i.name.toLowerCase() === item.toLowerCase())) {
            this.output(`You can't do that.`);
            return;
        }

        const targetLower = target.toLowerCase();
        const isValidTarget = (room.objects && room.objects[targetLower]) || (room.items && room.items[targetLower]);
        if (!isValidTarget) {
            this.output(`There's no ${target} here to use that with.`);
            return;
        }

        if (room.useActions && room.useActions[item.toLowerCase()] && room.useActions[item.toLowerCase()][targetLower]) {
            room.useActions[item.toLowerCase()][targetLower](this);
        } else {
            this.output(`You can't use the ${item} with the ${target}.`);
        }
        this.updateInventoryBox(); // Single refresh after useActions
    }

    pressItem(target, action) {
        const room = this.rooms[this.currentRoom];
    
        // Check required condition
        if (action.condition && !this.conditions[action.condition]) {
            this.output(action.conditionMessage || `The ${target} cannot be pressed yet.`);
            return;
        }
    
        // Output custom message
        this.output(action.message || `You press the ${target}.`);
    
        // Create new item if specified
        if (action.createItem) {
            room.items = room.items || {};
            room.items[action.createItem] = action.createItemDescription || "";
            room.itemArt = room.itemArt || {};
            room.itemArt[action.createItem] = action.createItemArt || "";
        }
    
        // Remove item if specified
        if (action.removeItem) {
            delete room.items[action.removeItem];
        }
    
        // Set condition if specified
        if (action.setCondition) {
            this.conditions[action.setCondition] = action.setConditionValue !== undefined ? action.setConditionValue : true;
        }
    
        // Update UI
        this.updateRoomItemsList();
    }

    press(arg) {
        if (!arg) {
            this.output("Press what?");
            return;
        }
        const room = this.rooms[this.currentRoom];
        const argLower = arg.toLowerCase();
        const isValidTarget = (room.objects && room.objects[argLower]) || (room.items && room.items[argLower]);
    
        if (room.pressActions && room.pressActions[argLower]) {
            this.pressItem(argLower, room.pressActions[argLower]);
        } else if (isValidTarget) {
            this.output(`Pressing the ${arg} does nothing.`);
        } else {
            this.output(`There's no ${arg} to press here.`);
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
        this.exitExamineMode();
        this.exitTakeMode();
        this.exitPressMode();
        this.exitUseMode();
        this.exitTypeMode();
        document.getElementById("commandInput").addEventListener("keypress", this.handleCommandInput);
        this.setupCommandButtons(); // Reinitialize buttons
        this.displayRoom();
        this.updateInventoryBox();
        this.updateRoomItemsList();
        this.updateButtonStates(); // Reset button states
    }
}