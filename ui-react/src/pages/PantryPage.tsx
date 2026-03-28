import { useEffect, useState } from 'react';
import { pantryApi, type PantryItem } from '../services/api';

type Tab = 'add' | 'inventory';

export default function PantryPage() {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('add');
  const [status, setStatus] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [search, setSearch] = useState('');

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
      showStatus('Item removed.', 'success');
    } catch {
      showStatus('Failed to remove item.', 'error');
    }
  }

  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  const lowStock = items.filter(i => i.quantity <= 2).length;

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
          <div className="form-group">
            <input
              className="form-control"
              type="text"
              placeholder="Search inventory..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
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
                  style={item.quantity <= 2 ? { borderColor: 'var(--warning)' } : {}}
                >
                  <h4>{item.name}</h4>
                  <div className="details">
                    <p>Quantity: <strong>{item.quantity}</strong>
                      {item.quantity <= 2 && <span style={{ color: 'var(--warning)', marginLeft: '0.5rem' }}>Low stock</span>}
                    </p>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn btn-danger" onClick={() => handleRemove(item.id)}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
