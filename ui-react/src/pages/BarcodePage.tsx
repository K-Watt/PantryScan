import { useEffect, useRef, useState } from 'react';
import { pantryApi, type PantryItem, type Product, type RecentScansPage } from '../services/api';

// SQL DATETIME2 comes back without a timezone marker; treat it as UTC.
function formatScanTime(iso?: string | null): string {
  if (!iso) return '';
  const hasTz = /[Zz]$/.test(iso) || /[+-]\d\d:\d\d$/.test(iso);
  const d = new Date(hasTz ? iso : iso + 'Z');
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

// One row per distinct product scanned during this session.
interface SessionEntry {
  barcode: string;
  itemId: number;
  name: string;
  imageUrl?: string | null;
  found: boolean;
  scannedCount: number; // times scanned this session
  quantity: number;     // current pantry quantity
}

export default function BarcodePage() {
  const [bulkMode, setBulkMode] = useState(false);

  // Single-item flow state
  const [barcode, setBarcode] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [product, setProduct] = useState<Product | null>(null);
  const [manualName, setManualName] = useState('');
  const [looking, setLooking] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Server-backed, paginated scan history.
  const [recentData, setRecentData] = useState<RecentScansPage | null>(null);
  const [recentPage, setRecentPage] = useState(1);

  // Bulk flow state
  const [bulkBarcode, setBulkBarcode] = useState('');
  const [session, setSession] = useState<SessionEntry[]>([]);
  const [lastAdded, setLastAdded] = useState<string>('');

  // Review queue — items scanned without a resolved name (server-backed, persists).
  const [reviewItems, setReviewItems] = useState<PantryItem[]>([]);
  const [reviewNames, setReviewNames] = useState<Record<number, string>>({});

  const [status, setStatus] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const bulkInputRef = useRef<HTMLInputElement>(null);
  const idleTimer = useRef<number | undefined>(undefined);
  const lastLookedUp = useRef<string>('');
  const audioRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
    void loadReviewQueue();
    void loadRecent(1);
    return () => window.clearTimeout(idleTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadRecent(page: number) {
    try {
      const data = await pantryApi.recentScans(page, 20);
      setRecentData(data);
      setRecentPage(data.page);
    } catch {
      /* leave the current list if the fetch fails */
    }
  }

  async function loadReviewQueue() {
    try {
      setReviewItems(await pantryApi.reviewQueue());
    } catch {
      /* leave the queue as-is if the fetch fails */
    }
  }

  async function resolveReview(item: PantryItem) {
    const name = (reviewNames[item.id] ?? '').trim();
    if (!name) return;
    try {
      await pantryApi.update(item.id, { name });
      setReviewItems(prev => prev.filter(i => i.id !== item.id));
      setReviewNames(prev => { const n = { ...prev }; delete n[item.id]; return n; });
      // Reflect the new name in the bulk session list too, if present.
      setSession(prev => prev.map(e => (e.itemId === item.id ? { ...e, name, found: true } : e)));
      void loadRecent(recentPage); // reflect the new name in scan history
    } catch {
      showStatus('Failed to save name.', 'error');
    }
  }

  async function dismissReview(item: PantryItem) {
    // Keep the item, just stop flagging it (keeps the placeholder name).
    try {
      await pantryApi.update(item.id, { name: item.name });
      setReviewItems(prev => prev.filter(i => i.id !== item.id));
    } catch {
      showStatus('Failed to update item.', 'error');
    }
  }

  // Keep focus on the scan field whenever bulk mode is active.
  useEffect(() => {
    if (bulkMode) bulkInputRef.current?.focus();
  }, [bulkMode]);

  function showStatus(msg: string, type: 'success' | 'error' | 'info') {
    setStatus({ msg, type });
    window.clearTimeout(idleTimer.current);
    setTimeout(() => setStatus(null), 5000);
  }

  // Short audio cue so you don't have to watch the screen while scanning.
  function beep(ok: boolean) {
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioRef.current) audioRef.current = new Ctx();
      const ctx = audioRef.current;
      if (ctx.state === 'suspended') void ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = ok ? 880 : 240;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + (ok ? 0.13 : 0.28));
      osc.start();
      osc.stop(ctx.currentTime + (ok ? 0.14 : 0.3));
    } catch {
      /* audio not available — silent fallback */
    }
  }

  // ---- Bulk mode -----------------------------------------------------------

  function toggleBulkMode() {
    setBulkMode(v => {
      const next = !v;
      if (!next) { void loadReviewQueue(); void loadRecent(1); } // refresh when leaving bulk mode
      if (next) {
        // A user gesture — safe to spin up / resume the audio context now.
        try {
          const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          if (!audioRef.current) audioRef.current = new Ctx();
          void audioRef.current.resume();
        } catch { /* ignore */ }
      }
      return next;
    });
  }

  async function addByScan(code: string) {
    try {
      const result = await pantryApi.scan(code, 1);
      const { item, found } = result;
      setSession(prev => {
        const idx = prev.findIndex(e => e.barcode === code);
        if (idx >= 0) {
          const row: SessionEntry = {
            ...prev[idx],
            scannedCount: prev[idx].scannedCount + 1,
            quantity: item.quantity,
            itemId: item.itemId,
            name: item.name,
          };
          return [row, ...prev.slice(0, idx), ...prev.slice(idx + 1)];
        }
        return [{
          barcode: code, itemId: item.itemId, name: item.name,
          imageUrl: item.imageUrl, found, scannedCount: 1, quantity: item.quantity,
        }, ...prev];
      });
      setLastAdded(`${found ? '' : '❓ '}${item.name} → ${item.quantity}`);
      beep(found);
      if (item.needsReview) void loadReviewQueue();
    } catch {
      setLastAdded('⚠ Scan failed — try again');
      beep(false);
    }
  }

  function submitBulk(code: string) {
    window.clearTimeout(idleTimer.current);
    const trimmed = code.trim();
    setBulkBarcode('');
    bulkInputRef.current?.focus();
    if (!/^\d{6,}$/.test(trimmed)) return; // ignore stray/partial input
    void addByScan(trimmed);
  }

  function handleBulkChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setBulkBarcode(val);
    // Fallback for scanners not configured to send Enter: submit after a brief idle.
    window.clearTimeout(idleTimer.current);
    if (val.trim().length >= 8) {
      idleTimer.current = window.setTimeout(() => submitBulk(val), 180);
    }
  }

  function handleBulkKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitBulk(bulkBarcode);
    }
  }

  async function adjustSessionQty(entry: SessionEntry, delta: number) {
    const newQty = Math.max(0, entry.quantity + delta);
    setSession(prev => prev.map(e => (e.barcode === entry.barcode ? { ...e, quantity: newQty } : e)));
    try {
      await pantryApi.update(entry.itemId, { quantity: newQty });
    } catch {
      showStatus('Failed to update quantity.', 'error');
    }
  }

  async function removeSessionRow(entry: SessionEntry) {
    setSession(prev => prev.filter(e => e.barcode !== entry.barcode));
    try {
      await pantryApi.remove(entry.itemId);
    } catch {
      showStatus('Failed to remove item.', 'error');
    }
  }

  const totalUnits = session.reduce((s, e) => s + e.scannedCount, 0);

  // ---- Single-item mode ----------------------------------------------------

  async function lookup(code: string) {
    const trimmed = code.trim();
    if (!/^\d{6,}$/.test(trimmed)) {
      showStatus('Enter a valid numeric barcode (at least 6 digits).', 'error');
      return;
    }
    if (trimmed === lastLookedUp.current) return;
    lastLookedUp.current = trimmed;

    setLooking(true);
    setProduct(null);
    setNotFound(false);
    try {
      const p = await pantryApi.lookup(trimmed);
      if (p && p.name) {
        setProduct(p);
        showStatus(`Found: ${p.name}`, 'success');
      } else {
        setNotFound(true);
        setManualName('');
        showStatus('Unknown barcode — enter a product name to add it manually.', 'info');
      }
    } catch {
      setNotFound(true);
      showStatus('Lookup failed. You can still add the item manually.', 'error');
    } finally {
      setLooking(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setBarcode(val);
    setProduct(null);
    setNotFound(false);
    lastLookedUp.current = '';
    window.clearTimeout(idleTimer.current);
    if (val.trim().length >= 8) {
      idleTimer.current = window.setTimeout(() => lookup(val), 250);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      window.clearTimeout(idleTimer.current);
      lookup(barcode);
    }
  }

  function resetForNextScan() {
    setBarcode('');
    setProduct(null);
    setManualName('');
    setNotFound(false);
    setQuantity('1');
    lastLookedUp.current = '';
    inputRef.current?.focus();
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1) {
      showStatus('Quantity must be at least 1.', 'error');
      return;
    }
    const name = product?.name ?? manualName.trim();
    if (!name) {
      showStatus('Enter a product name.', 'error');
      return;
    }
    try {
      const result = await pantryApi.scan(barcode.trim(), qty, manualName.trim() || undefined);
      showStatus(`Added "${result.item.name}" — pantry now has ${result.item.quantity}.`, 'success');
      void loadRecent(1);
      if (result.item.needsReview) void loadReviewQueue();
      resetForNextScan();
    } catch {
      showStatus('Failed to add item to pantry.', 'error');
    }
  }

  const showForm = product !== null || notFound;

  return (
    <div className="container">
      <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
        <div>
          <h1>Barcode Scanner</h1>
          <p>{bulkMode ? 'Bulk mode — scan item after item, hands-free' : 'Scan a product barcode to look it up and add it to your pantry'}</p>
        </div>
        <button
          type="button"
          className={`btn${bulkMode ? ' btn-danger' : ''}`}
          style={{ whiteSpace: 'nowrap' }}
          onClick={toggleBulkMode}
        >
          {bulkMode ? 'Exit Bulk Mode' : '⚡ Bulk Mode'}
        </button>
      </div>

      {status && <div className={`status-message status-${status.type}`}>{status.msg}</div>}

      {reviewItems.length > 0 && (
        <div
          className="panel"
          style={{ marginBottom: '2rem', borderColor: 'var(--warning)', boxShadow: '0 0 0 1px var(--warning)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
            <span style={{
              background: 'var(--warning)', color: '#111', fontWeight: 800, borderRadius: 999,
              padding: '0.1rem 0.6rem', fontSize: '0.9rem',
            }}>{reviewItems.length}</span>
            <h2 style={{ margin: 0, color: 'var(--warning)' }}>Needs Review</h2>
          </div>
          <p style={{ color: 'var(--accent-lighter)', marginBottom: '1rem', lineHeight: 1.6 }}>
            These barcodes weren’t in the product database, so they were added with placeholder names.
            Give each a real name (they’re already in your pantry with the right quantity).
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {reviewItems.map(item => (
              <li key={item.id} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.6rem 0', borderBottom: '1px solid var(--border)', flexWrap: 'wrap',
              }}>
                {item.imageUrl
                  ? <img src={item.imageUrl} alt="" style={{ width: 40, height: 40, objectFit: 'contain', background: '#fff', borderRadius: 6 }} />
                  : <div style={{ width: 40, height: 40, borderRadius: 6, background: 'rgba(0,0,0,0.2)' }} />}
                <div style={{ color: 'var(--muted)', fontSize: '0.78rem', minWidth: '9rem' }}>
                  <div>#{item.barcode}</div>
                  <div>in pantry: ×{item.quantity}</div>
                </div>
                <input
                  className="form-control"
                  style={{ flex: 1, minWidth: '10rem' }}
                  placeholder="Product name…"
                  value={reviewNames[item.id] ?? ''}
                  onChange={e => setReviewNames(prev => ({ ...prev, [item.id]: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter') resolveReview(item); }}
                />
                <button type="button" className="btn" style={{ padding: '0.4rem 1rem' }}
                  disabled={!(reviewNames[item.id] ?? '').trim()} onClick={() => resolveReview(item)}>
                  Save
                </button>
                <button type="button" className="btn btn-secondary" style={{ padding: '0.4rem 0.85rem' }}
                  title="Keep placeholder name and remove from this list" onClick={() => dismissReview(item)}>
                  Skip
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {bulkMode ? (
        /* ---------------- BULK MODE ---------------- */
        <>
          <div
            className="panel"
            style={{
              marginBottom: '2rem',
              borderColor: 'var(--accent)',
              boxShadow: '0 0 0 1px var(--accent)',
            }}
            onClick={() => bulkInputRef.current?.focus()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <span className="pulse-dot" />
              <h3 style={{ margin: 0, color: 'var(--accent-light)' }}>Listening for scans…</h3>
            </div>
            <p style={{ color: 'var(--accent-lighter)', marginBottom: '1rem', lineHeight: 1.6 }}>
              Just keep scanning — every scan adds one to your pantry automatically. Scan the same
              product again to increase its count. No need to click anything.
            </p>
            <input
              ref={bulkInputRef}
              className="form-control"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="Scan now…"
              value={bulkBarcode}
              onChange={handleBulkChange}
              onKeyDown={handleBulkKeyDown}
              onBlur={() => { if (bulkMode) setTimeout(() => bulkInputRef.current?.focus(), 60); }}
              style={{ fontSize: '1.25rem', padding: '0.9rem 1rem' }}
              autoFocus
            />

            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div><span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-light)' }}>{totalUnits}</span>
                <span style={{ color: 'var(--muted)', marginLeft: '0.4rem' }}>units scanned</span></div>
              <div><span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-light)' }}>{session.length}</span>
                <span style={{ color: 'var(--muted)', marginLeft: '0.4rem' }}>products</span></div>
              {lastAdded && <div style={{ marginLeft: 'auto', color: 'var(--text-bright)', fontWeight: 600 }}>Last: {lastAdded}</div>}
            </div>
          </div>

          <div className="panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ color: 'var(--accent-light)', margin: 0 }}>This Session</h2>
              {session.length > 0 && (
                <button type="button" className="btn btn-secondary" style={{ padding: '0.3rem 0.85rem', fontSize: '0.85rem' }}
                  onClick={() => { setSession([]); setLastAdded(''); bulkInputRef.current?.focus(); }}>
                  Clear list
                </button>
              )}
            </div>
            {session.length === 0 ? (
              <p style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
                Nothing scanned yet. Point your scanner at a barcode and pull the trigger — items will
                stack up here as you go.
              </p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {session.map(e => (
                  <li key={e.barcode} className="fade-in" style={{
                    display: 'flex', alignItems: 'center', gap: '0.85rem',
                    padding: '0.65rem 0', borderBottom: '1px solid var(--border)',
                  }}>
                    {e.imageUrl
                      ? <img src={e.imageUrl} alt="" style={{ width: 44, height: 44, objectFit: 'contain', background: '#fff', borderRadius: 6 }} />
                      : <div style={{ width: 44, height: 44, borderRadius: 6, background: 'rgba(0,0,0,0.2)' }} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600 }}>{e.name}</div>
                      <div style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>
                        {e.barcode}{!e.found && <span style={{ color: 'var(--warning)' }}> · unknown, rename later</span>}
                        {e.scannedCount > 1 && ` · scanned ×${e.scannedCount}`}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }} onClick={ev => ev.stopPropagation()}>
                      <button type="button" className="qty-btn" aria-label="Decrease" disabled={e.quantity <= 0} onClick={() => adjustSessionQty(e, -1)}>−</button>
                      <span style={{ minWidth: '2ch', textAlign: 'center', fontWeight: 700 }}>{e.quantity}</span>
                      <button type="button" className="qty-btn" aria-label="Increase" onClick={() => adjustSessionQty(e, 1)}>+</button>
                      <button type="button" className="qty-btn" aria-label="Remove" title="Remove from pantry"
                        style={{ marginLeft: '0.35rem', color: 'var(--danger)' }} onClick={() => removeSessionRow(e)}>×</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : (
        /* ---------------- SINGLE-ITEM MODE ---------------- */
        <>
          <div className="panel" style={{ marginBottom: '2rem' }}>
            <div className="scanner-section">
              <h3>Scan or Enter Barcode</h3>
              <p style={{ color: 'var(--accent-lighter)', marginBottom: '1rem', lineHeight: '1.6' }}>
                Point your Bluetooth/USB scanner at a product and pull the trigger — the barcode drops
                into the field below and looks up automatically. You can also type a barcode and press Enter.
                Putting away a whole haul? Try <strong>Bulk Mode</strong> above.
              </p>
              <div className="form-group">
                <label htmlFor="barcodeInput">Barcode</label>
                <input
                  ref={inputRef}
                  id="barcodeInput"
                  className="form-control"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="Scan or type barcode, then Enter…"
                  value={barcode}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  autoFocus
                />
              </div>
              {looking && <p style={{ color: 'var(--muted)' }}>Looking up product…</p>}
            </div>

            {showForm && (
              <form onSubmit={handleAdd} className="fade-in">
                <div className="scanner-result" style={{
                  display: 'flex', gap: '1.25rem', alignItems: 'center',
                  background: product ? 'rgba(5,150,105,0.08)' : 'rgba(180,120,0,0.08)',
                  border: `1px solid ${product ? 'rgba(5,150,105,0.3)' : 'rgba(180,120,0,0.3)'}`,
                  borderRadius: 'var(--radius-md)', padding: '1.5rem', marginBottom: '1.5rem',
                }}>
                  {product?.imageUrl && (
                    <img src={product.imageUrl} alt={product.name ?? 'Product'}
                      style={{ width: 80, height: 80, objectFit: 'contain', borderRadius: 'var(--radius-sm)', background: '#fff' }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <p style={{ color: product ? 'var(--accent-light)' : 'var(--muted)', fontWeight: 700, marginBottom: '0.35rem' }}>
                      {product ? 'Product Identified' : 'Unknown Product'}
                    </p>
                    {product ? (
                      <>
                        <div style={{ fontSize: '1.15rem', fontWeight: 600 }}>{product.name}</div>
                        {product.brand && <div style={{ color: 'var(--accent-lighter)' }}>{product.brand}</div>}
                        {product.packageSize && <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{product.packageSize}</div>}
                        <div style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: '0.35rem' }}>
                          {product.source === 'cache' ? 'From local database' : 'From OpenFoodFacts (now cached locally)'}
                        </div>
                      </>
                    ) : (
                      <div style={{ color: 'var(--accent-lighter)' }}>
                        This barcode isn’t in the database. Add a name below and it’ll be saved to your pantry.
                      </div>
                    )}
                    <div className="barcode-display" style={{ marginTop: '0.5rem' }}>{barcode}</div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="productName">Product Name</label>
                    <input id="productName" className="form-control" type="text"
                      value={product?.name ?? manualName}
                      onChange={e => { setManualName(e.target.value); if (product) setProduct({ ...product, name: e.target.value }); }}
                      required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="scanQty">Quantity</label>
                    <input id="scanQty" className="form-control" type="number" min="1"
                      value={quantity} onChange={e => setQuantity(e.target.value)} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button className="btn" type="submit">Add to Pantry</button>
                  <button className="btn btn-secondary" type="button" onClick={resetForNextScan}>Clear</button>
                </div>
              </form>
            )}
          </div>

          <div className="panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ color: 'var(--accent-light)', margin: 0 }}>Recently Scanned</h2>
              {recentData && recentData.total > 0 && (
                <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{recentData.total} total</span>
              )}
            </div>
            {!recentData || recentData.items.length === 0 ? (
              <p style={{ color: 'var(--muted)', lineHeight: '1.6' }}>
                Scanned items show up here with the date you last scanned them — newest first.
                Scan something to get started.
              </p>
            ) : (
              <>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {recentData.items.map(r => (
                    <li key={r.id} style={{
                      display: 'flex', alignItems: 'center', gap: '0.85rem',
                      padding: '0.65rem 0', borderBottom: '1px solid var(--border)',
                    }}>
                      {r.imageUrl
                        ? <img src={r.imageUrl} alt="" style={{ width: 36, height: 36, objectFit: 'contain', background: '#fff', borderRadius: 4 }} />
                        : <div style={{ width: 36, height: 36, borderRadius: 4, background: 'rgba(0,0,0,0.2)' }} />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600 }}>{r.name}</div>
                        <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>
                          {formatScanTime(r.lastScannedAt)}
                          {r.needsReview && <span style={{ color: 'var(--warning)' }}> · needs review</span>}
                        </div>
                      </div>
                      <div style={{ color: 'var(--accent-light)', fontWeight: 700 }}>×{r.quantity}</div>
                    </li>
                  ))}
                </ul>
                {recentData.totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
                    <button type="button" className="btn btn-secondary" style={{ padding: '0.35rem 0.9rem' }}
                      disabled={recentPage <= 1} onClick={() => loadRecent(recentPage - 1)}>← Prev</button>
                    <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                      Page {recentData.page} of {recentData.totalPages}
                    </span>
                    <button type="button" className="btn btn-secondary" style={{ padding: '0.35rem 0.9rem' }}
                      disabled={recentPage >= recentData.totalPages} onClick={() => loadRecent(recentPage + 1)}>Next →</button>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
