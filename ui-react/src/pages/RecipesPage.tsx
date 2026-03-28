import { useEffect, useState } from 'react';
import { recipesApi, type Recipe } from '../services/api';

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [servings, setServings] = useState('4');
  const [ingredientText, setIngredientText] = useState('');

  useEffect(() => {
    loadRecipes();
  }, []);

  async function loadRecipes() {
    try {
      const data = await recipesApi.list();
      setRecipes(data);
    } catch {
      showStatus('Could not load recipes. Is the API running?', 'error');
    } finally {
      setLoading(false);
    }
  }

  function showStatus(msg: string, type: 'success' | 'error' | 'info') {
    setStatus({ msg, type });
    setTimeout(() => setStatus(null), 4000);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    const ingredients = ingredientText
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => ({ name: line }));

    try {
      const recipe = await recipesApi.create({
        title: title.trim(),
        description: description.trim() || undefined,
        instructions: instructions.trim() || undefined,
        servings: parseInt(servings, 10) || 4,
        ingredients,
      });
      setRecipes(prev => [...prev, recipe]);
      showStatus(`Recipe "${recipe.title}" created!`, 'success');
      setTitle('');
      setDescription('');
      setInstructions('');
      setIngredientText('');
      setServings('4');
      setShowForm(false);
    } catch {
      showStatus('Failed to create recipe.', 'error');
    }
  }

  async function handleDelete(id: number, titleName: string) {
    if (!confirm(`Delete recipe "${titleName}"?`)) return;
    try {
      await recipesApi.remove(id);
      setRecipes(prev => prev.filter(r => r.id !== id));
      showStatus('Recipe deleted.', 'success');
    } catch {
      showStatus('Failed to delete recipe.', 'error');
    }
  }

  const filtered = recipes.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    (r.description ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container">
      <div className="header">
        <h1>Recipes</h1>
        <p>Your saved family recipes</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          className="form-control"
          type="text"
          placeholder="Search recipes..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: '1 1 200px' }}
        />
        <button className="btn" onClick={() => setShowForm(v => !v)}>
          {showForm ? 'Cancel' : '+ New Recipe'}
        </button>
      </div>

      {status && (
        <div className={`status-message status-${status.type}`}>{status.msg}</div>
      )}

      {showForm && (
        <div className="panel fade-in" style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: 'var(--accent-light)', marginBottom: '1.5rem' }}>New Recipe</h2>
          <form onSubmit={handleCreate}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="recipeTitle">Title</label>
                <input
                  id="recipeTitle"
                  className="form-control"
                  type="text"
                  placeholder="Recipe title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="recipeServings">Servings</label>
                <input
                  id="recipeServings"
                  className="form-control"
                  type="number"
                  min="1"
                  value={servings}
                  onChange={e => setServings(e.target.value)}
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="recipeDesc">Description (optional)</label>
              <input
                id="recipeDesc"
                className="form-control"
                type="text"
                placeholder="Brief description"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="recipeIngredients">Ingredients (one per line)</label>
              <textarea
                id="recipeIngredients"
                className="form-control"
                rows={5}
                placeholder={"2 cups flour\n1 tsp salt\n..."}
                value={ingredientText}
                onChange={e => setIngredientText(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>
            <div className="form-group">
              <label htmlFor="recipeInstructions">Instructions</label>
              <textarea
                id="recipeInstructions"
                className="form-control"
                rows={6}
                placeholder="Step-by-step instructions..."
                value={instructions}
                onChange={e => setInstructions(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>
            <button className="btn" type="submit">Save Recipe</button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading">Loading recipes</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--accent-lighter)' }}>
          {recipes.length === 0
            ? 'No recipes yet — add your first one!'
            : 'No recipes match your search.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {filtered.map(recipe => (
            <div key={recipe.id} className="card">
              <h4>{recipe.title}</h4>
              {recipe.description && (
                <div className="details">
                  <p>{recipe.description}</p>
                </div>
              )}
              <div className="details" style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                {recipe.servings && <p>Serves {recipe.servings}</p>}
                {recipe.ingredients?.length > 0 && (
                  <p>{recipe.ingredients.length} ingredient{recipe.ingredients.length !== 1 ? 's' : ''}</p>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button className="btn btn-danger" onClick={() => handleDelete(recipe.id, recipe.title)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
