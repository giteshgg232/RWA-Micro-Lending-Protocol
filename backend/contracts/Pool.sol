// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract Pool is AccessControl {
    using SafeERC20 for IERC20;
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");

    IERC20 public stablecoin;
    address public loanManager;
    mapping(address => uint256) public balances;

    constructor(address _stablecoin, address _loanManager, address admin) {
        stablecoin = IERC20(_stablecoin);
        loanManager = _loanManager;
        _setupRole(DEFAULT_ADMIN_ROLE, admin == address(0) ? msg.sender : admin);
    }

    function deposit(uint256 amount) external {
        require(amount > 0, "amount>0");
        stablecoin.safeTransferFrom(msg.sender, address(this), amount);
        balances[msg.sender] += amount;
    }

    function withdraw(uint256 amount) external {
        require(balances[msg.sender] >= amount, "insufficient");
        balances[msg.sender] -= amount;
        stablecoin.safeTransfer(msg.sender, amount);
    }
}
