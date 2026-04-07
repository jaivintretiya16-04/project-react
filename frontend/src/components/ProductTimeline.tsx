import React, { useState } from 'react';
import { Search, MapPin, CheckCircle2 } from 'lucide-react';

interface ProductTimelineProps {
  contract: any;
}

const ProductTimeline: React.FC<ProductTimelineProps> = ({ contract }) => {
  const [scanId, setScanId] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [productInfo, setProductInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTimeline = async () => {
    if (!contract || !scanId) return;
    setIsLoading(true);
    setHistory([]);
    setProductInfo(null);
    try {
      const data = await contract.getProductDetails(scanId);
      
      setProductInfo({
        id: Number(data.product.id),
        name: data.product.name,
        originFarmer: data.product.originFarmer,
        currentOwner: data.product.currentOwner,
        currentStatus: data.product.currentStatus,
      });

      // Map history tuples
      const mappedHistory = data.history.map((h: any) => ({
        handler: h.handler,
        status: h.status,
        timestamp: Number(h.timestamp) * 1000 // solidity timestamp is seconds
      }));

      // Sort newest first or oldest first. Let's do latest at top
      setHistory(mappedHistory.reverse());

    } catch (e) {
      console.error(e);
      alert("Product not found");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1rem 0' }}>
          <Search color="var(--primary-glow)" /> Consumer Verification
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Verify the authenticity and journey of any product by entering the ID from its QR code. No special role required.
        </p>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <input 
            type="number" 
            placeholder="Product ID (e.g., 1)" 
            value={scanId}
            onChange={(e) => setScanId(e.target.value)}
            style={{ marginBottom: 0, fontSize: '1.2rem', padding: '1.2rem' }}
          />
          <button className="btn-primary" onClick={fetchTimeline} disabled={isLoading || !scanId}>
            {isLoading ? 'Loading...' : 'Track'}
          </button>
        </div>
      </div>

      {productInfo && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-card)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <h1 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)' }}>{productInfo.name}</h1>
              <div style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                <CheckCircle2 size={16} /> Authenticity Verified On-Chain
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Product ID</div>
              <div style={{ fontSize: '1.5rem', fontFamily: 'monospace', color: 'var(--primary-glow)' }}>#{productInfo.id}</div>
            </div>
          </div>

          <h3 style={{ marginBottom: '1rem' }}>Supply Chain Journey</h3>
          
          <div className="timeline">
            {history.map((event, idx) => (
              <div key={idx} className={`timeline-item ${idx === 0 ? 'completed' : ''}`}>
                <div className="timeline-content">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: idx === 0 ? 'var(--primary-glow)' : 'var(--text-main)' }}>
                      <MapPin size={16} /> {event.status}
                    </h3>
                  </div>
                  <div className="timeline-meta">
                    <div>
                      <span style={{ display: 'block', marginBottom: '4px' }}>Recorded by:</span>
                      <span className="address-pill">{event.handler}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ display: 'block', marginBottom: '4px' }}>Time:</span>
                      {new Date(event.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}
    </div>
  );
};

export default ProductTimeline;
