
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IInvoiceNFT {
    function ownerOf(uint256 tokenId) external view returns (address);
    function getInvoice(uint256 tokenId) external view returns (uint256 amount, uint256 dueDate, string memory invoiceId, bool verified, address attestor);
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
}

contract LoanManager is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant WITHDRAWER_ROLE = keccak256("WITHDRAWER_ROLE");

    enum LoanState { Requested, Funding, Funded, Repaid, Defaulted, Cancelled }

    struct Loan {
        uint256 loanId;
        uint256 invoiceTokenId;
        address borrower;
        uint256 principal;
        uint256 totalFunded;
        uint256 interestBps;
        uint256 dueDate;
        uint256 createdAt;
        LoanState state;
        address[] lenders;
    }

    IInvoiceNFT public invoiceNFT;
    IERC20 public stablecoin;
    uint256 public loanCounter;
    uint16 public protocolFeeBps;
    address public feeReceiver;

    mapping(uint256 => Loan) public loans;
    mapping(uint256 => mapping(address => uint256)) public contributions;

    event LoanRequested(uint256 indexed loanId, uint256 indexed tokenId, address borrower, uint256 principal, uint256 interestBps, uint256 dueDate);
    event LoanFundContribution(uint256 indexed loanId, address indexed lender, uint256 amount, uint256 totalFunded);
    event LoanFullyFunded(uint256 indexed loanId);
    event LoanRepaid(uint256 indexed loanId, address indexed payer, uint256 totalPaid);
    event LoanDefaulted(uint256 indexed loanId, address indexed triggeredBy);
    event LoanCancelled(uint256 indexed loanId);

    constructor(address _invoiceNFT, address _stablecoin, address admin, address _feeReceiver, uint16 _protocolFeeBps) {
        require(_invoiceNFT != address(0) && _stablecoin != address(0), "zero addr");
        invoiceNFT = IInvoiceNFT(_invoiceNFT);
        stablecoin = IERC20(_stablecoin);
        feeReceiver = _feeReceiver == address(0) ? admin : _feeReceiver;
        protocolFeeBps = _protocolFeeBps;
        _setupRole(DEFAULT_ADMIN_ROLE, admin == address(0) ? msg.sender : admin);
        _setupRole(WITHDRAWER_ROLE, admin == address(0) ? msg.sender : admin);
    }

    modifier onlyBorrower(uint256 loanId) {
        require(loans[loanId].borrower == msg.sender, "not borrower");
        _;
    }

    function requestLoan(uint256 invoiceTokenId, uint256 principal, uint256 interestBps, uint256 durationDays) external returns (uint256) {
        require(principal > 0, "principal>0");
        require(interestBps <= 10000, "bad interest");
        (uint256 invAmount, , , bool verified, ) = invoiceNFT.getInvoice(invoiceTokenId);
        require(verified, "invoice not verified");
        require(invoiceNFT.ownerOf(invoiceTokenId) == msg.sender, "not owner");
        require(durationDays > 0 && durationDays <= 365, "duration days");
        require(principal <= invAmount, "principal > invoice amount");

        loanCounter++;
        uint256 dueDate = block.timestamp + durationDays * 1 days;

        Loan storage L = loans[loanCounter];
        L.loanId = loanCounter;
        L.invoiceTokenId = invoiceTokenId;
        L.borrower = msg.sender;
        L.principal = principal;
        L.totalFunded = 0;
        L.interestBps = interestBps;
        L.dueDate = dueDate;
        L.createdAt = block.timestamp;
        L.state = LoanState.Requested;

        emit LoanRequested(loanCounter, invoiceTokenId, msg.sender, principal, interestBps, dueDate);
        return loanCounter;
    }

    function fundPartial(uint256 loanId, uint256 amount) external nonReentrant {
        Loan storage L = loans[loanId];
        require(L.loanId == loanId, "loan exists");
        require(L.state == LoanState.Requested || L.state == LoanState.Funding, "not funding");
        require(amount > 0, "amount>0");
        require(L.totalFunded + amount <= L.principal, "overfund");

        stablecoin.safeTransferFrom(msg.sender, address(this), amount);

        if (contributions[loanId][msg.sender] == 0) {
            L.lenders.push(msg.sender);
        }
        contributions[loanId][msg.sender] += amount;
        L.totalFunded += amount;

        if (L.state == LoanState.Requested) {
            L.state = LoanState.Funding;
        }

        emit LoanFundContribution(loanId, msg.sender, amount, L.totalFunded);

        if (L.totalFunded == L.principal) {
            invoiceNFT.safeTransferFrom(L.borrower, address(this), L.invoiceTokenId);

            uint256 fee = (uint256(L.principal) * protocolFeeBps) / 10000;
            uint256 toBorrower = L.principal - fee;
            if (fee > 0) {
                stablecoin.safeTransfer(feeReceiver, fee);
            }
            stablecoin.safeTransfer(L.borrower, toBorrower);

            L.state = LoanState.Funded;
            emit LoanFullyFunded(loanId);
        }
    }

    function totalDue(uint256 loanId) public view returns (uint256) {
        Loan storage L = loans[loanId];
        require(L.loanId == loanId, "not exist");
        uint256 interest = (uint256(L.principal) * L.interestBps) / 10000;
        return L.principal + interest;
    }

    function repayLoan(uint256 loanId) external nonReentrant {
        Loan storage L = loans[loanId];
        require(L.loanId == loanId, "not exist");
        require(L.state == LoanState.Funded, "not funded");

        uint256 due = totalDue(loanId);
        stablecoin.safeTransferFrom(msg.sender, address(this), due);

        uint256 toPayRemaining = due;
        for (uint256 i = 0; i < L.lenders.length; i++) {
            address lender = L.lenders[i];
            uint256 contributed = contributions[loanId][lender];
            uint256 share = (due * contributed) / L.principal;
            if (share > 0) {
                stablecoin.safeTransfer(lender, share);
                toPayRemaining -= share;
            }
        }

        if (toPayRemaining > 0) {
            if (L.lenders.length > 0) {
                stablecoin.safeTransfer(L.lenders[0], toPayRemaining);
            } else {
                stablecoin.safeTransfer(feeReceiver, toPayRemaining);
            }
        }

        invoiceNFT.safeTransferFrom(address(this), L.borrower, L.invoiceTokenId);

        L.state = LoanState.Repaid;
        emit LoanRepaid(loanId, msg.sender, due);
    }

    function markDefault(uint256 loanId) external nonReentrant {
        require(hasRole(ORACLE_ROLE, msg.sender) || hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "oracle/admin only");
        Loan storage L = loans[loanId];
        require(L.loanId == loanId, "not exist");
        require(L.state == LoanState.Funded || L.state == LoanState.Funding, "bad state");
        require(block.timestamp > L.dueDate, "not past due");
        L.state = LoanState.Defaulted;
        emit LoanDefaulted(loanId, msg.sender);
    }

    function cancelRequest(uint256 loanId) external nonReentrant {
        Loan storage L = loans[loanId];
        require(L.loanId == loanId, "not exist");
        require(L.state == LoanState.Requested || L.state == LoanState.Funding, "cannot cancel");
        require(L.borrower == msg.sender, "not borrower");
        for (uint256 i = 0; i < L.lenders.length; i++) {
            address lender = L.lenders[i];
            uint256 contributed = contributions[loanId][lender];
            if (contributed > 0) {
                contributions[loanId][lender] = 0;
                stablecoin.safeTransfer(lender, contributed);
            }
        }
        L.state = LoanState.Cancelled;
        emit LoanCancelled(loanId);
    }

    function updateProtocolFee(uint16 _feeBps, address _feeReceiver) external {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "admin only");
        require(_feeBps <= 1000, "fee cap");
        protocolFeeBps = _feeBps;
        feeReceiver = _feeReceiver;
    }

    function withdrawERC20(IERC20 token, address to, uint256 amount) external {
        require(hasRole(WITHDRAWER_ROLE, msg.sender), "withdrawer only");
        token.safeTransfer(to, amount);
    }

    function lendersOf(uint256 loanId) external view returns (address[] memory) {
        return loans[loanId].lenders;
    }
}
