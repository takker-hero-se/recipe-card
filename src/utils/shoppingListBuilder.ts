import type { PlannedMeal, Recipe, Ingredient, FlyerPrice, InventoryItem } from '../types';
import { getEstimatedPrice } from './priceEstimator';

export interface ShoppingListItem {
  ingredientName: string;
  totalQuantity: number;
  unit: string;
  category: string;
  estimatedPrice: number;
  priceSource: 'flyer' | 'estimate' | 'unknown';
  storeName?: string;
  checked: boolean;
}

export function buildShoppingList(
  plan: PlannedMeal[],
  recipes: Recipe[],
  flyerPrices: FlyerPrice[],
  inventory: InventoryItem[]
): ShoppingListItem[] {
  // 全食材を集計
  const ingredientMap = new Map<string, { quantity: number; unit: string; category: string; ingredient: Ingredient }>();

  plan.forEach(meal => {
    const recipe = recipes.find(r => r.id === meal.recipeId);
    if (!recipe) return;
    const ratio = meal.servings / recipe.servings;

    recipe.ingredients.forEach(ing => {
      if (ing.category === '調味料') return; // 調味料は常備品として除外

      const key = ing.name;
      const existing = ingredientMap.get(key);
      if (existing) {
        existing.quantity += ing.quantity * ratio;
      } else {
        ingredientMap.set(key, {
          quantity: ing.quantity * ratio,
          unit: ing.unit,
          category: ing.category,
          ingredient: ing,
        });
      }
    });
  });

  // 在庫を差し引く
  inventory.forEach(inv => {
    if (inv.usedUp) return;
    const item = ingredientMap.get(inv.ingredientName);
    if (item && item.unit === inv.unit) {
      item.quantity = Math.max(0, item.quantity - inv.quantity);
    }
  });

  // リストを構築
  return Array.from(ingredientMap.entries())
    .filter(([, v]) => v.quantity > 0)
    .map(([name, v]) => {
      const priceInfo = getEstimatedPrice(
        { ...v.ingredient, quantity: v.quantity },
        flyerPrices
      );
      return {
        ingredientName: name,
        totalQuantity: Math.ceil(v.quantity * 10) / 10,
        unit: v.unit,
        category: v.category,
        estimatedPrice: priceInfo.price,
        priceSource: priceInfo.source,
        storeName: priceInfo.storeName,
        checked: false,
      };
    })
    .sort((a, b) => a.category.localeCompare(b.category));
}
