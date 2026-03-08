export type IngredientUnit = 'g' | 'ml' | '個' | '本' | '枚' | '束' | 'パック' | '丁' | '合' | '袋' | '缶' | '切れ' | '玉' | '把' | '片' | '適量';

export type IngredientCategory = '肉類' | '魚介類' | '野菜' | '果物' | '乳製品・卵' | '調味料' | '穀物' | '豆腐・大豆製品' | '乾物' | 'その他';

export type RecipeCategory = '主菜' | '副菜' | '汁物' | '主食' | 'デザート' | 'その他';

export interface Ingredient {
  name: string;
  quantity: number;
  unit: IngredientUnit;
  category: IngredientCategory;
  optional?: boolean;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  category: RecipeCategory;
  servings: number;
  ingredients: Ingredient[];
  steps: string[];
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  tags: string[];
  isBuiltIn: boolean;
  sourceUrl?: string;
  createdAt: string;
}
