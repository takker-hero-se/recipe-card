import type { Recipe, PlannedMeal, InventoryItem, FlyerPrice, MealType } from '../types';
import { getRecipeTotalCost } from './priceEstimator';
import { v4 as uuidv4 } from 'uuid';

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

// 一汁三菜のスロットタイプに対応するレシピカテゴリ
const COURSE_TO_CATEGORY: Record<MealType, string[]> = {
  '主菜': ['主菜', '主食'],
  '副菜1': ['副菜'],
  '副菜2': ['副菜', 'デザート'],
  '汁物': ['汁物'],
};

export function suggestRecipes(params: PlannerParams): ScoredRecipe[] {
  const { availableRecipes, currentPlan, inventory, flyerPrices, remainingBudget, mealType, servingsPerMeal } = params;

  const plannedRecipeIds = new Set(currentPlan.map(m => m.recipeId));

  const plannedIngredients = new Map<string, number>();
  currentPlan.forEach(meal => {
    const recipe = availableRecipes.find(r => r.id === meal.recipeId);
    if (recipe) {
      recipe.ingredients.forEach(ing => {
        plannedIngredients.set(ing.name, (plannedIngredients.get(ing.name) || 0) + 1);
      });
    }
  });

  const inventoryNames = new Set(
    inventory.filter(i => !i.usedUp).map(i => i.ingredientName)
  );

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

  // このスロットに適したカテゴリ
  const allowedCategories = COURSE_TO_CATEGORY[mealType];

  const scored: ScoredRecipe[] = availableRecipes
    .filter(r => allowedCategories.includes(r.category))
    .map(recipe => {
      const servingRatio = servingsPerMeal / recipe.servings;
      const estimatedCost = Math.round(getRecipeTotalCost(recipe.ingredients, flyerPrices) * servingRatio);

      let score = 0;

      // 1. 食材の重複スコア (0-40)
      const nonSeasoningIngredients = recipe.ingredients.filter(i => i.category !== '調味料');
      const overlapCount = nonSeasoningIngredients.filter(
        ing => plannedIngredients.has(ing.name) || inventoryNames.has(ing.name)
      ).length;
      score += Math.min(40, (overlapCount / Math.max(1, nonSeasoningIngredients.length)) * 40);

      // 2. 期限切れ近い食材の使用 (0-30)
      const expiringUsed = recipe.ingredients.filter(ing => soonExpiring.has(ing.name)).length;
      score += Math.min(30, expiringUsed * 15);

      // 3. 予算適合スコア (0-20)
      if (estimatedCost <= remainingBudget) {
        const budgetRatio = estimatedCost / Math.max(1, remainingBudget);
        score += 20 * (1 - budgetRatio * 0.5);
      } else {
        score -= 20;
      }

      // 4. バリエーションスコア (0-10)
      if (plannedRecipeIds.has(recipe.id)) {
        score -= 15;
      } else {
        score += 10;
      }

      return { recipe, score, estimatedCost };
    });

  return scored
    .filter(s => s.estimatedCost <= remainingBudget || remainingBudget <= 0)
    .sort((a, b) => b.score - a.score);
}

// ===== 自動献立生成（一汁三菜） =====

interface AutoPlanParams {
  availableRecipes: Recipe[];
  inventory: InventoryItem[];
  flyerPrices: FlyerPrice[];
  weeklyBudget: number;
  servingsPerMeal: number;
  weekStartDate: string;
}

interface AutoPlanResult {
  meals: PlannedMeal[];
  totalCost: number;
  ingredientVariety: number;
  wasteScore: number; // 食材使い切りスコア (0-100)
}

// 一汁三菜のスロット順: 主菜を先に決め、それに合う副菜・汁物を選ぶ
const COURSE_ORDER: MealType[] = ['主菜', '汁物', '副菜1', '副菜2'];

