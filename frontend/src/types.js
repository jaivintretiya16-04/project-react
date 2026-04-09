// Contract address on Sepolia
export const CONTRACT_ADDRESS = "0x7b66F14C01649e5DdAFf44838A6d17bE7faF862f";

export const ROLE_NAMES = { 0: 'None', 1: 'Farmer', 2: 'Transporter', 3: 'Retailer' };
export const ROLE_ICONS = { Farmer: '🌾', Transporter: '🚛', Retailer: '🏪', Consumer: '👤' };

export const CATEGORIES = [
  'Grains & Cereals', 'Fruits', 'Vegetables', 'Dairy', 'Spices',
  'Coffee & Tea', 'Pulses & Lentils', 'Oils & Fats', 'Sugar & Jaggery', 'Other',
];

export const UNITS = ['kg', 'g', 'liters', 'ml', 'pieces', 'tons', 'quintals'];

export const CONTRACT_ABI = [
  "function selfRegister(uint8 role) external",
  "function getRole(address user) external view returns (uint8)",
  "function nextProductId() external view returns (uint256)",
  "function createProduct(string _name, string _description, string _category, string _unit, uint256 _quantityGrams, string _farmerName, string _farmerLocation, string _farmerPhone, uint256 _priceInPaise) external returns (uint256)",
  "function transferProduct(uint256 _productId, address _to, uint256 _quantityGrams, string _senderName, string _senderLocation, string _senderPhone, string _status, uint256 _priceInPaise) external",
  "function updateStatus(uint256 _productId, string _status, string _updaterName, string _updaterLocation, string _updaterPhone, uint256 _priceInPaise) external",
  "function markDelivered(uint256 _productId, string _retailerName, string _retailerLocation, string _retailerPhone, uint256 _finalPriceInPaise) external",
  "function getProductDetails(uint256 _productId) external view returns (tuple(uint256 id, string name, string description, string category, string unit, uint256 totalQuantityGrams, uint256 remainingQuantityGrams, uint256 parentProductId, address originFarmer, address currentOwner, string currentStatus, bool journeyComplete) product, tuple(address handler, string handlerName, string handlerLocation, string handlerPhone, uint8 handlerRole, string status, uint256 quantityGrams, uint256 priceInPaise, uint256 timestamp)[] history)",
  "function getChildProducts(uint256 _productId) external view returns (uint256[])",
  "function getProductCount() external view returns (uint256)",
  "event RoleAssigned(address indexed user, uint8 role)",
  "event ProductCreated(uint256 indexed productId, string name, address indexed farmer)",
  "event ProductTransferred(uint256 indexed productId, address indexed from, address indexed to, uint256 quantity)",
  "event StatusUpdated(uint256 indexed productId, string status)",
  "event JourneyCompleted(uint256 indexed productId)"
];

export function formatPrice(paise) {
  return '₹' + (paise / 100).toLocaleString('en-IN');
}

export function formatQuantity(grams, unit) {
  if (unit === 'kg') return (grams / 1000).toFixed(2) + ' kg';
  if (unit === 'g') return grams + ' g';
  if (unit === 'liters') return (grams / 1000).toFixed(2) + ' L';
  if (unit === 'ml') return grams + ' ml';
  if (unit === 'tons') return (grams / 1000000).toFixed(3) + ' tons';
  if (unit === 'quintals') return (grams / 100000).toFixed(3) + ' quintals';
  return grams + ' ' + unit;
}

export function getRoleName(roleId) {
  return ROLE_NAMES[roleId] || 'Unknown';
}
