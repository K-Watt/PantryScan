import { useEffect, useState } from 'react';
import { pantryApi, type PantryItem } from '../services/api';
import NutritionModal from '../components/NutritionModal';

type Tab = 'add' | 'inventory';
type SortBy = 'recent' | 'name' | 'qty-desc' | 'qty-asc';
type FilterMode = 'all' | 'low' | 'scanned';

export default function PantryPage() {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('inventory');
  const [status, setStatus] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('recent');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [editMode, setEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selected, setSelected] = useState<PantryItem | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    try {
      const data = await pantryApi.list();
      setItems(data);
    } catch {
      showStatus('Could not load pantry items. Is the API running?', 'error');
    } finally {
      setLoading(false);
    }
  }

  function showStatus(msg: string, type: 'success' | 'error' | 'info') {
    setStatus({ msg, type });
    setTimeout(() => setStatus(null), 4000);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1) {
      showStatus('Quantity must be at least 1.', 'error');
      return;
    }
    try {
      const item = await pantryApi.add({ name: name.trim(), quantity: qty });
      setItems(prev => [...prev, item]);
      showStatus(`Added "${item.name}" to pantry.`, 'success');
      setName('');
      setQuantity('1');
    } catch {
      showStatus('Failed to add item.', 'error');
    }
  }

  async function handleRemove(id: number) {
    try {
      await pantryApi.remove(id);
      setItems(prev => prev.filter(i => i.id !== id));
      setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
      showStatus('Item removed.', 'success');
    } catch {
      showStatus('Failed to remove item.', 'error');
    }
  }

  function toggleSelect(id: number) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleEditMode() {
    setEditMode(v => {
      if (v) setSelectedIds(new Set()); // clear selection when leaving edit mode
      return !v;
    });
  }

  async function handleDeleteSelected() {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    if (!window.confirm(`Delete ${ids.length} item${ids.length > 1 ? 's' : ''} from your pantry?`)) return;

    const results = await Promise.allSettled(ids.map(id => pantryApi.remove(id)));
    const deleted = ids.filter((_, idx) => results[idx].status === 'fulfilled');
    const failed = ids.length - deleted.length;

    setItems(prev => prev.filter(i => !deleted.includes(i.id)));
    setSelectedIds(new Set());
    if (failed === 0) showStatus(`Deleted ${deleted.length} item${deleted.length > 1 ? 's' : ''}.`, 'success');
    else showStatus(`Deleted ${deleted.length}, but ${failed} failed.`, 'error');
  }

  async function patchItem(id: number, patch: Partial<PantryItem>, failMsg: string) {
    const prevItems = items;
    // Optimistic update so the controls feel instant.
    setItems(prev => prev.map(i => (i.id === id ? { ...i, ...patch } : i)));
    setSelected(sel => (sel && sel.id === id ? { ...sel, ...patch } : sel));
    try {
      await pantryApi.update(id, patch);
    } catch {
      setItems(prevItems); // roll back on failure
      showStatus(failMsg, 'error');
    }
  }

  function handleSetQuantity(id: number, newQty: number) {
    if (isNaN(newQty) || newQty < 0) return;
    patchItem(id, { quantity: newQty }, 'Failed to update quantity.');
  }

  function handleSetThreshold(id: number, threshold: number) {
    if (isNaN(threshold) || threshold < 0) return;
    patchItem(id, { lowStockThreshold: threshold }, 'Failed to update low-stock level.');
  }

  const isLow = (i: PantryItem) => i.quantity <= (i.lowStockThreshold ?? 2);

  const lowStock = items.filter(isLow).length;
  const scannedCount = items.filter(i => !!i.barcode).length;

  const filtered = items
    .filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
    .filter(i => {
      if (filterMode === 'low') return isLow(i);
      if (filterMode === 'scanned') return !!i.barcode;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'qty-desc': return b.quantity - a.quantity;
        case 'qty-asc': return a.quantity - b.quantity;
        default: return b.id - a.id; // recent first (matches API order)
      }
    });

  return (
    <div className="container">
      <div className="header">
        <h1>Pantry Inventory</h1>
        <p>Manage your kitchen stock with ease</p>
      </div>

      <div className="stats">
        <div className="stat-card">
          <h3>{items.length}</h3>
          <p>Total Items</p>
        </div>
        <div className="stat-card">
          <h3>{lowStock}</h3>
          <p>Low Stock</p>
        </div>
      </div>

      <div className="nav-tabs">
        <button
          className={`nav-tab${tab === 'add' ? ' active' : ''}`}
          onClick={() => setTab('add')}
        >
          Add Item
        </button>
        <button
          className={`nav-tab${tab === 'inventory' ? ' active' : ''}`}
          onClick={() => setTab('inventory')}
        >
          View Inventory
        </button>
      </div>

      {status && (
        <div className={`status-message status-${status.type}`}>{status.msg}</div>
      )}

      {tab === 'add' && (
        <div className="panel fade-in">
          <h2 style={{ color: 'var(--accent-light)', marginBottom: '1.5rem' }}>
            Add Item Manually
          </h2>
          <form onSubmit={handleAdd}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="itemName">Item Name</label>
                <input
                  id="itemName"
                  className="form-control"
                  type="text"
                  placeholder="e.g., Chicken Breast"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="itemQty">Quantity</label>
                <input
                  id="itemQty"
                  className="form-control"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  required
                />
              </div>
            </div>
            <button className="btn" type="submit">Add to Pantry</button>
          </form>
        </div>
      )}

      {tab === 'inventory' && (
        <div className="panel fade-in">
          <h2 style={{ color: 'var(--accent-light)', marginBottom: '1.5rem' }}>
            Current Inventory
          </h2>
          <div className="form-row" style={{ alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: 2 }}>
              <label htmlFor="invSearch">Search</label>
              <input
                id="invSearch"
                className="form-control"
                type="text"
                placeholder="Search inventory..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="invSort">Sort by</label>
              <select id="invSort" className="form-control" value={sortBy} onChange={e => setSortBy(e.target.value as SortBy)}>
                <option value="recent">Recently added</option>
                <option value="name">Name (A–Z)</option>
                <option value="qty-desc">Quantity (high → low)</option>
                <option value="qty-asc">Quantity (low → high)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', margin: '0.25rem 0 1rem' }}>
            {([
              ['all', `All (${items.length})`],
              ['low', `Low stock (${lowStock})`],
              ['scanned', `Scanned (${scannedCount})`],
            ] as [FilterMode, string][]).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                className={`nav-tab${filterMode === mode ? ' active' : ''}`}
                style={{ padding: '0.35rem 0.9rem', fontSize: '0.85rem' }}
                onClick={() => setFilterMode(mode)}
              >
                {label}
              </button>
            ))}
            {editMode && (
              <button
                type="button"
                className="btn btn-danger"
                style={{ marginLeft: 'auto', padding: '0.35rem 1rem', fontSize: '0.85rem' }}
                disabled={selectedIds.size === 0}
                onClick={handleDeleteSelected}
              >
                Delete selected ({selectedIds.size})
              </button>
            )}
            <button
              type="button"
              className={`btn${editMode ? '' : ' btn-secondary'}`}
              style={{ marginLeft: editMode ? '0.5rem' : 'auto', padding: '0.35rem 1rem', fontSize: '0.85rem' }}
              onClick={toggleEditMode}
            >
              {editMode ? 'Done' : 'Edit'}
            </button>
          </div>
          {loading ? (
            <div className="loading">Loading inventory</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--accent-lighter)' }}>
              {items.length === 0 ? 'No items yet — add some above!' : 'No items match your search.'}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem', marginTop: '1rem' }}>
              {filtered.map(item => (
                <div
                  key={item.id}
                  className="card"
                  onClick={() => (editMode ? toggleSelect(item.id) : setSelected(item))}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => { if (e.key === 'Enter') editMode ? toggleSelect(item.id) : setSelected(item); }}
                  title={editMode ? 'Click to select' : 'View nutrition & details'}
                  style={{
                    cursor: 'pointer',
                    ...(selectedIds.has(item.id)
                      ? { borderColor: 'var(--accent)', boxShadow: '0 0 0 1px var(--accent)' }
                      : isLow(item) ? { borderColor: 'var(--warning)' } : {}),
                  }}
                >
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    {editMode && (
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item.id)}
                        onClick={e => e.stopPropagation()}
                        onChange={() => toggleSelect(item.id)}
                        aria-label={`Select ${item.name}`}
                        style={{ width: 18, height: 18, marginTop: 4, flexShrink: 0, cursor: 'pointer' }}
                      />
                    )}
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt=""
                        style={{ width: 64, height: 64, objectFit: 'contain', background: '#fff', borderRadius: 6, flexShrink: 0 }}
                      />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ margin: 0 }}>{item.name}</h4>
                      {item.brand && (
                        <div style={{ color: 'var(--accent-lighter)', fontSize: '0.85rem' }}>{item.brand}</div>
                      )}
                      {item.barcode && (
                        <div style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>#{item.barcode}</div>
                      )}
                    </div>
                  </div>
                  <div className="details" onClick={editMode ? e => e.stopPropagation() : undefined}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ color: 'var(--text)' }}>Quantity:</span>
                      {editMode ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <button
                            type="button"
                            className="qty-btn"
                            aria-label="Decrease quantity"
                            disabled={item.quantity <= 0}
                            onClick={() => handleSetQuantity(item.id, item.quantity - 1)}
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min="0"
                            className="form-control qty-input"
                            value={item.quantity}
                            onChange={e => handleSetQuantity(item.id, parseInt(e.target.value, 10))}
                            style={{ width: '3.5rem', textAlign: 'center', padding: '0.3rem' }}
                          />
                          <button
                            type="button"
                            className="qty-btn"
                            aria-label="Increase quantity"
                            onClick={() => handleSetQuantity(item.id, item.quantity + 1)}
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <strong style={{ color: 'var(--text-bright)' }}>{item.quantity}</strong>
                      )}
                      {isLow(item) && <span style={{ color: 'var(--warning)', marginLeft: '0.25rem' }}>Low stock</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--accent-light)', fontSize: '0.8rem' }}>
                      {editMode ? 'Click card to select' : item.barcode ? 'View nutrition →' : 'Details →'}
                    </span>
                    {editMode && (
                      <button
                        className="btn btn-danger"
                        onClick={e => { e.stopPropagation(); handleRemove(item.id); }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selected && (
        <NutritionModal
          item={selected}
          onClose={() => setSelected(null)}
          onSetQuantity={q => handleSetQuantity(selected.id, q)}
          onSetThreshold={t => handleSetThreshold(selected.id, t)}
        />
      )}
    </div>
  );
}
