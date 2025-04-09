// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract QuestPassNFT is ERC721, Ownable {
    uint256 public nextTokenId = 1; // Start token IDs at 1
    uint256 public constant MINT_PRICE = 0.0001 ether; // 0.0001 ETH
    string public metadataURI; // Single URI for all tokens' metadata

    constructor(string memory initialMetadataURI) ERC721("NexusKey", "NEXUS") Ownable(msg.sender) {
        metadataURI = initialMetadataURI; // Set the fixed metadata URI at deployment
    }

    // Mint a new NFT
    function mint() external payable returns (uint256) {
        require(msg.value == MINT_PRICE, "Must send exactly 0.0001 ETH");

        uint256 tokenId = nextTokenId;
        nextTokenId++;

        _safeMint(msg.sender, tokenId);

        return tokenId;
    }

    // Update the metadata URI (only owner)
    function setMetadataURI(string memory newMetadataURI) external onlyOwner {
        metadataURI = newMetadataURI;
    }

    // Return the same metadata URI for all tokens
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(ownerOf(tokenId) != address(0), "Token does not exist");
        return metadataURI;
    }

    // Withdraw ETH from contract (only owner)
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        payable(owner()).transfer(balance);
    }
}