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

// 食事タイプごとに適したレシピカテゴリ
const MEAL_CATEGORY_PREFERENCE: Record<MealType, { preferred: string[]; weight: number }> = {
  '朝食': { preferred: ['主食', '副菜', 'デザート'], weight: 15 },
  '昼食': { preferred: ['主食', '主菜', '汁物'], weight: 10 },
  '夕食': { preferred: ['主菜', '主食', '汁物', '副菜'], weight: 5 },
};

// 朝食向きのタグ
const BREAKFAST_TAGS = ['朝食', '時短', '節約'];
// 軽食向きのタグ
const LIGHT_TAGS = ['副菜', '時短', 'サラダ', '汁物'];

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

  // 同じ日に既に割り当てられたレシピカテゴリ
  const sameDayCategories = currentPlan
    .filter(m => m.date === params.targetDate)
    .map(m => availableRecipes.find(r => r.id === m.recipeId)?.category)
    .filter(Boolean) as string[];

  const scored: ScoredRecipe[] = availableRecipes.map(recipe => {
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
      score += 5;
      const plannedCategories = currentPlan
        .map(m => availableRecipes.find(r => r.id === m.recipeId)?.category)
        .filter(Boolean);
      if (!plannedCategories.includes(recipe.category)) {
        score += 5;
      }
    }

    // 5. 食事タイプ適合スコア (0-15)
    const pref = MEAL_CATEGORY_PREFERENCE[mealType];
    if (pref.preferred.includes(recipe.category)) {
      score += pref.weight;
    }
    if (mealType === '朝食' && recipe.tags.some(t => BREAKFAST_TAGS.includes(t))) {
      score += 10;
    }
    if (mealType === '朝食' && (recipe.prepTimeMinutes + recipe.cookTimeMinutes) <= 10) {
      score += 8;
    }

    // 6. 同日内カテゴリ重複ペナルティ
    if (sameDayCategories.includes(recipe.category)) {
      score -= 8;
    }

    return { recipe, score, estimatedCost };
  });

  return scored
    .filter(s => s.estimatedCost <= remainingBudget || remainingBudget <= 0)
    .sort((a, b) => b.score - a.score);
}

// ===== 自動献立生成 =====

interface AutoPlanParams {
  availableRecipes: Recipe[];
  inventory: InventoryItem[];
  flyerPrices: FlyerPrice[];
  weeklyBudget: number;
  servingsPerMeal: number;
  weekStartDate: string;
  mealsPerDay: MealType[]; // どの食事を計画するか
}

interface AutoPlanResult {
  meals: PlannedMeal[];
  totalCost: number;
  ingredientVariety: number; // ユニーク食材数
  wasteScore: number; // 食材使い切りスコア (0-100)
}

export function generateAutoPlan(params: AutoPlanParams): AutoPlanResult {
  const {
    availableRecipes,
    inventory,
    flyerPrices,
    weeklyBudget,
    servingsPerMeal,
    weekStartDate,
    mealsPerDay,
  } = params;

  // 7日分の日付を生成
  const dates: string[] = [];
  const start = new Date(weekStartDate);
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }

  const meals: PlannedMeal[] = [];
  let remainingBudget = weeklyBudget;
  const usedRecipeIds = new Set<string>();
  const plannedIngredients = new Map<string, number>(); // 食材名 → 使用回数

  // 各スロットに優先度をつけてソート
  // 夕食 > 昼食 > 朝食 の順に重要度が高いので先に割り当てる
  const mealPriority: Record<MealType, number> = { '夕食': 0, '昼食': 1, '朝食': 2 };
  const slots: { date: string; mealType: MealType }[] = [];
  for (const date of dates) {
    for (const mealType of mealsPerDay) {
      slots.push({ date, mealType });
    }
  }
  slots.sort((a, b) => mealPriority[a.mealType] - mealPriority[b.mealType]);

  // 食事タイプ別のレシピプールを分類
  const recipesByMealSuitability = categorizeBySuitability(availableRecipes);

  // 各日の使用カテゴリを追跡
  const dayCategories = new Map<string, string[]>();

  for (const slot of slots) {
    const totalSlots = slots.length;
    const filledSlots = meals.length;
    const remainingSlots = totalSlots - filledSlots;

    // 残り予算を残りスロットで割って1食あたりの予算目安を計算
    const perMealBudget = remainingSlots > 0 ? remainingBudget / remainingSlots : 0;
    // 夕食は少し多め、朝食は少なめに
    const budgetMultiplier = slot.mealType === '夕食' ? 1.5 : slot.mealType === '昼食' ? 1.0 : 0.5;
    const slotBudget = Math.round(perMealBudget * budgetMultiplier);

    // この日の既に使ったカテゴリ
    const todayCategories = dayCategories.get(slot.date) || [];

    // 候補レシピをスコアリング
    const candidates = scoreForAutoSlot({
      recipes: slot.mealType === '朝食'
        ? recipesByMealSuitability.breakfast
        : slot.mealType === '昼食'
          ? recipesByMealSuitability.lunch
          : recipesByMealSuitability.dinner,
      mealType: slot.mealType,
      slotBudget,
      remainingBudget,
      servingsPerMeal,
      flyerPrices,
      inventory,
      usedRecipeIds,
      plannedIngredients,
      todayCategories,
    });

    if (candidates.length === 0) continue;

    // 上位候補からランダム要素を加えて選択（上位3つから）
    const topN = candidates.slice(0, Math.min(3, candidates.length));
    const selected = topN[Math.floor(Math.random() * topN.length)];

    const servingRatio = servingsPerMeal / selected.recipe.servings;
    const cost = Math.round(getRecipeTotalCost(selected.recipe.ingredients, flyerPrices) * servingRatio);

    meals.push({
      id: uuidv4(),
      date: slot.date,
      mealType: slot.mealType,
      recipeId: selected.recipe.id,
      servings: servingsPerMeal,
    });

    remainingBudget -= cost;
    usedRecipeIds.add(selected.recipe.id);

    // 使用食材を記録
    selected.recipe.ingredients.forEach(ing => {
      if (ing.category !== '調味料') {
        plannedIngredients.set(ing.name, (plannedIngredients.get(ing.name) || 0) + 1);
      }
    });

    // 日別カテゴリを記録
    const cats = dayCategories.get(slot.date) || [];
    cats.push(selected.recipe.category);
    dayCategories.set(slot.date, cats);
  }

  // 結果サマリーを計算
  const totalCost = weeklyBudget - remainingBudget;
  const ingredientVariety = plannedIngredients.size;

  // 食材使い切りスコア: 同じ食材が多く使われているほど高い
  const totalUses = Array.from(plannedIngredients.values()).reduce((a, b) => a + b, 0);
  const uniqueIngredients = plannedIngredients.size;
  const wasteScore = uniqueIngredients > 0
    ? Math.round(Math.min(100, (totalUses / uniqueIngredients) * 30))
    : 0;

  return { meals, totalCost, ingredientVariety, wasteScore };
}

