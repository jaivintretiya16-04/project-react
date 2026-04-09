import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { Plus, Search, ArrowRight, RefreshCw, Package, CheckCircle, AlertTriangle } from 'lucide-react';
import { formatPrice, formatQuantity, CATEGORIES, UNITS, ROLE_ICONS, getRoleName } from '../types.js';

function Dashboard({ role, contract, account, profile }) {
  // ─── Create Product ───
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodCategory, setProdCategory] = useState('');
  const [prodUnit, setProdUnit] = useState('kg');
  const [prodQuantity, setProdQuantity] = useState('');
  const [farmerPrice, setFarmerPrice] = useState('');
  const [nextId, setNextId] = useState(null);
  const [successData, setSuccessData] = useState(null);

  // ─── Scan ───
  const [scanId, setScanId] = useState('');
  const [scannedProduct, setScannedProduct] = useState(null);
  const [scannedHistory, setScannedHistory] = useState([]);

  // Transfer
  const [transferAddress, setTransferAddress] = useState('');
  const [transferQuantity, setTransferQuantity] = useState('');
  const [transferStatus, setTransferStatus] = useState('');
  const [transferPrice, setTransferPrice] = useState('');

  // Status
  const [statusText, setStatusText] = useState('');
  const [statusPrice, setStatusPrice] = useState('');

  // Deliver
  const [deliverPrice, setDeliverPrice] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [activeAction, setActiveAction] = useState(null);

  useEffect(() => {
    if (contract && role === 'Farmer') fetchNextId();
  }, [contract, role]);

  const fetchNextId = async () => {
    try {
      const id = await contract.nextProductId();
      setNextId(Number(id));
    } catch (e) {
      console.error('Could not fetch next product ID', e);
    }
  };

  const toGrams = (value, unit) => {
    const num = parseFloat(value);
    if (isNaN(num)) return 0;
    if (unit === 'kg') return Math.round(num * 1000);
    if (unit === 'liters') return Math.round(num * 1000);
    if (unit === 'tons') return Math.round(num * 1000000);
    if (unit === 'quintals') return Math.round(num * 100000);
    return Math.round(num);
  };

  const toPaise = (rupees) => {
    const num = parseFloat(rupees);
    return isNaN(num) ? 0 : Math.round(num * 100);
  };

  // ─── CREATE PRODUCT ───
  const createProduct = async () => {
    if (!contract || !prodName || !prodQuantity || !farmerPrice || !profile) return;
    setIsLoading(true);
    try {
      const assignedId = nextId;
      const tx = await contract.createProduct(
        prodName,
        prodDesc || 'No description',
        prodCategory || 'Other',
        prodUnit,
        toGrams(prodQuantity, prodUnit),
        profile.name,
        profile.location,
        profile.phone,
        toPaise(farmerPrice)
      );
      await tx.wait();
      setSuccessData({ id: assignedId, name: prodName });
      setProdName(''); setProdDesc(''); setProdCategory(''); setProdQuantity(''); setFarmerPrice('');
      fetchNextId();
    } catch (e) {
      console.error(e);
      alert('Failed: ' + (e?.reason || e?.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  // ─── SCAN ───
  const handleScan = async () => {
    if (!contract || !scanId) return;
    setIsLoading(true);
    setScannedProduct(null); setScannedHistory([]); setActiveAction(null);
    try {
      const data = await contract.getProductDetails(scanId);
      setScannedProduct({
        id: Number(data.product.id), name: data.product.name, description: data.product.description,
        category: data.product.category, unit: data.product.unit,
        totalQuantityGrams: Number(data.product.totalQuantityGrams),
        remainingQuantityGrams: Number(data.product.remainingQuantityGrams),
        parentProductId: Number(data.product.parentProductId),
        originFarmer: data.product.originFarmer, currentOwner: data.product.currentOwner,
        currentStatus: data.product.currentStatus, journeyComplete: data.product.journeyComplete,
      });
      setScannedHistory(data.history.map(h => ({
        handler: h.handler, handlerName: h.handlerName, handlerRole: Number(h.handlerRole),
        status: h.status, quantityGrams: Number(h.quantityGrams),
        priceInPaise: Number(h.priceInPaise), timestamp: Number(h.timestamp) * 1000,
      })));
    } catch {
      alert('Product not found');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── TRANSFER ───
  const transferProduct = async () => {
    if (!contract || !scannedProduct || !transferAddress || !transferQuantity || !transferStatus || !transferPrice || !profile) return;
    setIsLoading(true);
    try {
      const tx = await contract.transferProduct(
        scannedProduct.id, transferAddress, toGrams(transferQuantity, scannedProduct.unit),
        profile.name, profile.location, profile.phone,
        transferStatus, toPaise(transferPrice)
      );
      await tx.wait();
      alert('✅ Transfer successful!');
      setTransferAddress(''); setTransferQuantity(''); setTransferStatus(''); setTransferPrice('');
      setActiveAction(null); handleScan();
    } catch (e) {
      console.error(e);
      alert('Transfer failed: ' + (e?.reason || e?.message || ''));
    } finally {
      setIsLoading(false);
    }
  };

  // ─── UPDATE STATUS ───
  const updateStatus = async () => {
    if (!contract || !scannedProduct || !statusText || !statusPrice || !profile) return;
    setIsLoading(true);
    try {
      const tx = await contract.updateStatus(
        scannedProduct.id, statusText,
        profile.name, profile.location, profile.phone,
        toPaise(statusPrice)
      );
      await tx.wait();
      alert('✅ Status updated!');
      setStatusText(''); setStatusPrice(''); setActiveAction(null); handleScan();
    } catch (e) {
      console.error(e);
      alert('Failed: ' + (e?.reason || e?.message || ''));
    } finally {
      setIsLoading(false);
    }
  };

  // ─── MARK DELIVERED ───
  const markDelivered = async () => {
    if (!contract || !scannedProduct || !deliverPrice || !profile) return;
    setIsLoading(true);
    try {
      const tx = await contract.markDelivered(
        scannedProduct.id, profile.name, profile.location, profile.phone,
        toPaise(deliverPrice)
      );
      await tx.wait();
      alert('✅ Delivered to consumer! Journey complete.');
      setDeliverPrice(''); setActiveAction(null); handleScan();
    } catch (e) {
      console.error(e);
      alert('Failed: ' + (e?.reason || e?.message || ''));
    } finally {
      setIsLoading(false);
    }
  };

  const isOwner = scannedProduct && scannedProduct.currentOwner.toLowerCase() === account.toLowerCase();
  const isJourneyDone = scannedProduct?.journeyComplete;

  const statusSuggestions = role === 'Farmer'
    ? ['Packed for Dispatch', 'Quality Checked', 'Ready for Pickup']
    : role === 'Transporter'
    ? ['Picked Up', 'In Transit', 'At Warehouse', 'Out for Delivery', 'Delivered to Retailer']
    : ['Received at Store', 'Quality Inspected', 'On Shelf', 'Ready for Sale'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">

      {/* ═══════ FARMER: CREATE PRODUCT ═══════ */}
      {role === 'Farmer' && (
        <div className="glass-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-farmer/10 text-farmer flex items-center justify-center text-lg">🌾</div>
            <div>
              <h2 className="text-lg font-bold">Register New Product</h2>
              <p className="text-xs text-muted">Creating as <strong className="text-farmer">{profile?.name}</strong> · {profile?.location}</p>
            </div>
          </div>

          {/* Show upcoming ID */}
          {nextId && !successData && (
            <div className="mb-5 p-3 rounded-xl bg-primary/5 border border-primary/15 flex items-center gap-3">
              <span className="text-2xl font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">#{nextId}</span>
              <div>
                <p className="text-sm font-semibold text-primary">Your Product ID</p>
                <p className="text-xs text-muted">This ID will be assigned to your product</p>
              </div>
            </div>
          )}

          {/* Success State */}
          {successData && (
            <div className="text-center p-6 rounded-xl bg-farmer/5 border border-farmer/20 mb-5 animate-fade-in">
              <CheckCircle size={32} className="text-farmer mx-auto mb-2" />
              <h3 className="text-farmer font-bold text-lg mb-1">Product Minted! 🎉</h3>
              <p className="text-muted text-sm mb-3">"{successData.name}" — ID: <strong className="text-white">#{successData.id}</strong></p>
              <div className="bg-white p-3 rounded-xl inline-block shadow-[0_0_30px_rgba(255,255,255,0.08)] mb-3">
                <QRCode value={String(successData.id)} size={140} />
              </div>
              <p className="text-xs text-muted mb-4">Print and attach this QR to the product</p>
              <button className="btn-secondary" onClick={() => setSuccessData(null)}>
                <Plus size={16} /> Create Another Product
              </button>
            </div>
          )}

          {/* Create Form — NO personal details needed, auto-uses profile */}
          {!successData && (
            <>
              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl mb-4">
                <p className="text-[0.7rem] font-bold text-muted uppercase tracking-widest mb-3 flex items-center gap-2"><Package size={13} /> Product Details</p>
                <div className="mb-3">
                  <label className="form-label">Product Name *</label>
                  <input className="input-field" placeholder="e.g. Organic Basmati Rice" value={prodName} onChange={e => setProdName(e.target.value)} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea className="input-field min-h-[70px] resize-y" placeholder="e.g. Premium hand-picked..." value={prodDesc} onChange={e => setProdDesc(e.target.value)} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="form-label">Category</label>
                    <select className="input-field" value={prodCategory} onChange={e => setProdCategory(e.target.value)}>
                      <option value="">Select...</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Quantity *</label>
                    <input className="input-field" type="number" placeholder="e.g. 50" value={prodQuantity} onChange={e => setProdQuantity(e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Unit</label>
                    <select className="input-field" value={prodUnit} onChange={e => setProdUnit(e.target.value)}>
                      {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl mb-5">
                <p className="text-[0.7rem] font-bold text-muted uppercase tracking-widest mb-3">💰 Pricing</p>
                <label className="form-label">Total Price (₹) *</label>
                <input className="input-field" type="number" placeholder="e.g. 5000" value={farmerPrice} onChange={e => setFarmerPrice(e.target.value)} />
              </div>

              <button className="btn-primary w-full" onClick={createProduct} disabled={isLoading || !prodName || !prodQuantity || !farmerPrice}>
                {isLoading ? <><span className="spinner" /> Processing...</> : <><Plus size={18} /> Create Product on Blockchain</>}
              </button>
            </>
          )}
        </div>
      )}

      {/* ═══════ SCAN & ACT ═══════ */}
      {(role === 'Farmer' || role === 'Transporter' || role === 'Retailer') && (
        <div className="glass-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center"><Search size={20} /></div>
            <div>
              <h2 className="text-lg font-bold">Scan & Manage Product</h2>
              <p className="text-xs text-muted">Lookup a product by ID</p>
            </div>
          </div>

          <div className="flex gap-2">
            <input className="input-field" type="number" placeholder="Enter Product ID..." value={scanId}
              onChange={e => setScanId(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleScan()} />
            <button className="btn-secondary min-w-[100px]" onClick={handleScan} disabled={isLoading || !scanId}>
              {isLoading && !scannedProduct ? <span className="spinner" /> : 'Lookup'}
            </button>
          </div>

          {scannedProduct && (
            <div className="mt-5 p-5 bg-white/[0.02] border border-white/5 rounded-xl animate-fade-in">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-bold">{scannedProduct.name}</h3>
                  <span className="text-xs text-muted">{scannedProduct.category} · {scannedProduct.description}</span>
                </div>
                <span className="address-pill">#{scannedProduct.id}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm mb-4 pb-4 border-b border-white/5">
                <div><span className="text-xs text-muted block">Status</span><span className={`font-semibold ${isJourneyDone ? 'text-consumer' : 'text-primary'}`}>{isJourneyDone ? '✅ ' : ''}{scannedProduct.currentStatus}</span></div>
                <div><span className="text-xs text-muted block">Owner</span><span className={`font-mono text-sm ${isOwner ? 'text-primary' : ''}`}>{isOwner ? '✨ You' : scannedProduct.currentOwner.slice(0,8)+'...'}</span></div>
                <div><span className="text-xs text-muted block">Remaining</span><span className="quantity-tag text-xs">{formatQuantity(scannedProduct.remainingQuantityGrams, scannedProduct.unit)}</span></div>
                <div><span className="text-xs text-muted block">Total</span><span className="font-medium">{formatQuantity(scannedProduct.totalQuantityGrams, scannedProduct.unit)}</span></div>
              </div>

              {scannedProduct.parentProductId > 0 && (
                <button onClick={() => { setScanId(String(scannedProduct.parentProductId)); setTimeout(handleScan, 100); }}
                  className="mb-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-retailer/10 text-retailer rounded-lg text-sm font-semibold border border-retailer/15 hover:bg-retailer/20 transition-all">
                  ↩ Split from Batch #{scannedProduct.parentProductId}
                </button>
              )}

              {isJourneyDone && (
                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-consumer/10 to-primary/5 border border-consumer/20 rounded-xl mb-4 font-semibold text-consumer">
                  <span className="text-2xl">🏁</span> Journey Complete — Delivered to consumer.
                </div>
              )}

              {/* Actions — forms are now clean, no personal details needed */}
              {isOwner && !isJourneyDone && (
                <>
                  <div className="flex gap-2 flex-wrap mt-2">
                    <button onClick={() => setActiveAction(activeAction === 'transfer' ? null : 'transfer')} className={`flex-1 ${activeAction === 'transfer' ? 'btn-primary' : 'btn-secondary'}`}><ArrowRight size={15} /> Transfer</button>
                    <button onClick={() => setActiveAction(activeAction === 'status' ? null : 'status')} className={`flex-1 ${activeAction === 'status' ? 'btn-primary' : 'btn-secondary'}`}><RefreshCw size={15} /> Update Status</button>
                    {role === 'Retailer' && <button onClick={() => setActiveAction(activeAction === 'deliver' ? null : 'deliver')} className={`flex-1 ${activeAction === 'deliver' ? 'btn-success' : 'btn-secondary'}`}><CheckCircle size={15} /> Deliver</button>}
                  </div>

                  {/* TRANSFER — clean form, no personal details */}
                  {activeAction === 'transfer' && (
                    <div className="mt-4 animate-fade-in">
                      <p className="text-xs text-muted mb-3">Transferring as <strong className="text-primary">{profile?.name}</strong> · {profile?.location}</p>
                      <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl mb-3">
                        <div className="mb-3"><label className="form-label">Recipient Address *</label><input className="input-field" placeholder="0x..." value={transferAddress} onChange={e => setTransferAddress(e.target.value)} /></div>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div><label className="form-label">Quantity ({scannedProduct.unit}) *</label><input className="input-field" type="number" placeholder={`Max: ${formatQuantity(scannedProduct.remainingQuantityGrams, scannedProduct.unit)}`} value={transferQuantity} onChange={e => setTransferQuantity(e.target.value)} /></div>
                          <div><label className="form-label">Price (₹) *</label><input className="input-field" type="number" placeholder="Total price" value={transferPrice} onChange={e => setTransferPrice(e.target.value)} /></div>
                        </div>
                        <div className="mb-2"><label className="form-label">Status *</label><input className="input-field" placeholder="e.g. Dispatched" value={transferStatus} onChange={e => setTransferStatus(e.target.value)} /></div>
                        <div className="flex gap-1.5 flex-wrap">{statusSuggestions.map(s => <button key={s} className="btn-secondary !py-1 !px-2 !text-[0.7rem]" onClick={() => setTransferStatus(s)}>{s}</button>)}</div>
                      </div>
                      <button className="btn-primary w-full" onClick={transferProduct} disabled={isLoading || !transferAddress || !transferQuantity || !transferStatus || !transferPrice}>
                        {isLoading ? <><span className="spinner" /> Processing...</> : <><ArrowRight size={16} /> Confirm Transfer</>}
                      </button>
                    </div>
                  )}

                  {/* STATUS — clean, no personal details */}
                  {activeAction === 'status' && (
                    <div className="mt-4 animate-fade-in">
                      <p className="text-xs text-muted mb-3">Updating as <strong className="text-primary">{profile?.name}</strong> · {profile?.location}</p>
                      <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl mb-3">
                        <div className="mb-2"><label className="form-label">New Status *</label><input className="input-field" placeholder="e.g. Quality Checked" value={statusText} onChange={e => setStatusText(e.target.value)} /></div>
                        <div className="flex gap-1.5 flex-wrap mb-3">{statusSuggestions.map(s => <button key={s} className="btn-secondary !py-1 !px-2 !text-[0.7rem]" onClick={() => setStatusText(s)}>{s}</button>)}</div>
                        <div><label className="form-label">Price (₹) *</label><input className="input-field" type="number" placeholder="Price at this stage" value={statusPrice} onChange={e => setStatusPrice(e.target.value)} /></div>
                      </div>
                      <button className="btn-primary w-full" onClick={updateStatus} disabled={isLoading || !statusText || !statusPrice}>
                        {isLoading ? <><span className="spinner" /> Processing...</> : <><RefreshCw size={16} /> Update Status</>}
                      </button>
                    </div>
                  )}

                  {/* DELIVER — just price needed */}
                  {activeAction === 'deliver' && (
                    <div className="mt-4 animate-fade-in">
                      <p className="text-xs text-muted mb-3">Delivering as <strong className="text-consumer">{profile?.name}</strong> · {profile?.location}</p>
                      <div className="p-4 bg-white/[0.02] border border-consumer/20 rounded-xl mb-3">
                        <p className="text-[0.7rem] font-bold text-consumer uppercase tracking-widest mb-3">🏁 Deliver to Consumer</p>
                        <div className="flex items-center gap-2 p-2 bg-danger/10 text-danger rounded-lg text-xs font-medium mb-3">
                          <AlertTriangle size={14} /> Permanent action — journey ends here.
                        </div>
                        <div><label className="form-label">Final Consumer Price (₹) *</label><input className="input-field" type="number" placeholder="Final selling price" value={deliverPrice} onChange={e => setDeliverPrice(e.target.value)} /></div>
                      </div>
                      <button className="btn-success w-full" onClick={markDelivered} disabled={isLoading || !deliverPrice}>
                        {isLoading ? <><span className="spinner" /> Processing...</> : <><CheckCircle size={16} /> Confirm Delivery</>}
                      </button>
                    </div>
                  )}
                </>
              )}

              {!isOwner && !isJourneyDone && (
                <div className="flex items-center gap-2 p-3 bg-danger/10 text-danger rounded-lg text-sm font-medium mt-3">
                  <AlertTriangle size={14} /> Not the current owner. Transfer ownership first.
                </div>
              )}

              {scannedHistory.length > 0 && (
                <div className="mt-5">
                  <h4 className="text-xs text-muted uppercase tracking-widest mb-3">History ({scannedHistory.length} events)</h4>
                  {scannedHistory.map((h, i) => (
                    <div key={i} className="flex justify-between items-center py-2.5 border-b border-white/5 last:border-0 text-sm">
                      <div className="flex items-center gap-2">
                        <span>{ROLE_ICONS[getRoleName(h.handlerRole)] || '📋'}</span>
                        <span className="font-semibold">{h.status}</span>
                        <span className="text-dim text-xs">by {h.handlerName}</span>
                      </div>
                      <div className="flex gap-2 items-center">
                        <span className="price-tag !text-xs !py-0 !px-1.5">{formatPrice(h.priceInPaise)}</span>
                        <span className="text-dim text-xs">{new Date(h.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
