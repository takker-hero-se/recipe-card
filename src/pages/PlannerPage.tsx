import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { calculatePlanTotalCost, suggestRecipes } from '../utils/mealPlanner';
import type { MealType } from '../types';

const MEAL_TYPES: MealType[] = ['朝食', '昼食', '夕食'];
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

  return (
    <div className="app-container">
      <div className="flex-between mb-8">
        <h2 className="page-title" style={{ marginBottom: 0 }}>週間献立</h2>
        <button className="btn btn-sm btn-outline" onClick={clearPlan}>
          リセット
        </button>
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

      {/* 週間カレンダー */}
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
              {MEAL_TYPES.map(mealType => {
                const meal = dayMeals.find(m => m.mealType === mealType);
                const recipe = meal ? recipes.find(r => r.id === meal.recipeId) : null;

                return (
                  <div key={mealType} className={`meal-slot ${meal ? 'meal-slot-filled' : ''}`}>
                    <div>
                      <div className="meal-slot-label">{mealType}</div>
                      {recipe ? (
                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{recipe.name}</div>
                      ) : (
                        <button
                          className="meal-slot-add"
                          onClick={() => handleSlotClick(date, mealType)}
                        >
                          + 追加
                        </button>
                      )}
                    </div>
                    {meal && (
                      <button
                        onClick={() => removeMeal(meal.id)}
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

      {/* レシピ提案モーダル */}
      {showSuggestions && targetSlot && (
        <div className="modal-overlay" onClick={() => setShowSuggestions(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="flex-between mb-16">
              <h2>レシピを選択</h2>
              <button className="btn btn-sm btn-outline" onClick={() => setShowSuggestions(false)}>✕</button>
            </div>
            <p className="text-sm text-muted mb-16">
              {new Date(targetSlot.date).getMonth() + 1}/{new Date(targetSlot.date).getDate()} の{targetSlot.mealType}
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