interface SlotScoringParams {
  recipes: Recipe[];
  mealType: MealType;
  slotBudget: number;
  remainingBudget: number;
  servingsPerMeal: number;
  flyerPrices: FlyerPrice[];
  inventory: InventoryItem[];
  usedRecipeIds: Set<string>;
  plannedIngredients: Map<string, number>;
  todayCategories: string[];
}

function scoreForAutoSlot(params: SlotScoringParams): ScoredRecipe[] {
  const {
    recipes, mealType, slotBudget, remainingBudget,
    servingsPerMeal, flyerPrices, inventory,
    usedRecipeIds, plannedIngredients, todayCategories,
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

      let score = 50; // ベーススコア

      // 予算チェック
      if (estimatedCost > remainingBudget) return null;
      if (estimatedCost > slotBudget * 2) score -= 15; // 1食予算の2倍超はペナルティ
      if (estimatedCost <= slotBudget) score += 10; // 予算内ボーナス

      // 安いほどボーナス（節約重視）
      score += Math.max(0, 15 - Math.round(estimatedCost / 100));

      // 食材重複ボーナス（フードロス削減の核心）
      const nonSeasoning = recipe.ingredients.filter(i => i.category !== '調味料');
      const overlap = nonSeasoning.filter(i => plannedIngredients.has(i.name) || inventoryNames.has(i.name)).length;
      score += Math.round((overlap / Math.max(1, nonSeasoning.length)) * 35);

      // 期限切れ間近の食材使用
      const expiringUsed = recipe.ingredients.filter(i => soonExpiring.has(i.name)).length;
      score += expiringUsed * 20;

      // 既に使ったレシピのペナルティ
      if (usedRecipeIds.has(recipe.id)) score -= 25;

      // 同日カテゴリ重複ペナルティ
      if (todayCategories.includes(recipe.category)) score -= 10;

      // 朝食向き判定
      if (mealType === '朝食') {
        const totalTime = recipe.prepTimeMinutes + recipe.cookTimeMinutes;
        if (totalTime <= 5) score += 15;
        else if (totalTime <= 10) score += 10;
        else if (totalTime > 20) score -= 10;
        if (recipe.tags.some(t => BREAKFAST_TAGS.includes(t))) score += 8;
        // 朝食に重い主菜は不適切
        if (recipe.category === '主菜' && totalTime > 15) score -= 10;
      }

      // 昼食: 主食系を優先
      if (mealType === '昼食' && recipe.category === '主食') score += 8;

      // 夕食: 主菜を優先、副菜・汁物もあると良い
      if (mealType === '夕食') {
        if (recipe.category === '主菜') score += 10;
        if (recipe.category === '汁物' && !todayCategories.includes('汁物')) score += 5;
      }

      return { recipe, score, estimatedCost };
    })
    .filter((s): s is ScoredRecipe => s !== null)
    .sort((a, b) => b.score - a.score);
}

function categorizeBySuitability(recipes: Recipe[]): {
  breakfast: Recipe[];
  lunch: Recipe[];
  dinner: Recipe[];
} {
  const breakfast: Recipe[] = [];
  const lunch: Recipe[] = [];
  const dinner: Recipe[] = [];

  for (const r of recipes) {
    const totalTime = r.prepTimeMinutes + r.cookTimeMinutes;
    const isQuick = totalTime <= 10;
    const hasBreakfastTag = r.tags.some(t => BREAKFAST_TAGS.includes(t));
    const isLight = r.tags.some(t => LIGHT_TAGS.includes(t)) || r.category === '副菜';

    // 朝食候補: 時短 or 朝食タグ or 軽いもの
    if (isQuick || hasBreakfastTag || r.category === 'デザート' ||
        (isLight && totalTime <= 15)) {
      breakfast.push(r);
    }

    // 昼食候補: ほぼ全て（重すぎなければ）
    lunch.push(r);

    // 夕食候補: 全て
    dinner.push(r);
  }

  return { breakfast, lunch, dinner };
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
