import React, { useState } from 'react';
import QRCode from 'react-qr-code';
import { QrCode, Plus, ArrowRight, RefreshCw } from 'lucide-react';
import type { Role } from '../types';

interface DashboardProps {
  role: Role;
  contract: any;
  account: string;
}

const Dashboard: React.FC<DashboardProps> = ({ role, contract, account }) => {
  const [productName, setProductName] = useState('');
  const [newProductId, setNewProductId] = useState<number | null>(null);
  
  const [scanId, setScanId] = useState('');
  const [scannedProduct, setScannedProduct] = useState<any>(null);
  
  const [newAddress, setNewAddress] = useState('');
  const [newStatus, setNewStatus] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);

  // MOCK QR SCANNER interaction - simply taking ID field for simplicity, 
  // but it represents the "Scan" action in our hackathon pitch
  const handleScan = async () => {
    if (!contract || !scanId) return;
    setIsLoading(true);
    try {
      const data = await contract.getProductDetails(scanId);
      setScannedProduct({
        id: Number(data.product.id),
        name: data.product.name,
        originFarmer: data.product.originFarmer,
        currentOwner: data.product.currentOwner,
        currentStatus: data.product.currentStatus,
      });
    } catch (e) {
      console.error(e);
      alert("Product not found or error reading from chain");
    } finally {
      setIsLoading(false);
    }
  };

  const createProduct = async () => {
    if (!contract || !productName) return;
    setIsLoading(true);
    try {
      const tx = await contract.createProduct(productName);
      const receipt = await tx.wait();
      
      // Parse event to get ID
      const event = receipt?.logs?.find((log: any) => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed?.name === 'ProductCreated';
        } catch { return false; }
      });
      
      if (event) {
        const parsedContext = contract.interface.parseLog(event);
        setNewProductId(Number(parsedContext?.args?.productId));
      } else {
        alert("Product created but ID not captured. Check timeline.");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to create product");
    } finally {
      setIsLoading(false);
      setProductName('');
    }
  };

  const transferProduct = async () => {
    if (!contract || !scannedProduct || !newAddress) return;
    setIsLoading(true);
    try {
      const tx = await contract.transferOwnership(scannedProduct.id, newAddress);
      await tx.wait();
      alert("Transferred successfully");
      handleScan(); // refreshing
    } catch (e) {
      console.error(e);
      alert("Transfer failed. Make sure you are the current owner.");
    } finally {
      setIsLoading(false);
      setNewAddress('');
    }
  };

  const updateStatus = async () => {
    if (!contract || !scannedProduct || !newStatus) return;
    setIsLoading(true);
    try {
      const tx = await contract.updateStatus(scannedProduct.id, newStatus);
      await tx.wait();
      alert("Status updated successfully");
      handleScan(); // refreshing
    } catch (e) {
      console.error(e);
      alert("Status update failed. Make sure you are the current owner.");
    } finally {
      setIsLoading(false);
      setNewStatus('');
    }
  };

  const isOwner = scannedProduct && scannedProduct.currentOwner.toLowerCase() === account.toLowerCase();

  return (
    <div className="dashboard-grid">
      {/* Farmer Specific Panel */}
      {role === 'Farmer' && (
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <Plus color="var(--primary-glow)" />
            <h2 style={{ margin: 0 }}>Register New Product</h2>
          </div>
          <p style={{ color: 'var(--text-muted)' }}>Mint a new product on the blockchain to begin tracking its origin.</p>
          
          <input 
            type="text" 
            placeholder="e.g. Organic Arabica Coffee Beans - Batch #49" 
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
          />
          <button className="btn-primary" onClick={createProduct} disabled={isLoading || !productName} style={{ width: '100%', justifyContent: 'center' }}>
            {isLoading ? 'Processing...' : 'Create Product Entry'}
          </button>

          {newProductId && (
            <div style={{ marginTop: '2rem', textAlign: 'center', background: 'rgba(0, 255, 136, 0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(0, 255, 136, 0.2)' }}>
              <h3 style={{ color: 'var(--success)' }}>Product Minted! ID: {newProductId}</h3>
              <div className="qrcode-container">
                <QRCode value={newProductId.toString()} size={150} />
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Print and attach this QR to the physical good.</p>
            </div>
          )}
        </div>
      )}

      {/* Interaction Panel (Transporter / Retailer / Farmer) */}
      {(role === 'Transporter' || role === 'Retailer' || role === 'Farmer') && (
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <QrCode color="var(--secondary-glow)" />
            <h2 style={{ margin: 0 }}>Scan & Act</h2>
          </div>
          <p style={{ color: 'var(--text-muted)' }}>Simulate QR scan by entering Product ID. You can transfer ownership or update status if you are the current owner.</p>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="number" 
              placeholder="Product ID (from QR)" 
              value={scanId}
              onChange={(e) => setScanId(e.target.value)}
              style={{ marginBottom: 0 }}
            />
            <button className="btn-secondary" onClick={handleScan} disabled={isLoading || !scanId}>
              Lookup
            </button>
          </div>

          {scannedProduct && (
            <div style={{ marginTop: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-card)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0 }}>{scannedProduct.name}</h3>
                <span className="address-pill">ID: {scannedProduct.id}</span>
              </div>
              <div style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
                <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Status: <span style={{ color: 'var(--text-main)' }}>{scannedProduct.currentStatus}</span></div>
                <div style={{ color: 'var(--text-muted)' }}>Owner: <span style={{ fontFamily: 'monospace', color: isOwner ? 'var(--primary-glow)' : 'var(--text-main)' }}>{isOwner ? 'You (Ready to Manage)' : scannedProduct.currentOwner.slice(0, 10) + '...'}</span></div>
              </div>

              {isOwner ? (
                <>
                  <div style={{ borderTop: '1px solid var(--border-card)', paddingTop: '1rem', marginTop: '1rem' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>Update Status</label>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                      <input type="text" placeholder="e.g. In Transit to Warehouse" value={newStatus} onChange={(e) => setNewStatus(e.target.value)} style={{ marginBottom: 0 }} />
                      <button className="btn-secondary" onClick={updateStatus} disabled={isLoading || !newStatus}><RefreshCw size={18} /></button>
                    </div>

                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>Transfer Ownership</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input type="text" placeholder="0x... Recipient Address" value={newAddress} onChange={(e) => setNewAddress(e.target.value)} style={{ marginBottom: 0 }} />
                      <button className="btn-secondary" onClick={transferProduct} disabled={isLoading || !newAddress}><ArrowRight size={18} /></button>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ marginTop: '1rem', padding: '0.5rem', background: 'rgba(255, 59, 59, 0.1)', color: 'var(--danger)', borderRadius: '8px', fontSize: '0.85rem', textAlign: 'center' }}>
                  You are not the current owner of this product. Ownership must be transferred to you before you can update it.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
