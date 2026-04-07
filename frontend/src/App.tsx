import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Shield, Box, Tractor, Store, TrendingUp, Scan, LogOut } from 'lucide-react';
import Dashboard from './components/Dashboard';
import ProductTimeline from './components/ProductTimeline';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from './types';
import type { Role } from './types';
import './index.css';

function App() {
  const [account, setAccount] = useState<string | null>(null);
  const [role, setRole] = useState<Role>('None');
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'timeline'>('dashboard');

  const connectWallet = async () => {
    if ((window as any).ethereum) {
      try {
        setIsLoading(true);
        // Request account access
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        setAccount(accounts[0]);
        
        // Setup Contract
        const supplyChainContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        setContract(supplyChainContract);
        
        // Fetch role
        try {
          const roleId = await supplyChainContract.getRole(accounts[0]);
          const roleNames: Role[] = ['None', 'Farmer', 'Transporter', 'Retailer'];
          setRole(roleNames[Number(roleId)] || 'None'); 
        } catch (e) {
          console.error("Error fetching role, defaulting to None", e);
          alert("Network error: Make sure MetaMask is connected to Sepolia Testnet (Chain ID 11155111) and the Contract Address in types.ts is correct.");
          setRole('None');
        }
      } catch (error) {
        console.error("Error connecting to wallet:", error);
      } finally {
        setIsLoading(false);
      }
    } else {
      alert("Please install MetaMask to use this application.");
    }
  };

  const registerRole = async (selectedRole: number) => {
    // Consumer doesn't need to write to blockchain
    if (selectedRole === 0) {
      setRole('Consumer');
      return;
    }

    if (!contract) return;
    try {
      setIsLoading(true);
      const tx = await contract.selfRegister(selectedRole);
      await tx.wait();
      
      const roleNames: Role[] = ['None', 'Farmer', 'Transporter', 'Retailer'];
      setRole(roleNames[selectedRole]);
    } catch (e) {
      console.error(e);
      alert("Failed to register role. Check MetaMask and your ETH balance.");
    } finally {
      setIsLoading(false);
    }
  };

  // Render Role Badge
  const RoleBadge = () => {
    let icon = <TrendingUp size={14} />;
    if (role === 'Farmer') icon = <Tractor size={14} />;
    if (role === 'Transporter') icon = <Box size={14} />;
    if (role === 'Retailer') icon = <Store size={14} />;
    
    return (
      <div className={`role-badge ${role.toLowerCase()}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {icon} {role}
      </div>
    );
  };

  if (!account) {
    return (
      <div className="app-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', marginTop: '-10vh' }}>
        <div className="branding-icon" style={{ width: '80px', height: '80px', marginBottom: '2rem' }}>
          <Shield size={40} />
        </div>
        <h1 style={{ fontSize: '3rem', margin: '0 0 1rem 0' }}>SupplyChain<span style={{ color: 'var(--primary-glow)' }}>Tracker</span></h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '3rem', fontSize: '1.2rem', textAlign: 'center', maxWidth: '600px' }}>
          Immutable tracking from farm to consumer. Powered by Ethereum Smart Contracts.
        </p>
        <button className="btn-primary" onClick={connectWallet} disabled={isLoading} style={{ fontSize: '1.2rem', padding: '1rem 2.5rem' }}>
          {isLoading ? 'Connecting...' : 'Connect Wallet to Start'}
        </button>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header>
        <div className="branding">
          <div className="branding-icon">
            <Shield size={24} />
          </div>
          <div className="branding-text">
            <h1>SupplyChain</h1>
            <p>dApp Tracker</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {role !== 'None' ? (
            <RoleBadge />
          ) : null}
          <div className="address-pill">
            {account.slice(0, 6)}...{account.slice(-4)}
          </div>
          <button className="btn-secondary" onClick={() => { setAccount(null); setRole('None'); setContract(null); }} style={{ padding: '0.5rem', borderRadius: '50%' }}>
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {role === 'None' && (
        <div className="glass-card" style={{ textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
          <h2>Select Your Role</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>To interact with the smart contract, please register your role in the supply chain.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button className="btn-secondary" onClick={() => registerRole(1)} disabled={isLoading} style={{ justifyContent: 'center', padding: '1rem' }}><Tractor size={20} /> Register as Farmer (Producer)</button>
            <button className="btn-secondary" onClick={() => registerRole(2)} disabled={isLoading} style={{ justifyContent: 'center', padding: '1rem' }}><Box size={20} /> Register as Transporter</button>
            <button className="btn-secondary" onClick={() => registerRole(3)} disabled={isLoading} style={{ justifyContent: 'center', padding: '1rem' }}><Store size={20} /> Register as Retailer</button>
            <button className="btn-secondary" onClick={() => registerRole(0)} disabled={isLoading} style={{ justifyContent: 'center', padding: '1rem', border: '1px solid rgba(255,255,255,0.2)' }}><Scan size={20} /> Continue as Consumer (View Only)</button>
          </div>
        </div>
      )}

      {role !== 'None' && (
        <>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-card)' }}>
            {role !== 'Consumer' && (
              <button 
                style={{ padding: '1rem', color: activeTab === 'dashboard' ? 'var(--primary-glow)' : 'var(--text-main)', borderBottom: activeTab === 'dashboard' ? '2px solid var(--primary-glow)' : '2px solid transparent', fontWeight: activeTab === 'dashboard' ? 'bold' : 'normal' }}
                onClick={() => setActiveTab('dashboard')}
              >
                Dashboard
              </button>
            )}
            <button 
              style={{ padding: '1rem', color: (activeTab === 'timeline' || role === 'Consumer') ? 'var(--primary-glow)' : 'var(--text-main)', borderBottom: (activeTab === 'timeline' || role === 'Consumer') ? '2px solid var(--primary-glow)' : '2px solid transparent', fontWeight: (activeTab === 'timeline' || role === 'Consumer') ? 'bold' : 'normal' }}
              onClick={() => setActiveTab('timeline')}
            >
              Verify Product Detail
            </button>
          </div>

          {(activeTab === 'dashboard' && role !== 'Consumer') && <Dashboard role={role} contract={contract} account={account} />}
          {(activeTab === 'timeline' || role === 'Consumer') && <ProductTimeline contract={contract} />}
        </>
      )}
    </div>
  );
}

export default App;
