// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Interface for ERC-20 token functionality
interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract KhoynExchange is IERC20 {
    string public constant name = "Khoyn";
    string public constant symbol = "KHOYN";
    uint8 public constant decimals = 18;
    uint256 private _totalSupply;
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    address public immutable deployer;
    uint256 public constant EXCHANGE_RATE = 100_000 * 10**18; // 100,000 Khoyn per 1 ETH (adjusted for 18 decimals)
    uint256 public constant FEE_PERCENTAGE = 1; // 1% fee
    uint256 public constant FEE_DENOMINATOR = 100; // For percentage calculation

    event Deposit(address indexed user, uint256 ethAmount, uint256 khoynAmount);
    event Redeem(address indexed user, uint256 khoynAmount, uint256 ethAmount);

    constructor() {
        deployer = msg.sender;
    }

    // ERC-20 Functions
    function totalSupply() external view override returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) external view override returns (uint256) {
        return _balances[account];
    }

    function transfer(address recipient, uint256 amount) external override returns (bool) {
        _transfer(msg.sender, recipient, amount);
        return true;
    }

    function allowance(address owner, address spender) external view override returns (uint256) {
        return _allowances[owner][spender];
    }

    function approve(address spender, uint256 amount) external override returns (bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address sender, address recipient, uint256 amount) external override returns (bool) {
        uint256 currentAllowance = _allowances[sender][msg.sender];
        require(currentAllowance >= amount, "Transfer amount exceeds allowance");
        _approve(sender, msg.sender, currentAllowance - amount);
        _transfer(sender, recipient, amount);
        return true;
    }

    function _transfer(address sender, address recipient, uint256 amount) internal {
        require(sender != address(0), "Transfer from the zero address");
        require(recipient != address(0), "Transfer to the zero address");
        require(_balances[sender] >= amount, "Insufficient balance");
        _balances[sender] -= amount;
        _balances[recipient] += amount;
        emit Transfer(sender, recipient, amount);
    }

    function _approve(address owner, address spender, uint256 amount) internal {
        require(owner != address(0), "Approve from the zero address");
        require(spender != address(0), "Approve to the zero address");
        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }

    // Deposit ETH to mint Khoyn
    function deposit() external payable {
        require(msg.value > 0, "Must deposit some ETH");

        // Calculate the fee (1%)
        uint256 fee = (msg.value * FEE_PERCENTAGE) / FEE_DENOMINATOR;
        uint256 ethAfterFee = msg.value - fee;

        // Calculate Khoyn to mint: 100,000 Khoyn per 1 ETH (after fee)
        uint256 khoynAmount = (ethAfterFee * EXCHANGE_RATE) / 1 ether;

        // Mint Khoyn to the user
        _totalSupply += khoynAmount;
        _balances[msg.sender] += khoynAmount;
        emit Transfer(address(0), msg.sender, khoynAmount);

        // Send the fee to the deployer
        (bool success, ) = deployer.call{value: fee}("");
        require(success, "Fee transfer failed");

        emit Deposit(msg.sender, msg.value, khoynAmount);
    }

    // Redeem Khoyn to get ETH back
    function redeem(uint256 khoynAmount) external {
        require(khoynAmount > 0, "Must redeem some Khoyn");
        require(_balances[msg.sender] >= khoynAmount, "Insufficient Khoyn balance");

        // Calculate ETH to return: 1 ETH per 100,000 Khoyn
        uint256 ethAmount = (khoynAmount * 1 ether) / EXCHANGE_RATE;

        // Check if the contract has enough ETH
        require(address(this).balance >= ethAmount, "Insufficient ETH in contract");

        // Burn the Khoyn
        _totalSupply -= khoynAmount;
        _balances[msg.sender] -= khoynAmount;
        emit Transfer(msg.sender, address(0), khoynAmount);

        // Send ETH to the user
        (bool success, ) = msg.sender.call{value: ethAmount}("");
        require(success, "ETH transfer failed");

        emit Redeem(msg.sender, khoynAmount, ethAmount);
    }

    // Allow the contract to receive ETH
    receive() external payable {}
}