// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract SupplyChain {
    address public owner;

    enum Role { None, Farmer, Transporter, Retailer }
    mapping(address => Role) public userRoles;

    struct TransitState {
        address handler;
        string status;
        uint256 timestamp;
    }

    struct Product {
        uint256 id;
        string name;
        address originFarmer;
        address currentOwner;
        string currentStatus;
    }

    mapping(uint256 => Product) public products;
    mapping(uint256 => TransitState[]) public productHistory;
    uint256 public nextProductId = 1;

    event RoleAssigned(address indexed user, Role role);
    event ProductCreated(uint256 indexed productId, string name, address indexed farmer);
    event ProductTransferred(uint256 indexed productId, address indexed from, address indexed to);
    event StatusUpdated(uint256 indexed productId, string status, address indexed by);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the contract owner");
        _;
    }

    modifier onlyRole(Role requiredRole) {
        require(userRoles[msg.sender] == requiredRole, "Unauthorized role");
        _;
    }

    modifier onlyProductOwner(uint256 productId) {
        require(products[productId].currentOwner == msg.sender, "Not the product owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        // The deployer starts as admin. For ease of testing, they can also act as Farmer, etc.,
        // but we'll stick to registering roles.
    }

    // Role Management
    function registerRole(address user, Role role) external onlyOwner {
        userRoles[user] = role;
        emit RoleAssigned(user, role);
    }

    // For Hackathon demo purposes, allow users to self-register
    function selfRegister(Role role) external {
        require(role != Role.None, "Invalid role");
        userRoles[msg.sender] = role;
        emit RoleAssigned(msg.sender, role);
    }

    function getRole(address user) external view returns (Role) {
        return userRoles[user];
    }

    // Product Lifecycle
    function createProduct(string memory _name) external onlyRole(Role.Farmer) returns (uint256) {
        uint256 pId = nextProductId++;

        products[pId] = Product({
            id: pId,
            name: _name,
            originFarmer: msg.sender,
            currentOwner: msg.sender,
            currentStatus: "Manufactured / Harvested"
        });

        productHistory[pId].push(TransitState({
            handler: msg.sender,
            status: "Manufactured / Harvested",
            timestamp: block.timestamp
        }));

        emit ProductCreated(pId, _name, msg.sender);
        return pId;
    }

    function transferOwnership(uint256 productId, address newOwner) external onlyProductOwner(productId) {
        require(products[productId].id != 0, "Product does not exist");
        products[productId].currentOwner = newOwner;
        
        emit ProductTransferred(productId, msg.sender, newOwner);
    }

    function updateStatus(uint256 productId, string memory status) external onlyProductOwner(productId) {
        require(products[productId].id != 0, "Product does not exist");
        
        products[productId].currentStatus = status;
        productHistory[productId].push(TransitState({
            handler: msg.sender,
            status: status,
            timestamp: block.timestamp
        }));

        emit StatusUpdated(productId, status, msg.sender);
    }

    function getProductDetails(uint256 productId) external view returns (Product memory, TransitState[] memory) {
        require(products[productId].id != 0, "Product does not exist");
        return (products[productId], productHistory[productId]);
    }
}
