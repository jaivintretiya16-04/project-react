import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Shield, LogOut, UserCircle, Pencil } from 'lucide-react';
import Dashboard from './components/Dashboard.jsx';
import ProductTimeline from './components/ProductTimeline.jsx';
import { CONTRACT_ADDRESS, CONTRACT_ABI, ROLE_ICONS } from './types.js';
import './index.css';

function App() {
  const [account, setAccount] = useState(null);
  const [role, setRole] = useState('None');
  const [contract, setContract] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isInitializing, setIsInitializing] = useState(true);

  // ─── Profile (saved in localStorage per wallet) ───
  const [profile, setProfile] = useState(null); // { name, location, phone }
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileLocation, setProfileLocation] = useState('');
  const [profilePhone, setProfilePhone] = useState('');

  const getProfileKey = (addr) => `supplychain_profile_${addr?.toLowerCase()}`;

  const loadProfile = (addr) => {
    try {
      const saved = localStorage.getItem(getProfileKey(addr));
      if (saved) {
        const p = JSON.parse(saved);
        setProfile(p);
        setProfileName(p.name);
        setProfileLocation(p.location);
        setProfilePhone(p.phone);
        return p;
      }
    } catch {}
    return null;
  };

  const saveProfile = () => {
    if (!profileName.trim()) return;
    const p = { name: profileName.trim(), location: profileLocation.trim() || 'Not specified', phone: profilePhone.trim() || 'Not specified' };
    localStorage.setItem(getProfileKey(account), JSON.stringify(p));
    setProfile(p);
    setShowProfileForm(false);
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        setIsLoading(true);
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send('eth_requestAccounts', []);
        const signer = await provider.getSigner();
        const addr = accounts[0];
        setAccount(addr);
        const c = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        setContract(c);
        // Load saved profile
        loadProfile(addr);
        try {
          const roleId = await c.getRole(addr);
          const roleNames = ['None', 'Farmer', 'Transporter', 'Retailer'];
          setRole(roleNames[Number(roleId)] || 'None');
        } catch {
          alert('Make sure MetaMask is on Sepolia Testnet (Chain ID: 11155111).');
          setRole('None');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    } else {
      alert('Please install MetaMask!');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const autoConnect = async () => {
      if (window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await provider.listAccounts();
          if (accounts.length > 0) {
            await connectWallet();
          }
          setIsInitializing(false);
        } catch {
          setIsInitializing(false);
        }
      } else {
        setIsInitializing(false);
      }
    };
    autoConnect();
  }, []);

  const registerRole = async (selectedRole) => {
    if (selectedRole === 0) {
      setRole('Consumer');
      setActiveTab('timeline');
      return;
    }
    if (!contract) return;
    try {
      setIsLoading(true);
      const tx = await contract.selfRegister(selectedRole);
      await tx.wait();
      const roleNames = ['None', 'Farmer', 'Transporter', 'Retailer'];
      setRole(roleNames[selectedRole]);
      // After role registration, if no profile yet, show profile form
      if (!profile) {
        setShowProfileForm(true);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to register. Check MetaMask.');
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = () => {
    setAccount(null);
    setRole('None');
    setContract(null);
    setProfile(null);
    setActiveTab('dashboard');
    setShowProfileForm(false);
  };

  // If role is set but no profile, prompt for profile
  const needsProfile = role !== 'None' && role !== 'Consumer' && !profile;

  // ─── INITIALIZING APP ───
  if (isInitializing) {
    return (
      <div className="max-w-6xl mx-auto px-6 flex flex-col items-center justify-center min-h-screen -mt-16">
        <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-3xl flex items-center justify-center text-black mb-8 animate-pulse-glow">
          <Shield size={40} />
        </div>
        <p className="text-secondary tracking-widest text-sm uppercase font-bold"><span className="spinner mr-2" /> Initializing...</p>
      </div>
    );
  }

  // ─── LANDING ───
  if (!account) {
    return (
      <div className="max-w-6xl mx-auto px-6 flex flex-col items-center justify-center min-h-screen -mt-16">
        <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-3xl flex items-center justify-center text-black mb-8 animate-pulse-glow">
          <Shield size={40} />
        </div>
        <h1 className="text-5xl font-extrabold mb-2 tracking-tight">
          SupplyChain<span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Tracker</span>
        </h1>
        <p className="text-muted text-lg text-center max-w-xl mb-10 leading-relaxed">
          Immutable product tracking from farm to consumer.<br />
          Powered by <span className="text-secondary">Ethereum Smart Contracts</span> on the blockchain.
        </p>
        <button className="btn-primary text-lg px-8 py-4" onClick={connectWallet} disabled={isLoading}>
          {isLoading ? <><span className="spinner" /> Connecting...</> : <><Shield size={20} /> Connect Wallet to Start</>}
        </button>
        <p className="mt-6 text-xs text-dim">
          Make sure MetaMask is connected to <strong className="text-muted">Sepolia Testnet</strong>
        </p>
      </div>
    );
  }

  // ─── LOADING STATE AFTER CONNECTING (FETCHING ROLE) ───
  if (isLoading && role === 'None') {
    return (
      <div className="max-w-6xl mx-auto px-6 flex flex-col items-center justify-center min-h-[60vh]">
        <span className="spinner w-8 h-8 mb-4 border-primary"></span>
        <p className="text-primary tracking-widest text-sm uppercase font-bold">Synchronizing with Blockchain...</p>
      </div>
    );
  }

  // ─── ROLE SELECTION ───
  if (role === 'None') {
    return (
      <div className="max-w-6xl mx-auto px-6 pt-6">
        <Header account={account} role={role} profile={profile} disconnect={disconnect} onEditProfile={() => setShowProfileForm(true)} />
        <div className="glass-card text-center max-w-lg mx-auto">
          <h2 className="text-2xl font-bold mb-1">Select Your Role</h2>
          <p className="text-muted text-sm mb-8">Choose how you participate in the supply chain</p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { id: 1, emoji: '🌾', label: 'Farmer', sub: 'Produce & register goods' },
              { id: 2, emoji: '🚛', label: 'Transporter', sub: 'Ship & deliver goods' },
              { id: 3, emoji: '🏪', label: 'Retailer', sub: 'Sell to consumers' },
              { id: 0, emoji: '👤', label: 'Consumer', sub: 'Verify product journey' },
            ].map(r => (
              <button key={r.id} onClick={() => registerRole(r.id)} disabled={isLoading}
                className="flex flex-col items-center gap-2 p-5 rounded-xl border border-white/5 bg-white/[0.02]
                           hover:border-primary hover:bg-primary/[0.04] hover:-translate-y-1 hover:shadow-xl
                           disabled:opacity-40 transition-all duration-200 cursor-pointer">
                <span className="text-3xl">{r.emoji}</span>
                <span className="font-semibold">{r.label}</span>
                <span className="text-xs text-muted">{r.sub}</span>
              </button>
            ))}
          </div>
          {isLoading && <p className="mt-6 text-muted text-sm"><span className="spinner mr-2" /> Registering on blockchain...</p>}
        </div>
      </div>
    );
  }

  // ─── PROFILE FORM (one-time) ───
  if (needsProfile || showProfileForm) {
    return (
      <div className="max-w-6xl mx-auto px-6 pt-6">
        <Header account={account} role={role} profile={profile} disconnect={disconnect} onEditProfile={() => {}} />
        <div className="glass-card max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><UserCircle size={22} /></div>
            <div>
              <h2 className="text-xl font-bold">{profile ? 'Edit Your Profile' : 'Complete Your Profile'}</h2>
              <p className="text-xs text-muted">{profile ? 'Update your details' : 'Enter your details once — they\'ll auto-fill everywhere'}</p>
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label">Your Name *</label>
            <input className="input-field" placeholder="e.g. Ramesh Kumar" value={profileName} onChange={e => setProfileName(e.target.value)} />
          </div>
          <div className="mb-4">
            <label className="form-label">Location</label>
            <input className="input-field" placeholder="e.g. Nashik, Maharashtra" value={profileLocation} onChange={e => setProfileLocation(e.target.value)} />
          </div>
          <div className="mb-6">
            <label className="form-label">Phone Number</label>
            <input className="input-field" placeholder="e.g. +91 98765 43210" value={profilePhone} onChange={e => setProfilePhone(e.target.value)} />
          </div>

          <button className="btn-primary w-full" onClick={saveProfile} disabled={!profileName.trim()}>
            <UserCircle size={18} /> {profile ? 'Update Profile' : 'Save & Continue'}
          </button>

          {profile && (
            <button className="btn-secondary w-full mt-3" onClick={() => setShowProfileForm(false)}>Cancel</button>
          )}
        </div>
      </div>
    );
  }

  // ─── MAIN APP ───
  return (
    <div className="max-w-6xl mx-auto px-6 pt-6 pb-16">
      <Header account={account} role={role} profile={profile} disconnect={disconnect} onEditProfile={() => setShowProfileForm(true)} />

      {/* Tab Nav */}
      {role !== 'Consumer' && (
        <div className="flex mb-8 bg-white/[0.02] rounded-xl p-1 border border-white/5">
          <button onClick={() => setActiveTab('dashboard')}
            className={`flex-1 py-3 px-6 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'dashboard' ? 'bg-primary/10 text-primary font-bold shadow-[0_2px_12px_rgba(0,255,136,0.06)]' : 'text-muted hover:text-white hover:bg-white/[0.03]'
            }`}>{ROLE_ICONS[role]} Dashboard</button>
          <button onClick={() => setActiveTab('timeline')}
            className={`flex-1 py-3 px-6 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'timeline' ? 'bg-primary/10 text-primary font-bold shadow-[0_2px_12px_rgba(0,255,136,0.06)]' : 'text-muted hover:text-white hover:bg-white/[0.03]'
            }`}>🔍 Verify Product</button>
        </div>
      )}

      {activeTab === 'dashboard' && role !== 'Consumer' && <Dashboard role={role} contract={contract} account={account} profile={profile} />}
      {(activeTab === 'timeline' || role === 'Consumer') && <ProductTimeline contract={contract} />}
    </div>
  );
}

