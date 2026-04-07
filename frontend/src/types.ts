export type Role = 'None' | 'Farmer' | 'Transporter' | 'Retailer' | 'Consumer';

export interface TransitState {
  handler: string;
  status: string;
  timestamp: string | number; // formatting might vary
}

export interface Product {
  id: number;
  name: string;
  originFarmer: string;
  currentOwner: string;
  currentStatus: string;
  history: TransitState[];
}

// Local mock address or deployment address
export const CONTRACT_ADDRESS = "0x369E18B45a53072BB58457929811F77503B31c88";

export const CONTRACT_ABI = [
  "function registerRole(address user, uint8 role) external",
  "function selfRegister(uint8 role) external",
  "function getRole(address user) external view returns (uint8)",
  "function createProduct(string memory _name) external returns (uint256)",
  "function transferOwnership(uint256 productId, address newOwner) external",
  "function updateStatus(uint256 productId, string memory status) external",
  "function getProductDetails(uint256 productId) external view returns (tuple(uint256 id, string name, address originFarmer, address currentOwner, string currentStatus) product, tuple(address handler, string status, uint256 timestamp)[] history)",
  "event RoleAssigned(address indexed user, uint8 role)",
  "event ProductCreated(uint256 indexed productId, string name, address indexed farmer)",
  "event ProductTransferred(uint256 indexed productId, address indexed from, address indexed to)",
  "event StatusUpdated(uint256 indexed productId, string status, address indexed by)"
];
