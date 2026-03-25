import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getRecipeCostPerServing } from '../utils/priceEstimator';
import type { Recipe, RecipeCategory, Ingredient, IngredientUnit, IngredientCategory } from '../types';

const categories: RecipeCategory[] = ['主菜', '副菜', '汁物', '主食', 'デザート', 'その他'];

export function RecipesPage() {
  const { recipes, flyerPrices, addRecipe, deleteRecipe, addMeal, settings } = useApp();
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddToPlan, setShowAddToPlan] = useState<Recipe | null>(null);
  const [planDate, setPlanDate] = useState('');
  const [planMealType, setPlanMealType] = useState<'主菜' | '副菜1' | '副菜2' | '汁物'>('主菜');

  const filtered = recipes.filter(r => {
    if (filterCategory !== 'all' && r.category !== filterCategory) return false;
    if (search && !r.name.includes(search) && !r.tags.some(t => t.includes(search))
      && !r.ingredients.some(i => i.name.includes(search))) return false;
    return true;
  });

  const handleAddToPlan = (recipe: Recipe) => {
    if (!planDate) return;
    addMeal({
      date: planDate,
      mealType: planMealType,
      recipeId: recipe.id,
      servings: settings.servingsPerMeal,
    });
    setShowAddToPlan(null);
    setPlanDate('');
  };

  return (
    <div className="app-container">
      <div className="flex-between mb-16">
        <h2 className="page-title" style={{ marginBottom: 0 }}>レシピ一覧</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAddForm(true)}>
          + 追加
        </button>
      </div>

      {/* 検索・フィルター */}
      <div className="card mb-16">
        <input
          type="text"
          placeholder="レシピ名・食材で検索..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', marginBottom: '8px' }}
        />
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            className={`btn btn-sm ${filterCategory === 'all' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilterCategory('all')}
          >
            全て
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              className={`btn btn-sm ${filterCategory === cat ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setFilterCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* レシピリスト */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <p>レシピが見つかりません</p>
        </div>
      ) : (
        filtered.map(recipe => {
          const cost = getRecipeCostPerServing(recipe.ingredients, recipe.servings, flyerPrices);
          return (
            <div key={recipe.id} className="card recipe-card" onClick={() => setSelectedRecipe(recipe)}>
              <div className="recipe-card-header">
                <div>
                  <div className="recipe-card-title">{recipe.name}</div>
                  <span className="badge badge-green">{recipe.category}</span>
                </div>
                <div className="recipe-card-cost">
                  約¥{cost}/人
                </div>
              </div>
              <div className="recipe-card-desc">{recipe.description}</div>
              <div className="recipe-card-meta">
                <span>⏱ {recipe.prepTimeMinutes + recipe.cookTimeMinutes}分</span>
                <span>👥 {recipe.servings}人分</span>
              </div>
              <div className="tag-list mt-8">
                {recipe.tags.map(tag => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
            </div>
          );
        })
      )}

      {/* レシピ詳細モーダル */}
      {selectedRecipe && (
        <div className="modal-overlay" onClick={() => setSelectedRecipe(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="flex-between mb-8">
              <h2>{selectedRecipe.name}</h2>
              <button className="btn btn-sm btn-outline" onClick={() => setSelectedRecipe(null)}>✕</button>
            </div>
            <p className="text-muted mb-8">{selectedRecipe.description}</p>
            <div className="flex gap-12 mb-16 text-sm">
              <span className="badge badge-green">{selectedRecipe.category}</span>
              <span>⏱ {selectedRecipe.prepTimeMinutes + selectedRecipe.cookTimeMinutes}分</span>
              <span>👥 {selectedRecipe.servings}人分</span>
              <span className="font-bold" style={{ color: 'var(--primary)' }}>
                約¥{getRecipeCostPerServing(selectedRecipe.ingredients, selectedRecipe.servings, flyerPrices)}/人
              </span>
            </div>

            <h3 className="mb-8">材料</h3>
            <div className="mb-16">
              {selectedRecipe.ingredients.map((ing, i) => (
                <div key={i} className="flex-between" style={{ padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                  <span>{ing.name}</span>
                  <span className="text-muted">{ing.quantity}{ing.unit}</span>
                </div>
              ))}
            </div>

            <h3 className="mb-8">作り方</h3>
            <ol style={{ paddingLeft: '20px' }}>
              {selectedRecipe.steps.map((step, i) => (
                <li key={i} style={{ marginBottom: '8px', fontSize: '0.9rem' }}>{step}</li>
              ))}
            </ol>

            <div className="flex gap-8 mt-16">
              <button
                className="btn btn-primary btn-block"
                onClick={() => { setShowAddToPlan(selectedRecipe); setSelectedRecipe(null); }}
              >
                献立に追加
              </button>
              {!selectedRecipe.isBuiltIn && (
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => { deleteRecipe(selectedRecipe.id); setSelectedRecipe(null); }}
                >
                  削除
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 献立追加モーダル */}
      {showAddToPlan && (
        <div className="modal-overlay" onClick={() => setShowAddToPlan(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>「{showAddToPlan.name}」を献立に追加</h2>
            <div className="form-group mt-16">
              <label>日付</label>
              <input type="date" value={planDate} onChange={e => setPlanDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label>食事</label>
              <select value={planMealType} onChange={e => setPlanMealType(e.target.value as typeof planMealType)}>
                <option value="主菜">主菜</option>
                <option value="副菜1">副菜1</option>
                <option value="副菜2">副菜2</option>
                <option value="汁物">汁物</option>
              </select>
            </div>
            <button
              className="btn btn-primary btn-block"
              onClick={() => handleAddToPlan(showAddToPlan)}
              disabled={!planDate}
            >
              追加する
            </button>
          </div>
        </div>
      )}

      {/* レシピ追加フォーム */}
      {showAddForm && (
        <RecipeAddForm onClose={() => setShowAddForm(false)} onSave={addRecipe} />
      )}
    </div>
  );
}

function RecipeAddForm({ onClose, onSave }: {
  onClose: () => void;
  onSave: (recipe: Omit<Recipe, 'id' | 'isBuiltIn' | 'createdAt'>) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<RecipeCategory>('主菜');
  const [servings, setServings] = useState(2);
  const [prepTime, setPrepTime] = useState(10);
  const [cookTime, setCookTime] = useState(15);
  const [tags, setTags] = useState('');
  const [steps, setSteps] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { name: '', quantity: 0, unit: 'g' as IngredientUnit, category: '野菜' as IngredientCategory },
  ]);

  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', quantity: 0, unit: 'g', category: '野菜' }]);
  };

  const updateIngredient = (index: number, field: string, value: string | number) => {
    const updated = [...ingredients];
    (updated[index] as unknown as Record<string, unknown>)[field] = value;
    setIngredients(updated);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!name) return;
    onSave({
      name,
      description,
      category,
      servings,
      ingredients: ingredients.filter(i => i.name),
      steps: steps.split('\n').filter(s => s.trim()),
      prepTimeMinutes: prepTime,
      cookTimeMinutes: cookTime,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
    });
    onClose();
  };

  const unitOptions: IngredientUnit[] = ['g', 'ml', '個', '本', '枚', '束', 'パック', '丁', '合', '袋', '缶', '切れ', '玉', '把', '片', '適量'];
  const categoryOptions: IngredientCategory[] = ['肉類', '魚介類', '野菜', '果物', '乳製品・卵', '調味料', '穀物', '豆腐・大豆製品', '乾物', 'その他'];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="flex-between mb-16">
          <h2>レシピを追加</h2>
          <button className="btn btn-sm btn-outline" onClick={onClose}>✕</button>
        </div>

        <div className="form-group">
          <label>レシピ名 *</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="例: 鶏むね肉の照り焼き" />
        </div>

        <div className="form-group">
          <label>説明</label>
          <input value={description} onChange={e => setDescription(e.target.value)} placeholder="簡単な説明" />
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label>カテゴリ</label>
            <select value={category} onChange={e => setCategory(e.target.value as RecipeCategory)}>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>人数</label>
            <input type="number" value={servings} onChange={e => setServings(Number(e.target.value))} min={1} />
          </div>
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label>下準備(分)</label>
            <input type="number" value={prepTime} onChange={e => setPrepTime(Number(e.target.value))} min={0} />
          </div>
          <div className="form-group">
            <label>調理(分)</label>
            <input type="number" value={cookTime} onChange={e => setCookTime(Number(e.target.value))} min={0} />
          </div>
        </div>

        <div className="form-group">
          <label>材料</label>
          {ingredients.map((ing, i) => (
            <div key={i} className="flex gap-8 mb-8" style={{ alignItems: 'center' }}>
              <input
                placeholder="食材名"
                value={ing.name}
                onChange={e => updateIngredient(i, 'name', e.target.value)}
                style={{ flex: 2, padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
              />
              <input
                type="number"
                placeholder="量"
                value={ing.quantity || ''}
                onChange={e => updateIngredient(i, 'quantity', Number(e.target.value))}
                style={{ width: '60px', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
              />
              <select
                value={ing.unit}
                onChange={e => updateIngredient(i, 'unit', e.target.value)}
                style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
              >
                {unitOptions.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
              <select
                value={ing.category}
                onChange={e => updateIngredient(i, 'category', e.target.value)}
                style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '0.8rem' }}
              >
                {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button onClick={() => removeIngredient(i)} style={{ color: 'var(--danger)', background: 'none', fontSize: '1.2rem' }}>✕</button>
            </div>
          ))}
          <button className="btn btn-outline btn-sm" onClick={addIngredient}>+ 材料を追加</button>
        </div>

        <div className="form-group">
          <label>作り方（1行ずつ）</label>
          <textarea
            value={steps}
            onChange={e => setSteps(e.target.value)}
            rows={5}
            placeholder="1行に1ステップずつ入力"
          />
        </div>

        <div className="form-group">
          <label>タグ（カンマ区切り）</label>
          <input value={tags} onChange={e => setTags(e.target.value)} placeholder="節約, 時短, 作り置き" />
        </div>

        <button className="btn btn-primary btn-block" onClick={handleSubmit} disabled={!name}>
          保存する
        </button>
      </div>
    </div>
  );
}
