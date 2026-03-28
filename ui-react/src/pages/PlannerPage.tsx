import { useEffect, useState } from 'react';
import { mealPlansApi, type MealPlanEntry } from '../services/api';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
type MealType = typeof MEAL_TYPES[number];

function getWeekDates(anchor: Date): string[] {
  const monday = new Date(anchor);
  const day = monday.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  monday.setDate(monday.getDate() + diff);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

function formatDateLabel(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function PlannerPage() {
  const [entries, setEntries] = useState<MealPlanEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [weekAnchor, setWeekAnchor] = useState(new Date());
  const [addDate, setAddDate] = useState('');
  const [addMeal, setAddMeal] = useState<MealType>('dinner');
  const [addRecipe, setAddRecipe] = useState('');

  const weekDates = getWeekDates(weekAnchor);

  useEffect(() => {
    loadEntries();
  }, [weekAnchor]);

  async function loadEntries() {
    setLoading(true);
    try {
      const data = await mealPlansApi.list(weekDates[0], weekDates[6]);
      setEntries(data);
    } catch {
      showStatus('Could not load meal plans. Is the API running?', 'error');
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
    if (!addDate || !addRecipe.trim()) return;
    try {
      const entry = await mealPlansApi.upsert({
        planDate: addDate,
        mealType: addMeal,
        recipeName: addRecipe.trim(),
      });
      setEntries(prev => [...prev, entry]);
      showStatus('Meal plan entry added.', 'success');
      setAddRecipe('');
    } catch {
      showStatus('Failed to add entry.', 'error');
    }
  }

  async function handleRemove(entry: MealPlanEntry) {
    try {
      await mealPlansApi.remove(entry.planDate, entry.mealType, entry.recipeName);
      setEntries(prev =>
        prev.filter(e =>
          !(e.planDate === entry.planDate &&
            e.mealType === entry.mealType &&
            e.recipeName === entry.recipeName)
        )
      );
      showStatus('Entry removed.', 'success');
    } catch {
      showStatus('Failed to remove entry.', 'error');
    }
  }

  function prevWeek() {
    const d = new Date(weekAnchor);
    d.setDate(d.getDate() - 7);
    setWeekAnchor(d);
  }

  function nextWeek() {
    const d = new Date(weekAnchor);
    d.setDate(d.getDate() + 7);
    setWeekAnchor(d);
  }

  function entriesFor(date: string, meal: MealType) {
    return entries.filter(e => e.planDate === date && e.mealType === meal);
  }

  return (
    <div className="container">
      <div className="header">
        <h1>Meal Planner</h1>
        <p>Plan your family's meals for the week</p>
      </div>

      {status && (
        <div className={`status-message status-${status.type}`}>{status.msg}</div>
      )}

      {/* Week navigator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', justifyContent: 'center' }}>
        <button className="btn btn-secondary" onClick={prevWeek}>Prev Week</button>
        <span style={{ color: 'var(--accent-lighter)', fontWeight: 600 }}>
          {formatDateLabel(weekDates[0])} – {formatDateLabel(weekDates[6])}
        </span>
        <button className="btn btn-secondary" onClick={nextWeek}>Next Week</button>
      </div>

      {/* Add entry form */}
      <div className="panel" style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: 'var(--accent-light)', marginBottom: '1.5rem' }}>Add Meal</h2>
        <form onSubmit={handleAdd}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="planDate">Date</label>
              <select
                id="planDate"
                className="form-control"
                value={addDate}
                onChange={e => setAddDate(e.target.value)}
                required
              >
                <option value="">Select a day...</option>
                {weekDates.map(d => (
                  <option key={d} value={d}>{formatDateLabel(d)}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="planMeal">Meal</label>
              <select
                id="planMeal"
                className="form-control"
                value={addMeal}
                onChange={e => setAddMeal(e.target.value as MealType)}
              >
                {MEAL_TYPES.map(m => (
                  <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="planRecipe">Recipe Name</label>
            <input
              id="planRecipe"
              className="form-control"
              type="text"
              placeholder="e.g., Spaghetti Bolognese"
              value={addRecipe}
              onChange={e => setAddRecipe(e.target.value)}
              required
            />
          </div>
          <button className="btn" type="submit">Add to Plan</button>
        </form>
      </div>

      {/* Weekly calendar view */}
      {loading ? (
        <div className="loading">Loading meal plan</div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '1rem',
        }}>
          {weekDates.map(date => (
            <div key={date} className="card" style={{ minHeight: '180px' }}>
              <h4 style={{ marginBottom: '0.75rem' }}>{formatDateLabel(date)}</h4>
              {MEAL_TYPES.map(meal => {
                const dayEntries = entriesFor(date, meal);
                if (dayEntries.length === 0) return null;
                return (
                  <div key={meal} style={{ marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--muted)', fontSize: '0.8rem', textTransform: 'capitalize' }}>
                      {meal}
                    </span>
                    {dayEntries.map(e => (
                      <div key={`${e.planDate}-${e.mealType}-${e.recipeName}`}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                        <span style={{ color: 'var(--accent-lighter)', fontSize: '0.9rem' }}>{e.recipeName}</span>
                        <button
                          onClick={() => handleRemove(e)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--danger)',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            padding: '2px 4px',
                          }}
                          aria-label={`Remove ${e.recipeName}`}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                );
              })}
              {MEAL_TYPES.every(m => entriesFor(date, m).length === 0) && (
                <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>No meals planned</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