// ─── HEADER COMPONENT ───
function Header({ account, role, profile, disconnect, onEditProfile }) {
  return (
    <header className="flex justify-between items-center mb-8 pb-6 border-b border-white/5">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center text-black animate-pulse-glow"><Shield size={22} /></div>
        <div><h1 className="text-xl font-extrabold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">SupplyChain</h1><p className="text-[0.7rem] text-muted uppercase tracking-[3px]">dApp Tracker</p></div>
      </div>
      <div className="flex items-center gap-3">
        {profile && (
          <button onClick={onEditProfile} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/5 hover:bg-white/[0.08] transition-all text-sm">
            <UserCircle size={15} className="text-primary" />
            <span className="font-medium">{profile.name}</span>
            <Pencil size={11} className="text-dim" />
          </button>
        )}
        {role !== 'None' && (
          <span className={`role-badge ${
            role === 'Farmer' ? 'bg-farmer/10 text-farmer' :
            role === 'Transporter' ? 'bg-transporter/10 text-transporter' :
            role === 'Retailer' ? 'bg-retailer/10 text-retailer' :
            'bg-consumer/10 text-consumer'
          }`}>{ROLE_ICONS[role] || '👤'} {role}</span>
        )}
        <span className="address-pill">{account.slice(0, 6)}...{account.slice(-4)}</span>
        <button onClick={disconnect} className="btn-secondary !p-2 !rounded-full"><LogOut size={16} /></button>
      </div>
    </header>
  );
}

export default App;
