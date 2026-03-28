import { useRef, useState } from 'react';
import { pantryApi } from '../services/api';

export default function BarcodePage() {
  const [barcode, setBarcode] = useState('');
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [status, setStatus] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function showStatus(msg: string, type: 'success' | 'error' | 'info') {
    setStatus({ msg, type });
    setTimeout(() => setStatus(null), 5000);
  }

  function handleBarcodeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setBarcode(val);
    if (val.length >= 8) {
      // Lookup against a small mock product DB
      const mockProducts: Record<string, string> = {
        '123456789012': 'Organic Bananas',
        '987654321098': 'Whole Milk',
        '456789123456': 'Bread Loaf',
      };
      const found = mockProducts[val];
      if (found) {
        setProductName(found);
        showStatus(`Product found: ${found}`, 'success');
      } else {
        setProductName(`Product ${val}`);
        showStatus('Unknown barcode — enter a name manually.', 'info');
      }
    }
  }

  async function handleAddToInventory(e: React.FormEvent) {
    e.preventDefault();
    if (!productName.trim()) return;
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1) {
      showStatus('Quantity must be at least 1.', 'error');
      return;
    }
    try {
      await pantryApi.add({ name: productName.trim(), quantity: qty });
      showStatus(`Added "${productName}" to pantry!`, 'success');
      setBarcode('');
      setProductName('');
      setQuantity('1');
      inputRef.current?.focus();
    } catch {
      showStatus('Failed to add item to pantry.', 'error');
    }
  }

  return (
    <div className="container">
      <div className="header">
        <h1>Barcode Scanner</h1>
        <p>Scan or enter a barcode to add items to your pantry</p>
      </div>

      {status && (
        <div className={`status-message status-${status.type}`}>{status.msg}</div>
      )}

      <div className="panel" style={{ marginBottom: '2rem' }}>
        <div className="scanner-section">
          <h3>Enter Barcode</h3>
          <p style={{ color: 'var(--accent-lighter)', marginBottom: '1rem', lineHeight: '1.6' }}>
            Connect a USB or Bluetooth barcode scanner and scan directly into the field below,
            or type a barcode manually.
          </p>
          <div className="form-group">
            <label htmlFor="barcodeInput">Barcode</label>
            <input
              ref={inputRef}
              id="barcodeInput"
              className="form-control"
              type="text"
              placeholder="Scan or type barcode here..."
              value={barcode}
              onChange={handleBarcodeChange}
              autoFocus
            />
          </div>
        </div>

        {productName && (
          <form onSubmit={handleAddToInventory} className="fade-in">
            <div className="scanner-result" style={{
              background: 'rgba(5,150,105,0.08)',
              border: '1px solid rgba(5,150,105,0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '1.5rem',
              marginBottom: '1.5rem',
            }}>
              <p style={{ color: 'var(--accent-light)', fontWeight: 700, marginBottom: '0.5rem' }}>
                Product Identified
              </p>
              <div className="barcode-display">{barcode}</div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="productName">Product Name</label>
                <input
                  id="productName"
                  className="form-control"
                  type="text"
                  value={productName}
                  onChange={e => setProductName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="scanQty">Quantity</label>
                <input
                  id="scanQty"
                  className="form-control"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                />
              </div>
            </div>
            <button className="btn" type="submit">Add to Pantry</button>
          </form>
        )}
      </div>

      <div className="panel">
        <h2 style={{ color: 'var(--accent-light)', marginBottom: '1rem' }}>Camera Scanner</h2>
        <p style={{ color: 'var(--accent-lighter)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
          Camera-based barcode scanning (using the device camera) is coming in a future update.
          For now, use a USB/Bluetooth scanner or manually enter the barcode above.
        </p>
        <div className="camera-container" style={{
          background: 'rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '200px',
          borderRadius: 'var(--radius-md)',
          border: '2px dashed var(--border)',
        }}>
          <p style={{ color: 'var(--muted)', fontSize: '1rem' }}>Camera preview (coming soon)</p>
        </div>
      </div>
    </div>
  );
}
