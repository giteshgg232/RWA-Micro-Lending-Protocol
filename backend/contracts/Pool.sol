
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface ILoanManager {
    function fundPartial(uint256 loanId, uint256 amount) external;
}

contract Pool is AccessControl {
    using SafeERC20 for IERC20;

    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");

    IERC20 public stablecoin;
    ILoanManager public loanManager;
    mapping(address => uint256) public balances;
    uint256 public totalDeposits;

    event Deposit(address indexed who, uint256 amount);
    event Withdraw(address indexed who, uint256 amount);
    event FundedLoan(address indexed manager, uint256 loanId, uint256 amount);

    constructor(address _stablecoin, address _loanManager, address admin) {
        require(_stablecoin != address(0) && _loanManager != address(0), "zero");
        stablecoin = IERC20(_stablecoin);
        loanManager = ILoanManager(_loanManager);
        _setupRole(DEFAULT_ADMIN_ROLE, admin == address(0) ? msg.sender : admin);
    }

    function deposit(uint256 amount) external {
        require(amount > 0, "amount>0");
        stablecoin.safeTransferFrom(msg.sender, address(this), amount);
        balances[msg.sender] += amount;
        totalDeposits += amount;
        emit Deposit(msg.sender, amount);
    }

    function withdraw(uint256 amount) external {
        require(amount > 0 && balances[msg.sender] >= amount, "insufficient");
        balances[msg.sender] -= amount;
        totalDeposits -= amount;
        stablecoin.safeTransfer(msg.sender, amount);
        emit Withdraw(msg.sender, amount);
    }

    function fundLoan(uint256 loanId, uint256 amount) external {
        require(hasRole(MANAGER_ROLE, msg.sender), "manager only");
        require(amount > 0 && totalDeposits >= amount, "insufficient pool");
        // naive proportional deduction omitted for brevity in MVP
        totalDeposits -= amount;
        stablecoin.approve(address(loanManager), amount);
        loanManager.fundPartial(loanId, amount);
        emit FundedLoan(msg.sender, loanId, amount);
    }
}
