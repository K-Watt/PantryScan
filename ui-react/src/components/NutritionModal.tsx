import { useEffect, useState } from 'react';
import { pantryApi, type PantryItem, type Product } from '../services/api';

const NUTRISCORE_COLORS: Record<string, string> = {
  a: '#038141', b: '#85bb2f', c: '#fecb02', d: '#ee8100', e: '#e63e11',
};

const NOVA_LABELS: Record<number, string> = {
  1: 'Unprocessed / minimally processed',
  2: 'Processed culinary ingredient',
  3: 'Processed food',
  4: 'Ultra-processed food',
};

const LEVEL_COLORS: Record<string, string> = {
  low: '#038141', moderate: '#ee8100', high: '#e63e11',
};

function Stepper({ label, value, min = 0, onChange }: { label: string; value: number; min?: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
      <span style={{ color: 'var(--text)' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        <button type="button" className="qty-btn" aria-label={`Decrease ${label}`} disabled={value <= min} onClick={() => onChange(value - 1)}>−</button>
        <input
          type="number"
          min={min}
          className="form-control qty-input"
          value={value}
          onChange={e => onChange(parseInt(e.target.value, 10))}
          style={{ width: '3.5rem', textAlign: 'center', padding: '0.3rem' }}
        />
        <button type="button" className="qty-btn" aria-label={`Increase ${label}`} onClick={() => onChange(value + 1)}>+</button>
      </div>
    </div>
  );
}

function Row({ label, value, unit }: { label: string; value?: number | null; unit: string }) {
  if (value === null || value === undefined) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ color: 'var(--text)' }}>{label}</span>
      <strong style={{ color: 'var(--text-bright)' }}>{value}{unit && ` ${unit}`}</strong>
    </div>
  );
}

export default function NutritionModal({
  item,
  onClose,
  onSetQuantity,
  onSetThreshold,
}: {
  item: PantryItem;
  onClose: () => void;
  onSetQuantity: (q: number) => void;
  onSetThreshold: (t: number) => void;
}) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);

    let alive = true;
    (async () => {
      if (!item.barcode) { setLoading(false); return; }
      try {
        const p = await pantryApi.lookup(item.barcode);
        if (alive) setProduct(p);
      } catch {
        if (alive) setError(true);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; window.removeEventListener('keydown', onKey); };
  }, [item.barcode, onClose]);

  const n = product?.nutrition;
  const grade = n?.nutriscoreGrade?.toLowerCase();

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="fade-in"
        style={{
          background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg, 16px)',
          maxWidth: 480, width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '1.75rem',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {item.imageUrl && (
              <img src={item.imageUrl} alt="" style={{ width: 64, height: 64, objectFit: 'contain', background: '#fff', borderRadius: 8 }} />
            )}
            <div>
              <h2 style={{ margin: 0, color: 'var(--text-bright)' }}>{item.name}</h2>
              {item.brand && <div style={{ color: 'var(--accent-lighter)' }}>{item.brand}</div>}
              {item.barcode && <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>#{item.barcode}</div>}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            marginTop: '1.5rem', padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem',
            background: 'var(--panel-alt)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md, 12px)',
          }}
        >
          <Stepper label="Quantity" value={item.quantity} onChange={onSetQuantity} />
          <Stepper label="Low-stock alert at" value={item.lowStockThreshold ?? 2} onChange={onSetThreshold} />
          <div style={{ fontSize: '0.8rem', color: item.quantity <= (item.lowStockThreshold ?? 2) ? 'var(--warning)' : 'var(--muted)' }}>
            {item.quantity <= (item.lowStockThreshold ?? 2)
              ? `Low stock — at or below ${item.lowStockThreshold ?? 2}.`
              : `Flagged “low stock” when quantity drops to ${item.lowStockThreshold ?? 2} or below.`}
          </div>
        </div>

        <div style={{ marginTop: '1.5rem' }}>
          {loading && <p style={{ color: 'var(--muted)' }}>Loading nutrition…</p>}

          {!loading && !item.barcode && (
            <p style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
              This item was added manually, so it has no barcode to look up nutrition for.
              Scan it on the Barcode page to pull in nutrition facts.
            </p>
          )}

          {!loading && item.barcode && error && (
            <p style={{ color: 'var(--warning)' }}>Couldn’t load nutrition data. Check the API connection.</p>
          )}

          {!loading && item.barcode && !error && !n && (
            <p style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
              No nutrition data is available for this product in OpenFoodFacts yet.
            </p>
          )}

          {n && (
            <>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                {grade && NUTRISCORE_COLORS[grade] && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nutri-Score</span>
                    <span style={{
                      background: NUTRISCORE_COLORS[grade], color: '#fff', fontWeight: 800, fontSize: '1.25rem',
                      width: 40, height: 40, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {grade.toUpperCase()}
                    </span>
                  </div>
                )}
                {n.novaGroup != null && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>NOVA</span>
                    <span
                      title={NOVA_LABELS[n.novaGroup]}
                      style={{
                        background: n.novaGroup >= 4 ? '#e63e11' : n.novaGroup === 3 ? '#ee8100' : '#85bb2f',
                        color: '#fff', fontWeight: 800, fontSize: '1.25rem',
                        width: 40, height: 40, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {n.novaGroup}
                    </span>
                  </div>
                )}
                {n.novaGroup != null && (
                  <div style={{ alignSelf: 'flex-end', color: 'var(--muted)', fontSize: '0.8rem', paddingBottom: 4 }}>
                    {NOVA_LABELS[n.novaGroup]}
                  </div>
                )}
              </div>

              <h3 style={{ color: 'var(--accent-light)', margin: '0 0 0.5rem', fontSize: '0.95rem' }}>
                Nutrition per 100 g{n.servingSize ? ` · serving: ${n.servingSize}` : ''}
              </h3>
              <div>
                <Row label="Energy" value={n.energyKcal100g} unit="kcal" />
                <Row label="Fat" value={n.fat100g} unit="g" />
                <Row label="  of which saturates" value={n.saturatedFat100g} unit="g" />
                <Row label="Carbohydrates" value={n.carbohydrates100g} unit="g" />
                <Row label="  of which sugars" value={n.sugars100g} unit="g" />
                <Row label="Fiber" value={n.fiber100g} unit="g" />
                <Row label="Protein" value={n.proteins100g} unit="g" />
                <Row label="Salt" value={n.salt100g} unit="g" />
                <Row label="Sodium" value={n.sodium100g} unit="g" />
              </div>

              {n.nutrientLevels && Object.keys(n.nutrientLevels).length > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                  {Object.entries(n.nutrientLevels).map(([k, v]) => (
                    <span key={k} style={{
                      background: 'var(--panel-alt)', border: `1px solid ${LEVEL_COLORS[v] ?? 'var(--border)'}`,
                      color: LEVEL_COLORS[v] ?? 'var(--text)', borderRadius: 999, padding: '0.25rem 0.7rem', fontSize: '0.8rem',
                    }}>
                      {k.replace(/-/g, ' ')}: {v}
                    </span>
                  ))}
                </div>
              )}

              <p style={{ color: 'var(--muted)', fontSize: '0.72rem', marginTop: '1.25rem' }}>
                Data from OpenFoodFacts{product?.source === 'cache' ? ' (cached locally)' : ''}.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
