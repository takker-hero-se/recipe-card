import { useState, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { calculatePlanTotalCost, suggestRecipes, generateAutoPlan } from '../utils/mealPlanner';
import { getRecipeTotalCost } from '../utils/priceEstimator';
import type { MealType, Recipe } from '../types';

const COURSE_TYPES: MealType[] = ['主菜', '副菜1', '副菜2', '汁物'];
const COURSE_LABELS: Record<MealType, string> = {
  '主菜': '主菜',
  '副菜1': '副菜',
  '副菜2': '副菜',
  '汁物': '汁物',
};
const DAY_NAMES = ['月', '火', '水', '木', '金', '土', '日'];

function getWeekDates(startDate: string): string[] {
  const dates: string[] = [];
  const start = new Date(startDate);
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

export function PlannerPage() {
  const { settings, recipes, mealPlan, flyerPrices, inventory, addMeal, removeMeal, clearPlan } = useApp();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [targetSlot, setTargetSlot] = useState<{ date: string; mealType: MealType } | null>(null);
  const [showAutoConfig, setShowAutoConfig] = useState(false);
  const [autoResult, setAutoResult] = useState<{ totalCost: number; wasteScore: number; ingredientVariety: number } | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const weekDates = useMemo(() => getWeekDates(mealPlan.weekStartDate), [mealPlan.weekStartDate]);
  const totalCost = calculatePlanTotalCost(mealPlan.meals, recipes, flyerPrices);
  const remaining = settings.weeklyBudget - totalCost;
  const budgetPct = settings.weeklyBudget > 0 ? (totalCost / settings.weeklyBudget) * 100 : 0;
  const budgetColor = budgetPct > 90 ? '#d32f2f' : budgetPct > 70 ? '#f57c00' : '#388e3c';

  const suggestions = useMemo(() => {
    if (!targetSlot) return [];
    return suggestRecipes({
      availableRecipes: recipes,
      currentPlan: mealPlan.meals,
      inventory,
      flyerPrices,
      remainingBudget: remaining,
      targetDate: targetSlot.date,
      mealType: targetSlot.mealType,
      servingsPerMeal: settings.servingsPerMeal,
    }).slice(0, 8);
  }, [targetSlot, recipes, mealPlan.meals, inventory, flyerPrices, remaining, settings.servingsPerMeal]);

  const handleSlotClick = (date: string, mealType: MealType) => {
    setTargetSlot({ date, mealType });
    setShowSuggestions(true);
  };

  const handleSelectRecipe = (recipeId: string) => {
    if (!targetSlot) return;
    addMeal({
      date: targetSlot.date,
      mealType: targetSlot.mealType,
      recipeId,
      servings: settings.servingsPerMeal,
    });
    setShowSuggestions(false);
    setTargetSlot(null);
  };

  const handleRecipeClick = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
  };

  // 自動献立生成
  const handleAutoGenerate = useCallback(() => {
    clearPlan();

    setTimeout(() => {
      const result = generateAutoPlan({
        availableRecipes: recipes,
        inventory,
        flyerPrices,
        weeklyBudget: settings.weeklyBudget,
        servingsPerMeal: settings.servingsPerMeal,
        weekStartDate: mealPlan.weekStartDate,
      });

      result.meals.forEach(meal => {
        addMeal({
          date: meal.date,
          mealType: meal.mealType,
          recipeId: meal.recipeId,
          servings: meal.servings,
        });
      });

      setAutoResult({
        totalCost: result.totalCost,
        wasteScore: result.wasteScore,
        ingredientVariety: result.ingredientVariety,
      });

      setShowAutoConfig(false);
    }, 50);
  }, [recipes, inventory, flyerPrices, settings, mealPlan.weekStartDate, clearPlan, addMeal]);

  const getWasteScoreColor = (score: number) => {
    if (score >= 70) return '#388e3c';
    if (score >= 40) return '#f57c00';
    return '#d32f2f';
  };

  return (
    <div className="app-container">
      <div className="flex-between mb-8">
        <h2 className="page-title" style={{ marginBottom: 0 }}>週間献立</h2>
        <div className="flex gap-8">
          <button className="btn btn-sm btn-primary" onClick={() => setShowAutoConfig(true)}>
            自動作成
          </button>
          <button className="btn btn-sm btn-outline" onClick={() => { clearPlan(); setAutoResult(null); }}>
            リセット
          </button>
        </div>
      </div>

      {/* 予算メーター */}
      <div className="card mb-16">
        <div className="flex-between">
          <span className="text-sm font-bold">予算</span>
          <span className="font-bold" style={{ color: budgetColor }}>
            ¥{totalCost.toLocaleString()} / ¥{settings.weeklyBudget.toLocaleString()}
          </span>
        </div>
        <div className="budget-meter">
          <div className="budget-meter-fill" style={{ width: `${Math.min(100, budgetPct)}%`, background: budgetColor }} />
        </div>
        <div className="text-sm text-muted text-right">
          残り ¥{Math.max(0, remaining).toLocaleString()}
        </div>
      </div>

      {/* 自動生成結果サマリー */}
      {autoResult && (
        <div className="card mb-16" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div className="flex-between mb-8">
            <span className="font-bold" style={{ color: 'var(--primary)' }}>自動献立の分析</span>
            <button
              className="btn btn-sm btn-outline"
              onClick={() => setShowAutoConfig(true)}
              style={{ fontSize: '0.75rem' }}
            >
              再生成
            </button>
          </div>
          <div className="grid-2 text-sm">
            <div>
              <div className="text-muted">推定合計</div>
              <div className="font-bold">¥{autoResult.totalCost.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-muted">使用食材数</div>
              <div className="font-bold">{autoResult.ingredientVariety}種類</div>
            </div>
          </div>
          <div className="mt-8">
            <div className="flex-between text-sm">
              <span className="text-muted">食材使い切りスコア</span>
              <span className="font-bold" style={{ color: getWasteScoreColor(autoResult.wasteScore) }}>
                {autoResult.wasteScore}/100
              </span>
            </div>
            <div className="budget-meter" style={{ height: '8px' }}>
              <div
                className="budget-meter-fill"
                style={{
                  width: `${autoResult.wasteScore}%`,
                  background: getWasteScoreColor(autoResult.wasteScore),
                }}
              />
            </div>
            <div className="text-xs text-muted mt-8">
              スコアが高いほど食材を効率的に使い回せています
            </div>
          </div>
        </div>
      )}

      {/* 週間カレンダー（一汁三菜） */}
      <div className="planner-grid">
        {weekDates.map((date, dayIndex) => {
          const dayMeals = mealPlan.meals.filter(m => m.date === date);
          const d = new Date(date);
          const isToday = new Date().toISOString().split('T')[0] === date;

          return (
            <div key={date} className="day-column" style={isToday ? { borderLeft: '3px solid var(--primary)' } : {}}>
              <div className="day-header">
                {DAY_NAMES[dayIndex]} {d.getMonth() + 1}/{d.getDate()}
                {isToday && <span className="badge badge-green" style={{ marginLeft: '8px' }}>今日</span>}
              </div>
              {COURSE_TYPES.map(courseType => {
                const meal = dayMeals.find(m => m.mealType === courseType);
                const recipe = meal ? recipes.find(r => r.id === meal.recipeId) : null;

                return (
                  <div key={courseType} className={`meal-slot ${meal ? 'meal-slot-filled' : ''}`}>
                    <div style={{ flex: 1 }}>
                      <div className="meal-slot-label">{COURSE_LABELS[courseType]}</div>
                      {recipe ? (
                        <div
                          style={{ fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
                          onClick={() => handleRecipeClick(recipe)}
                        >
                          {recipe.name}
                        </div>
                      ) : (
                        <button
                          className="meal-slot-add"
                          onClick={() => handleSlotClick(date, courseType)}
                        >
                          + 追加
                        </button>
                      )}
                    </div>
                    {meal && (
                      <button
                        onClick={(e) => { e.stopPropagation(); removeMeal(meal.id); }}
                        style={{ background: 'none', color: 'var(--danger)', fontSize: '0.8rem' }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* レシピ詳細モーダル */}
      {selectedRecipe && (
        <div className="modal-overlay" onClick={() => setSelectedRecipe(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="flex-between mb-16">
              <h2>{selectedRecipe.name}</h2>
              <button className="btn btn-sm btn-outline" onClick={() => setSelectedRecipe(null)}>✕</button>
            </div>

            <div className="flex gap-8 mb-8">
              <span className="badge badge-green">{selectedRecipe.category}</span>
              {selectedRecipe.tags.map(tag => (
                <span key={tag} className="badge">{tag}</span>
              ))}
            </div>

            <p className="text-sm text-muted mb-16">{selectedRecipe.description}</p>

            <div className="grid-2 text-sm mb-16">
              <div>
                <span className="text-muted">調理時間: </span>
                <span className="font-bold">{selectedRecipe.prepTimeMinutes + selectedRecipe.cookTimeMinutes}分</span>
              </div>
              <div>
                <span className="text-muted">推定費用: </span>
                <span className="font-bold">約¥{Math.round(getRecipeTotalCost(selectedRecipe.ingredients, flyerPrices))}</span>
              </div>
            </div>

            <div className="mb-16">
              <h3 style={{ fontSize: '0.95rem', marginBottom: '8px' }}>材料（{selectedRecipe.servings}人分）</h3>
              <div style={{ background: '#f9f9f9', borderRadius: '8px', padding: '12px' }}>
                {selectedRecipe.ingredients.map((ing, i) => (
                  <div key={i} className="flex-between text-sm" style={{ padding: '4px 0', borderBottom: i < selectedRecipe.ingredients.length - 1 ? '1px solid #eee' : 'none' }}>
                    <span>{ing.name}</span>
                    <span className="text-muted">{ing.quantity}{ing.unit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: '0.95rem', marginBottom: '8px' }}>作り方</h3>
              <ol style={{ paddingLeft: '20px', fontSize: '0.9rem', lineHeight: 1.6 }}>
                {selectedRecipe.steps.map((step, i) => (
                  <li key={i} style={{ marginBottom: '6px' }}>{step}</li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* 自動献立設定モーダル */}
      {showAutoConfig && (
        <div className="modal-overlay" onClick={() => setShowAutoConfig(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="flex-between mb-16">
              <h2>自動献立作成</h2>
              <button className="btn btn-sm btn-outline" onClick={() => setShowAutoConfig(false)}>✕</button>
            </div>

            <p className="text-sm text-muted mb-16">
              予算内で食材を使い切る1週間の夕食献立（一汁三菜）を自動生成します。
              在庫食材やチラシの特売価格も考慮されます。
            </p>

            <div className="card mb-16" style={{ background: '#f5f5f5' }}>
              <div className="text-sm mb-8 font-bold">設定</div>
              <div className="flex-between text-sm mb-8">
                <span>週間予算</span>
                <span className="font-bold">¥{settings.weeklyBudget.toLocaleString()}</span>
              </div>
              <div className="flex-between text-sm mb-8">
                <span>1食あたり人数</span>
                <span className="font-bold">{settings.servingsPerMeal}人</span>
              </div>
              <div className="flex-between text-sm">
                <span>登録済みチラシ価格</span>
                <span className="font-bold">{flyerPrices.length}件</span>
              </div>
            </div>

            <div className="card mb-16" style={{ borderLeft: '4px solid var(--secondary)' }}>
              <p className="text-sm">
                <strong>一汁三菜の自動献立:</strong>
              </p>
              <ul style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', paddingLeft: '16px', marginTop: '4px' }}>
                <li>毎日「主菜1品 + 副菜2品 + 汁物1品」の構成</li>
                <li>同じ食材を複数のレシピで使い回しフードロスを削減</li>
                <li>同じレシピの繰り返しを避けバリエーションを確保</li>
                <li>チラシの特売品を優先的に活用</li>
                <li>在庫の期限切れ食材を優先消費</li>
              </ul>
            </div>

            <button
              className="btn btn-primary btn-block"
              onClick={handleAutoGenerate}
              style={{ fontSize: '1rem', padding: '14px' }}
            >
              1週間の献立を自動作成
            </button>

            <p className="text-xs text-muted text-center mt-8">
              ※ 現在の献立はリセットされます。個別の変更は後から可能です。
            </p>
          </div>
        </div>
      )}

      {/* レシピ提案モーダル（個別スロット） */}
      {showSuggestions && targetSlot && (
        <div className="modal-overlay" onClick={() => setShowSuggestions(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="flex-between mb-16">
              <h2>レシピを選択</h2>
              <button className="btn btn-sm btn-outline" onClick={() => setShowSuggestions(false)}>✕</button>
            </div>
            <p className="text-sm text-muted mb-16">
              {new Date(targetSlot.date).getMonth() + 1}/{new Date(targetSlot.date).getDate()} の{COURSE_LABELS[targetSlot.mealType]}
              （予算・食材の重複・フードロス削減を考慮した提案順）
            </p>
            {suggestions.length === 0 ? (
              <p className="text-center text-muted">予算内のレシピがありません</p>
            ) : (
              suggestions.map(({ recipe, score, estimatedCost }) => (
                <div
                  key={recipe.id}
                  className="card recipe-card"
                  onClick={() => handleSelectRecipe(recipe.id)}
                >
                  <div className="recipe-card-header">
                    <div>
                      <div className="recipe-card-title">{recipe.name}</div>
                      <span className="badge badge-green">{recipe.category}</span>
                    </div>
                    <div className="text-right">
                      <div className="recipe-card-cost">約¥{estimatedCost}</div>
                      <div className="text-xs text-muted">スコア: {Math.round(score)}</div>
                    </div>
                  </div>
                  <div className="recipe-card-desc">{recipe.description}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
