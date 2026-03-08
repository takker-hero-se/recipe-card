import type { Recipe, PlannedMeal, InventoryItem, FlyerPrice, MealType } from '../types';
import { getRecipeTotalCost } from './priceEstimator';

interface ScoredRecipe {
  recipe: Recipe;
  score: number;
  estimatedCost: number;
}

interface PlannerParams {
  availableRecipes: Recipe[];
  currentPlan: PlannedMeal[];
  inventory: InventoryItem[];
  flyerPrices: FlyerPrice[];
  remainingBudget: number;
  targetDate: string;
  mealType: MealType;
  servingsPerMeal: number;
}

export function suggestRecipes(params: PlannerParams): ScoredRecipe[] {
  const { availableRecipes, currentPlan, inventory, flyerPrices, remainingBudget, servingsPerMeal } = params;

  // 既に計画されたレシピIDを取得
  const plannedRecipeIds = new Set(currentPlan.map(m => m.recipeId));

  // 計画済みレシピの食材を集計
  const plannedIngredients = new Map<string, number>();
  currentPlan.forEach(meal => {
    const recipe = availableRecipes.find(r => r.id === meal.recipeId);
    if (recipe) {
      recipe.ingredients.forEach(ing => {
        plannedIngredients.set(
          ing.name,
          (plannedIngredients.get(ing.name) || 0) + 1
        );
      });
    }
  });

  // 在庫の食材名セット
  const inventoryNames = new Set(
    inventory.filter(i => !i.usedUp).map(i => i.ingredientName)
  );

  // 期限が近い在庫
  const today = new Date();
  const soonExpiring = new Set(
    inventory
      .filter(i => {
        if (i.usedUp) return false;
        const expiry = new Date(i.estimatedExpiryDate);
        const daysUntilExpiry = (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
        return daysUntilExpiry <= 3;
      })
      .map(i => i.ingredientName)
  );

  const scored: ScoredRecipe[] = availableRecipes.map(recipe => {
    const servingRatio = servingsPerMeal / recipe.servings;
    const estimatedCost = Math.round(getRecipeTotalCost(recipe.ingredients, flyerPrices) * servingRatio);

    let score = 0;

    // 1. 食材の重複スコア (0-40): 既に購入予定の食材を使うレシピを優先
    const overlapCount = recipe.ingredients.filter(
      ing => plannedIngredients.has(ing.name) || inventoryNames.has(ing.name)
    ).length;
    score += Math.min(40, (overlapCount / Math.max(1, recipe.ingredients.length)) * 40);

    // 2. 期限切れ近い食材の使用 (0-30)
    const expiringUsed = recipe.ingredients.filter(ing => soonExpiring.has(ing.name)).length;
    score += Math.min(30, expiringUsed * 15);

    // 3. 予算適合スコア (0-20)
    if (estimatedCost <= remainingBudget) {
      const budgetRatio = estimatedCost / Math.max(1, remainingBudget);
      score += 20 * (1 - budgetRatio * 0.5); // 安いほど高スコア
    } else {
      score -= 20; // 予算オーバーはペナルティ
    }

    // 4. バリエーションスコア (0-10)
    if (plannedRecipeIds.has(recipe.id)) {
      score -= 10; // 同じレシピの繰り返しはペナルティ
    } else {
      score += 5;
      // カテゴリの重複もチェック
      const plannedCategories = currentPlan
        .map(m => availableRecipes.find(r => r.id === m.recipeId)?.category)
        .filter(Boolean);
      if (!plannedCategories.includes(recipe.category)) {
        score += 5;
      }
    }

    return { recipe, score, estimatedCost };
  });

  return scored
    .filter(s => s.estimatedCost <= remainingBudget)
    .sort((a, b) => b.score - a.score);
}

export function calculatePlanTotalCost(
  plan: PlannedMeal[],
  recipes: Recipe[],
  flyerPrices: FlyerPrice[]
): number {
  return plan.reduce((total, meal) => {
    const recipe = recipes.find(r => r.id === meal.recipeId);
    if (!recipe) return total;
    const ratio = meal.servings / recipe.servings;
    return total + Math.round(getRecipeTotalCost(recipe.ingredients, flyerPrices) * ratio);
  }, 0);
}
