// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract SupplyChain {
    address public owner;

    enum Role { None, Farmer, Transporter, Retailer }
    mapping(address => Role) public userRoles;

    struct TransitState {
        address handler;
        string handlerName;
        string handlerLocation;
        string handlerPhone;
        Role handlerRole;
        string status;
        uint256 quantityGrams;
        uint256 priceInPaise;
        uint256 timestamp;
    }

    struct Product {
        uint256 id;
        string name;
        string description;
        string category;
        string unit;
        uint256 totalQuantityGrams;
        uint256 remainingQuantityGrams;
        uint256 parentProductId;
        address originFarmer;
        address currentOwner;
        string currentStatus;
        bool journeyComplete;
    }

    mapping(uint256 => Product) public products;
    mapping(uint256 => TransitState[]) public productHistory;
    mapping(uint256 => uint256[]) public childProducts;
    uint256 public nextProductId = 1;

    event RoleAssigned(address indexed user, Role role);
    event ProductCreated(uint256 indexed productId, string name, address indexed farmer);
    event ProductTransferred(uint256 indexed productId, address indexed from, address indexed to, uint256 quantity);
    event StatusUpdated(uint256 indexed productId, string status);
    event JourneyCompleted(uint256 indexed productId);

    modifier onlyProductOwner(uint256 productId) {
        require(products[productId].currentOwner == msg.sender, "Not the product owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // ──────────────── ROLE MANAGEMENT ────────────────

    function selfRegister(Role role) external {
        require(role != Role.None, "Invalid role");
        userRoles[msg.sender] = role;
        emit RoleAssigned(msg.sender, role);
    }

    function getRole(address user) external view returns (Role) {
        return userRoles[user];
    }

    // ──────────────── PRODUCT LIFECYCLE ────────────────

    function createProduct(
        string memory _name,
        string memory _description,
        string memory _category,
        string memory _unit,
        uint256 _quantityGrams,
        string memory _farmerName,
        string memory _farmerLocation, 
        string memory _farmerPhone,
        uint256 _priceInPaise
    ) external returns (uint256) {
        require(userRoles[msg.sender] == Role.Farmer, "Only farmers can create");

        uint256 pId = nextProductId++;

        Product storage p = products[pId];
        p.id = pId;
        p.name = _name;
        p.description = _description;
        p.category = _category;
        p.unit = _unit;
        p.totalQuantityGrams = _quantityGrams;
        p.remainingQuantityGrams = _quantityGrams;
        p.parentProductId = 0;
        p.originFarmer = msg.sender;
        p.currentOwner = msg.sender;
        p.currentStatus = "Harvested / Manufactured";
        p.journeyComplete = false;

        _addHistory(
            pId,
            msg.sender,
            _farmerName,
            _farmerLocation,
            _farmerPhone,
            Role.Farmer,
            "Harvested / Manufactured",
            _quantityGrams,
            _priceInPaise
        );

        emit ProductCreated(pId, _name, msg.sender);
        return pId;
    }

    function transferProduct(
        uint256 _productId,
        address _to,
        uint256 _quantityGrams,
        string memory _senderName,
        string memory _senderLocation,
        string memory _senderPhone,
        string memory _status,
        uint256 _priceInPaise
    ) external onlyProductOwner(_productId) {
        Product storage prod = products[_productId];
        require(!prod.journeyComplete, "Journey already complete");
        require(prod.id != 0, "Product does not exist");
        require(_quantityGrams > 0 && _quantityGrams <= prod.remainingQuantityGrams, "Invalid quantity");

        if (_quantityGrams == prod.remainingQuantityGrams) {
            // Full transfer
            prod.currentOwner = _to;
            prod.currentStatus = _status;

            _addHistory(
                _productId,
                msg.sender,
                _senderName,
                _senderLocation,
                _senderPhone,
                userRoles[msg.sender],
                _status,
                _quantityGrams,
                _priceInPaise
            );
        } else {
            // Partial transfer — split into child batch
            prod.remainingQuantityGrams -= _quantityGrams;

            uint256 childId = nextProductId++;
            Product storage child = products[childId];
            child.id = childId;
            child.name = prod.name;
            child.description = prod.description;
            child.category = prod.category;
            child.unit = prod.unit;
            child.totalQuantityGrams = _quantityGrams;
            child.remainingQuantityGrams = _quantityGrams;
            child.parentProductId = _productId;
            child.originFarmer = prod.originFarmer;
            child.currentOwner = _to;
            child.currentStatus = _status;
            child.journeyComplete = false;

            _addHistory(
                childId,
                msg.sender,
                _senderName,
                _senderLocation,
                _senderPhone,
                userRoles[msg.sender],
                _status,
                _quantityGrams,
                _priceInPaise
            );

            childProducts[_productId].push(childId);
            emit ProductCreated(childId, prod.name, prod.originFarmer);
        }

        emit ProductTransferred(_productId, msg.sender, _to, _quantityGrams);
    }

    function updateStatus(
        uint256 _productId,
        string memory _status,
        string memory _updaterName,
        string memory _updaterLocation,
        string memory _updaterPhone,
        uint256 _priceInPaise
    ) external onlyProductOwner(_productId) {
        require(!products[_productId].journeyComplete, "Journey already complete");
        require(products[_productId].id != 0, "Product does not exist");

        products[_productId].currentStatus = _status;

        _addHistory(
            _productId,
            msg.sender,
            _updaterName,
            _updaterLocation,
            _updaterPhone,
            userRoles[msg.sender],
            _status,
            products[_productId].remainingQuantityGrams,
            _priceInPaise
        );

        emit StatusUpdated(_productId, _status);
    }

    function markDelivered(
        uint256 _productId,
        string memory _retailerName,
        string memory _retailerLocation,
        string memory _retailerPhone,
        uint256 _finalPriceInPaise
    ) external onlyProductOwner(_productId) {
        require(userRoles[msg.sender] == Role.Retailer, "Only retailers can mark delivery");
        require(!products[_productId].journeyComplete, "Already delivered");
        require(products[_productId].id != 0, "Product does not exist");

        products[_productId].journeyComplete = true;
        products[_productId].currentStatus = "Delivered to Consumer";

        _addHistory(
            _productId,
            msg.sender,
            _retailerName,
            _retailerLocation,
            _retailerPhone,
            Role.Retailer,
            "Delivered to Consumer",
            products[_productId].remainingQuantityGrams,
            _finalPriceInPaise
        );

        emit JourneyCompleted(_productId);
    }

    // ──────────────── VIEW FUNCTIONS ────────────────

    function getProductDetails(uint256 _productId)
        external
        view
        returns (Product memory product, TransitState[] memory history)
    {
        require(products[_productId].id != 0, "Product not found");
        return (products[_productId], productHistory[_productId]);
    }

    function getChildProducts(uint256 _productId)
        external
        view
        returns (uint256[] memory)
    {
        return childProducts[_productId];
    }

    function getProductCount() external view returns (uint256) {
        return nextProductId - 1;
    }

    // ──────────────── INTERNAL HELPERS ────────────────

    function _addHistory(
        uint256 _productId,
        address _handler,
        string memory _name,
        string memory _location,
        string memory _phone,
        Role _role,
        string memory _status,
        uint256 _quantity,
        uint256 _price
    ) internal {
        productHistory[_productId].push(TransitState({
            handler: _handler,
            handlerName: _name,
            handlerLocation: _location,
            handlerPhone: _phone,
            handlerRole: _role,
            status: _status,
            quantityGrams: _quantity,
            priceInPaise: _price,
            timestamp: block.timestamp
        }));
    }
}
