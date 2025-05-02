// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract W3bToken is ERC20, Ownable {
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10**18; // 1B tokens
    uint256 public constant MAX_ETH = 50 ether; // 50 ETH max
    uint256 public constant TOKENS_PER_ETH = TOTAL_SUPPLY / MAX_ETH; // 20M tokens per ETH

    uint256 public totalMinted;
    uint256 public totalEthReceived;

    constructor() ERC20("w3b", "W3B") Ownable(msg.sender) {}

    // Buy tokens by sending ETH
    function buyTokens() public payable {
        require(msg.value > 0, "Send ETH to buy tokens");
        require(totalEthReceived + msg.value <= MAX_ETH, "ETH cap exceeded");

        uint256 tokensToMint = msg.value * TOKENS_PER_ETH;
        require(totalMinted + tokensToMint <= TOTAL_SUPPLY, "Not enough tokens left");

        totalEthReceived += msg.value;
        totalMinted += tokensToMint;

        _mint(msg.sender, tokensToMint);
    }

    // Automatically buy tokens when sending ETH directly
    receive() external payable {
        buyTokens();
    }

    // Owner can withdraw accumulated ETH
    function withdrawETH() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH to withdraw");
        (bool sent, ) = owner().call{value: balance}("");
        require(sent, "ETH withdrawal failed");
    }
}
