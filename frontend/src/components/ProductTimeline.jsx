import { useState } from 'react';
import { Search, CheckCircle2, MapPin, Phone, User, Package, ArrowRight, Clock, Scale, GitBranch } from 'lucide-react';
import { formatPrice, formatQuantity, getRoleName, ROLE_ICONS } from '../types.js';

function ProductTimeline({ contract }) {
  const [scanId, setScanId] = useState('');
  const [history, setHistory] = useState([]);
  const [productInfo, setProductInfo] = useState(null);
  const [childIds, setChildIds] = useState([]);
  const [parentHistory, setParentHistory] = useState([]);
  const [parentProduct, setParentProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTimeline = async (idOverride) => {
    const id = idOverride || scanId;
    if (!contract || !id) return;
    setIsLoading(true);
    setHistory([]); setProductInfo(null); setChildIds([]); setParentHistory([]); setParentProduct(null);

    try {
      const data = await contract.getProductDetails(id);
      const prod = {
        id: Number(data.product.id), name: data.product.name, description: data.product.description,
        category: data.product.category, unit: data.product.unit,
        totalQuantityGrams: Number(data.product.totalQuantityGrams),
        remainingQuantityGrams: Number(data.product.remainingQuantityGrams),
        parentProductId: Number(data.product.parentProductId),
        originFarmer: data.product.originFarmer, currentOwner: data.product.currentOwner,
        currentStatus: data.product.currentStatus, journeyComplete: data.product.journeyComplete,
      };
      setProductInfo(prod);

      const mapped = data.history.map(h => ({
        handler: h.handler, handlerName: h.handlerName, handlerLocation: h.handlerLocation,
        handlerPhone: h.handlerPhone, handlerRole: Number(h.handlerRole), status: h.status,
        quantityGrams: Number(h.quantityGrams), priceInPaise: Number(h.priceInPaise),
        timestamp: Number(h.timestamp) * 1000,
      }));
      setHistory(mapped);

      try { const c = await contract.getChildProducts(id); setChildIds(c.map(x => Number(x))); } catch {}

      if (prod.parentProductId > 0) {
        try {
          const pd = await contract.getProductDetails(prod.parentProductId);
          setParentProduct({
            id: Number(pd.product.id), name: pd.product.name,
            totalQuantityGrams: Number(pd.product.totalQuantityGrams), unit: pd.product.unit,
          });
          setParentHistory(pd.history.map(h => ({
            handler: h.handler, handlerName: h.handlerName, handlerLocation: h.handlerLocation,
            handlerPhone: h.handlerPhone, handlerRole: Number(h.handlerRole), status: h.status,
            quantityGrams: Number(h.quantityGrams), priceInPaise: Number(h.priceInPaise),
            timestamp: Number(h.timestamp) * 1000,
          })));
        } catch {}
      }
    } catch {
      alert('Product not found');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLookup = (id) => { setScanId(String(id)); fetchTimeline(String(id)); };

  const getDotColor = (roleId, status) => {
    if (status === 'Delivered to Consumer') return 'border-consumer bg-consumer/15 text-consumer';
    if (roleId === 1) return 'border-farmer bg-farmer/15 text-farmer';
    if (roleId === 2) return 'border-transporter bg-transporter/15 text-transporter';
    if (roleId === 3) return 'border-retailer bg-retailer/15 text-retailer';
    return 'border-muted bg-muted/15 text-muted';
  };

  const getRoleColor = (roleId) => {
    if (roleId === 1) return 'text-farmer';
    if (roleId === 2) return 'text-transporter';
    if (roleId === 3) return 'text-retailer';
    return 'text-white';
  };

  const getRoleBg = (roleId) => {
    if (roleId === 1) return 'bg-farmer/10 text-farmer';
    if (roleId === 2) return 'bg-transporter/10 text-transporter';
    if (roleId === 3) return 'bg-retailer/10 text-retailer';
    return 'bg-white/10 text-white';
  };

  const fullHistory = productInfo?.parentProductId > 0 ? [...parentHistory, ...history] : history;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Search */}
      <div className="glass-card mb-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-consumer/10 text-consumer flex items-center justify-center"><Search size={20} /></div>
          <div>
            <h2 className="text-lg font-bold">Product Verification</h2>
            <p className="text-xs text-muted">Track the complete journey of any product</p>
          </div>
        </div>
        <div className="flex gap-3">
          <input className="input-field text-base !py-4" type="number" placeholder="Enter Product ID from QR Code..."
            value={scanId} onChange={e => setScanId(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchTimeline()} />
          <button className="btn-primary min-w-[120px]" onClick={() => fetchTimeline()} disabled={isLoading || !scanId}>
            {isLoading ? <span className="spinner" /> : <><Search size={18} /> Track</>}
          </button>
        </div>
      </div>

      {/* Product */}
      {productInfo && (
        <div className="glass-card animate-fade-in">

          {productInfo.journeyComplete && (
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-consumer/10 to-primary/5 border border-consumer/20 rounded-xl mb-5 text-consumer">
              <span className="text-2xl">🏁</span>
              <div className="font-semibold">
                Journey Complete
                <span className="block text-xs opacity-80 font-normal">Delivered to consumer. Supply chain journey ended.</span>
              </div>
            </div>
          )}

          {productInfo.parentProductId > 0 && (
            <button onClick={() => handleLookup(productInfo.parentProductId)}
              className="mb-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-retailer/10 text-retailer rounded-lg text-sm font-semibold border border-retailer/15 hover:bg-retailer/20 transition-all">
              <GitBranch size={14} /> Split from Batch #{productInfo.parentProductId}
              {parentProduct && <span className="opacity-60 ml-1">({formatQuantity(parentProduct.totalQuantityGrams, parentProduct.unit)} total)</span>}
            </button>
          )}

          {/* Summary */}
          <div className="flex flex-col sm:flex-row justify-between gap-4 pb-5 mb-5 border-b border-white/5">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h1 className="text-2xl font-extrabold">{productInfo.name}</h1>
                {productInfo.journeyComplete
                  ? <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-consumer/10 text-consumer"><CheckCircle2 size={12} /> Delivered</span>
                  : <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-farmer/10 text-farmer"><Clock size={12} /> Active</span>
                }
              </div>
              <p className="text-muted text-sm mb-2">{productInfo.description}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="role-badge bg-farmer/10 text-farmer text-[0.65rem]">{productInfo.category}</span>
                <span className="text-xs text-dim">Origin: <span className="address-pill !text-[0.7rem] !py-0.5 !px-2">{productInfo.originFarmer.slice(0,8)}...{productInfo.originFarmer.slice(-4)}</span></span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-[0.65rem] text-dim uppercase tracking-widest">Product ID</div>
              <div className="text-3xl font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">#{productInfo.id}</div>
              <div className="flex items-center justify-end gap-1 mt-1">
                <CheckCircle2 size={12} className="text-farmer" />
                <span className="text-[0.7rem] text-farmer">Verified On-Chain</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-3 flex-wrap mb-5">
            {[
              { val: formatQuantity(productInfo.totalQuantityGrams, productInfo.unit), label: 'Total Stock', color: 'text-primary' },
              { val: formatQuantity(productInfo.remainingQuantityGrams, productInfo.unit), label: 'Remaining', color: 'text-secondary' },
              { val: String(fullHistory.length), label: 'Events', color: 'text-retailer' },
              ...(fullHistory.length > 0 ? [{ val: formatPrice(fullHistory[fullHistory.length - 1].priceInPaise), label: 'Latest Price', color: 'text-consumer' }] : []),
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center px-5 py-3 bg-white/[0.02] border border-white/5 rounded-xl min-w-[100px]">
                <span className={`text-xl font-extrabold ${s.color}`}>{s.val}</span>
                <span className="text-[0.65rem] font-semibold text-dim uppercase tracking-widest mt-0.5">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Price Journey */}
          {fullHistory.length > 1 && (
            <div className="flex items-center gap-0 p-5 bg-white/[0.02] border border-white/5 rounded-xl overflow-x-auto mb-5">
              {fullHistory.map((h, i) => (
                <div key={i} className="flex items-center">
                  <div className="flex flex-col items-center min-w-[80px]">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base mb-1 border ${getDotColor(h.handlerRole, h.status)}`}>
                      {ROLE_ICONS[getRoleName(h.handlerRole)] || '📋'}
                    </div>
                    <span className="text-sm font-bold text-primary">{formatPrice(h.priceInPaise)}</span>
                    <span className="text-[0.6rem] text-dim uppercase">{getRoleName(h.handlerRole)}</span>
                  </div>
                  {i < fullHistory.length - 1 && <span className="text-dim text-lg px-1">→</span>}
                </div>
              ))}
            </div>
          )}

          {/* Timeline */}
          <h3 className="flex items-center gap-2 mt-5 mb-1 text-base font-bold">
            <Clock size={16} className="text-primary" /> Supply Chain Journey
            {productInfo.parentProductId > 0 && <span className="text-[0.7rem] text-dim font-normal">(includes parent history)</span>}
          </h3>

          <div className="relative pl-9 mt-4">
            {/* Vertical line */}
            <div className="absolute left-3 top-1 bottom-1 w-0.5 bg-gradient-to-b from-primary via-secondary to-transparent rounded-full" />

            {fullHistory.map((event, idx) => {
              const roleName = getRoleName(event.handlerRole);
              const isLatest = idx === fullHistory.length - 1;
              const isFromParent = productInfo.parentProductId > 0 && idx < parentHistory.length;

              return (
                <div key={idx} className="relative pb-5 animate-slide-in" style={{ animationDelay: `${idx * 80}ms` }}>
                  {/* Dot */}
                  <div className={`absolute -left-9 top-1.5 w-6 h-6 rounded-full flex items-center justify-center text-[10px] border-2 z-10 ${getDotColor(event.handlerRole, event.status)}`}>
                    {event.status === 'Delivered to Consumer' ? '✓' : '•'}
                  </div>

                  {/* Content */}
                  <div className={`p-4 rounded-xl border transition-all duration-200 hover:bg-white/[0.04] hover:border-white/10 ${
                    isLatest ? 'bg-primary/[0.03] border-primary/15' : isFromParent ? 'bg-retailer/[0.02] border-retailer/10' : 'bg-white/[0.02] border-white/5'
                  }`}>
                    {/* Status */}
                    <div className={`text-base font-bold mb-3 flex items-center gap-2 ${isLatest ? 'text-primary' : getRoleColor(event.handlerRole)}`}>
                      {event.status}
                      {isFromParent && <span className="text-[0.6rem] bg-retailer/10 text-retailer px-1.5 py-0.5 rounded font-semibold">PARENT</span>}
                      {isLatest && !isFromParent && <span className="text-[0.6rem] bg-farmer/10 text-farmer px-1.5 py-0.5 rounded font-semibold">LATEST</span>}
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm">
                      <div>
                        <span className="text-[0.65rem] font-semibold text-dim uppercase tracking-wider flex items-center gap-1"><User size={9} /> Handler</span>
                        <span className="font-medium">{event.handlerName} <span className={`role-badge ${getRoleBg(event.handlerRole)} !text-[0.55rem] !py-0.5 !px-1.5 ml-1`}>{ROLE_ICONS[roleName]} {roleName}</span></span>
                      </div>
                      <div>
                        <span className="text-[0.65rem] font-semibold text-dim uppercase tracking-wider flex items-center gap-1"><MapPin size={9} /> Location</span>
                        <span className="font-medium">{event.handlerLocation}</span>
                      </div>
                      <div>
                        <span className="text-[0.65rem] font-semibold text-dim uppercase tracking-wider flex items-center gap-1"><Phone size={9} /> Phone</span>
                        <span className="font-medium">{event.handlerPhone}</span>
                      </div>
                      <div>
                        <span className="text-[0.65rem] font-semibold text-dim uppercase tracking-wider flex items-center gap-1"><Scale size={9} /> Quantity</span>
                        <span className="quantity-tag !text-xs !py-0 !px-1.5">{formatQuantity(event.quantityGrams, productInfo.unit)}</span>
                      </div>
                      <div>
                        <span className="text-[0.65rem] font-semibold text-dim uppercase tracking-wider">💰 Price</span>
                        <span className="price-tag !text-sm !py-0 !px-2">{formatPrice(event.priceInPaise)}</span>
                      </div>
                      <div>
                        <span className="text-[0.65rem] font-semibold text-dim uppercase tracking-wider flex items-center gap-1"><Clock size={9} /> Time</span>
                        <span className="font-medium">{new Date(event.timestamp).toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {/* Wallet */}
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/[0.04] text-xs text-dim">
                      <span>Wallet: <span className="address-pill !text-[0.65rem] !py-0.5 !px-2">{event.handler.slice(0,8)}...{event.handler.slice(-6)}</span></span>
                      <span>{new Date(event.timestamp).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Child Batches */}
          {childIds.length > 0 && (
            <div className="mt-5 p-4 bg-white/[0.02] border border-white/5 rounded-xl">
              <h4 className="text-xs text-muted uppercase tracking-widest mb-2 flex items-center gap-1.5"><GitBranch size={13} /> Split Batches ({childIds.length})</h4>
              <p className="text-xs text-muted mb-3">Partial transfers created these child batches:</p>
              {childIds.map(cId => (
                <span key={cId} onClick={() => handleLookup(cId)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 text-accent rounded-lg text-sm font-semibold border border-accent/15 cursor-pointer hover:bg-accent/20 transition-all mr-2 mb-2">
                  <Package size={13} /> Batch #{cId} <ArrowRight size={11} />
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty */}
      {!productInfo && !isLoading && (
        <div className="glass-card text-center py-16">
          <div className="text-5xl opacity-30 mb-4">🔍</div>
          <h3 className="text-muted font-medium text-lg">Enter a Product ID to begin tracking</h3>
          <p className="text-dim text-sm max-w-sm mx-auto mt-2">Scan the QR code or enter the ID manually to view the supply chain journey.</p>
        </div>
      )}
    </div>
  );
}

export default ProductTimeline;
