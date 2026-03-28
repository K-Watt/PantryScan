import { useEffect, useState } from 'react';
import { shoppingApi, type ShoppingItem } from '../services/api';

export default function ShoppingPage() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    try {
      const data = await shoppingApi.list();
      setItems(data);
    } catch {
      showStatus('Could not load shopping list. Is the API running?', 'error');
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
    try {
      const item = await shoppingApi.add({
        name: name.trim(),
        quantity: quantity.trim() || undefined,
      });
      setItems(prev => [...prev, item]);
      showStatus(`Added "${item.name}" to shopping list.`, 'success');
      setName('');
      setQuantity('');
    } catch {
      showStatus('Failed to add item.', 'error');
    }
  }

  async function handleRemove(id: number) {
    try {
      await shoppingApi.remove(id);
      setItems(prev => prev.filter(i => i.id !== id));
      showStatus('Item removed.', 'success');
    } catch {
      showStatus('Failed to remove item.', 'error');
    }
  }

  return (
    <div className="container">
      <div className="header">
        <h1>Shopping List</h1>
        <p>Track what you need to buy</p>
      </div>

      <div className="stats">
        <div className="stat-card">
          <h3>{items.length}</h3>
          <p>Items to Buy</p>
        </div>
      </div>

      {status && (
        <div className={`status-message status-${status.type}`}>{status.msg}</div>
      )}

      {/* Add item form */}
      <div className="panel" style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: 'var(--accent-light)', marginBottom: '1.5rem' }}>Add Item</h2>
        <form onSubmit={handleAdd}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="shopItemName">Item Name</label>
              <input
                id="shopItemName"
                className="form-control"
                type="text"
                placeholder="e.g., Milk"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="shopItemQty">Quantity (optional)</label>
              <input
                id="shopItemQty"
                className="form-control"
                type="text"
                placeholder="e.g., 2 gallons"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
              />
            </div>
          </div>
          <button className="btn" type="submit">Add to List</button>
        </form>
      </div>

      {/* Shopping list */}
      {loading ? (
        <div className="loading">Loading shopping list</div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--accent-lighter)' }}>
          Your shopping list is empty.
        </div>
      ) : (
        <div className="panel">
          <h2 style={{ color: 'var(--accent-light)', marginBottom: '1.5rem' }}>
            Your List ({items.length})
          </h2>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {items.map(item => (
              <li
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.875rem 1rem',
                  background: 'var(--surface)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                }}
              >
                <div>
                  <span style={{ color: 'var(--text-bright)', fontWeight: 600 }}>{item.name}</span>
                  {item.quantity && (
                    <span style={{ color: 'var(--muted)', marginLeft: '0.5rem', fontSize: '0.9rem' }}>
                      ({item.quantity})
                    </span>
                  )}
                </div>
                <button
                  className="btn btn-danger"
                  style={{ padding: '6px 14px', fontSize: '0.85rem' }}
                  onClick={() => handleRemove(item.id)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
