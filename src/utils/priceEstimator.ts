import { ingredientPrices } from '../data/ingredientPrices';
import type { Ingredient, FlyerPrice } from '../types';

export function getEstimatedPrice(
  ingredient: Ingredient,
  flyerPrices: FlyerPrice[]
): { price: number; source: 'flyer' | 'estimate' | 'unknown'; storeName?: string } {
  // 1. チラシ価格を優先（有効期限内のもの）
  const today = new Date().toISOString().split('T')[0];
  const flyerMatch = flyerPrices.find(
    fp => fp.ingredientName === ingredient.name && fp.validUntil >= today
  );
  if (flyerMatch) {
    return {
      price: flyerMatch.price,
      source: 'flyer',
      storeName: flyerMatch.storeName,
    };
  }

  // 2. 推定価格DBから検索
  const defaultMatch = ingredientPrices.find(
    dp => dp.ingredientName === ingredient.name
  );
  if (defaultMatch) {
    // 数量比で価格を計算
    const ratio = ingredient.quantity / defaultMatch.quantity;
    return {
      price: Math.round(defaultMatch.price * ratio),
      source: 'estimate',
    };
  }

  // 3. 不明
  return { price: 0, source: 'unknown' };
}

export function getRecipeTotalCost(
  ingredients: Ingredient[],
  flyerPrices: FlyerPrice[]
): number {
  return ingredients.reduce((total, ing) => {
    const { price } = getEstimatedPrice(ing, flyerPrices);
    return total + price;
  }, 0);
}

export function getRecipeCostPerServing(
  ingredients: Ingredient[],
  servings: number,
  flyerPrices: FlyerPrice[]
): number {
  const total = getRecipeTotalCost(ingredients, flyerPrices);
  return Math.round(total / servings);
}