export function generateAutoPlan(params: AutoPlanParams): AutoPlanResult {
  const {
    availableRecipes,
    inventory,
    flyerPrices,
    weeklyBudget,
    servingsPerMeal,
    weekStartDate,
  } = params;

  // 7日分の日付を生成
  const dates: string[] = [];
  const start = new Date(weekStartDate);
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }

  // カテゴリ別にレシピを分類
  const mainDishes = availableRecipes.filter(r => r.category === '主菜' || r.category === '主食');
  const sideDishes = availableRecipes.filter(r => r.category === '副菜' || r.category === 'デザート');
  const soups = availableRecipes.filter(r => r.category === '汁物');

  const meals: PlannedMeal[] = [];
  let remainingBudget = weeklyBudget;
  const usedRecipeIds = new Set<string>();
  const plannedIngredients = new Map<string, number>();

  for (const date of dates) {
    // 1日の予算目安 = 残り予算 / 残り日数
    const remainingDays = dates.length - dates.indexOf(date);
    const dailyBudget = Math.round(remainingBudget / remainingDays);

    // 主菜に約40%、副菜2品に各15%、汁物に15%、余裕15%
    const budgetAlloc: Record<MealType, number> = {
      '主菜': Math.round(dailyBudget * 0.40),
      '副菜1': Math.round(dailyBudget * 0.18),
      '副菜2': Math.round(dailyBudget * 0.18),
      '汁物': Math.round(dailyBudget * 0.18),
    };

    const todayUsedIds = new Set<string>();

    for (const courseType of COURSE_ORDER) {
      const pool = courseType === '主菜' ? mainDishes
        : courseType === '汁物' ? soups
        : sideDishes;

      const candidates = scoreForSlot({
        recipes: pool,
        slotBudget: budgetAlloc[courseType],
        remainingBudget,
        servingsPerMeal,
        flyerPrices,
        inventory,
        usedRecipeIds,
        todayUsedIds,
        plannedIngredients,
      });

      if (candidates.length === 0) continue;

      // 上位3つからランダム選択
      const topN = candidates.slice(0, Math.min(3, candidates.length));
      const selected = topN[Math.floor(Math.random() * topN.length)];

      const servingRatio = servingsPerMeal / selected.recipe.servings;
      const cost = Math.round(getRecipeTotalCost(selected.recipe.ingredients, flyerPrices) * servingRatio);

      meals.push({
        id: uuidv4(),
        date,
        mealType: courseType,
        recipeId: selected.recipe.id,
        servings: servingsPerMeal,
      });

      remainingBudget -= cost;
      usedRecipeIds.add(selected.recipe.id);
      todayUsedIds.add(selected.recipe.id);

      selected.recipe.ingredients.forEach(ing => {
        if (ing.category !== '調味料') {
          plannedIngredients.set(ing.name, (plannedIngredients.get(ing.name) || 0) + 1);
        }
      });
    }
  }

  const totalCost = weeklyBudget - remainingBudget;
  const ingredientVariety = plannedIngredients.size;

  // 食材使い切りスコア
  const totalUses = Array.from(plannedIngredients.values()).reduce((a, b) => a + b, 0);
  const wasteScore = ingredientVariety > 0
    ? Math.round(Math.min(100, (totalUses / ingredientVariety) * 30))
    : 0;

  return { meals, totalCost, ingredientVariety, wasteScore };
}

interface SlotScoringParams {
  recipes: Recipe[];
  slotBudget: number;
  remainingBudget: number;
  servingsPerMeal: number;
  flyerPrices: FlyerPrice[];
  inventory: InventoryItem[];
  usedRecipeIds: Set<string>;
  todayUsedIds: Set<string>;
  plannedIngredients: Map<string, number>;
}

function scoreForSlot(params: SlotScoringParams): ScoredRecipe[] {
  const {
    recipes, slotBudget, remainingBudget,
    servingsPerMeal, flyerPrices, inventory,
    usedRecipeIds, todayUsedIds, plannedIngredients,
  } = params;

  const inventoryNames = new Set(
    inventory.filter(i => !i.usedUp).map(i => i.ingredientName)
  );

  const today = new Date();
  const soonExpiring = new Set(
    inventory
      .filter(i => {
        if (i.usedUp) return false;
        const expiry = new Date(i.estimatedExpiryDate);
        return (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24) <= 3;
      })
      .map(i => i.ingredientName)
  );

  return recipes
    .map(recipe => {
      const servingRatio = servingsPerMeal / recipe.servings;
      const estimatedCost = Math.round(getRecipeTotalCost(recipe.ingredients, flyerPrices) * servingRatio);

      let score = 50;

      // 予算チェック
      if (estimatedCost > remainingBudget) return null;
      if (estimatedCost > slotBudget * 2) score -= 15;
      if (estimatedCost <= slotBudget) score += 10;

      // 安いほどボーナス
      score += Math.max(0, 15 - Math.round(estimatedCost / 100));

      // 食材重複ボーナス（フードロス削減の核心）
      const nonSeasoning = recipe.ingredients.filter(i => i.category !== '調味料');
      const overlap = nonSeasoning.filter(i => plannedIngredients.has(i.name) || inventoryNames.has(i.name)).length;
      score += Math.round((overlap / Math.max(1, nonSeasoning.length)) * 35);

      // 期限切れ間近の食材使用
      const expiringUsed = recipe.ingredients.filter(i => soonExpiring.has(i.name)).length;
      score += expiringUsed * 20;

      // 同じ日に既に使ったレシピは不可
      if (todayUsedIds.has(recipe.id)) return null;

      // 週内で既に使ったレシピのペナルティ
      if (usedRecipeIds.has(recipe.id)) score -= 25;

      return { recipe, score, estimatedCost };
    })
    .filter((s): s is ScoredRecipe => s !== null)
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
