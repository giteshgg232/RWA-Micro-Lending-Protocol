// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract InvoiceNFT is ERC721URIStorage, AccessControl {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    bytes32 public constant ATTESTOR_ROLE = keccak256("ATTESTOR_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    struct Invoice {
        uint256 amount;
        uint256 dueDate;
        string invoiceId;
        bool verified;
        address attestor;
    }

    mapping(uint256 => Invoice) private _invoices;

    event InvoiceMinted(uint256 indexed tokenId, address indexed owner, uint256 amount, uint256 dueDate, string invoiceId, string tokenURI);
    event InvoiceVerified(uint256 indexed tokenId, address indexed attestor);

    constructor(address admin) ERC721("InvoiceNFT", "INVO") {
        _setupRole(DEFAULT_ADMIN_ROLE, admin == address(0) ? msg.sender : admin);
        _setupRole(ORACLE_ROLE, admin == address(0) ? msg.sender : admin);
    }

    function mintInvoice(
        address to,
        uint256 amount,
        uint256 dueDate,
        string calldata invoiceId,
        string calldata uri
    ) external returns (uint256) {
        require(to != address(0), "invalid to");
        require(amount > 0, "amount>0");
        require(dueDate > block.timestamp, "dueDate must be future");

        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        _invoices[tokenId] = Invoice({
            amount: amount,
            dueDate: dueDate,
            invoiceId: invoiceId,
            verified: false,
            attestor: address(0)
        });

        emit InvoiceMinted(tokenId, to, amount, dueDate, invoiceId, uri);
        return tokenId;
    }

    function verifyInvoice(uint256 tokenId) external onlyRole(ATTESTOR_ROLE) {
        require(_exists(tokenId), "token not exists");
        Invoice storage inv = _invoices[tokenId];
        require(!inv.verified, "already verified");
        inv.verified = true;
        inv.attestor = msg.sender;
        emit InvoiceVerified(tokenId, msg.sender);
    }

    function verifyInvoiceByOracle(uint256 tokenId) external onlyRole(ORACLE_ROLE) {
        require(_exists(tokenId), "token not exists");
        Invoice storage inv = _invoices[tokenId];
        require(!inv.verified, "already verified");
        inv.verified = true;
        inv.attestor = msg.sender;
        emit InvoiceVerified(tokenId, msg.sender);
    }

    function addAttestor(address account) external {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "admin only");
        grantRole(ATTESTOR_ROLE, account);
    }

    function removeAttestor(address account) external {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "admin only");
        revokeRole(ATTESTOR_ROLE, account);
    }

    function getInvoice(uint256 tokenId) external view returns (uint256 amount, uint256 dueDate, string memory invoiceId, bool verified, address attestor) {
        require(_exists(tokenId), "not exist");
        Invoice storage inv = _invoices[tokenId];
        return (inv.amount, inv.dueDate, inv.invoiceId, inv.verified, inv.attestor);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
