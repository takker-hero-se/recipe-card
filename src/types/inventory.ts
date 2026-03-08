import type { IngredientUnit } from './recipe';

export interface InventoryItem {
  id: string;
  ingredientName: string;
  quantity: number;
  unit: IngredientUnit;
  purchasedDate: string;
  estimatedExpiryDate: string;
  usedUp: boolean;
}
