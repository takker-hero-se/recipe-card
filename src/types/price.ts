import type { IngredientUnit, IngredientCategory } from './recipe';

export interface DefaultPrice {
  ingredientName: string;
  price: number;
  quantity: number;
  unit: IngredientUnit;
  category: IngredientCategory;
  shelfLifeDays: number;
  source: 'estimate';
}

export interface FlyerPrice {
  id: string;
  ingredientName: string;
  price: number;
  quantity: number;
  unit: string;
  storeName: string;
  validUntil: string;
  source: 'manual';
  enteredAt: string;
}
