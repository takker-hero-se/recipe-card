export type MealType = '主菜' | '副菜1' | '副菜2' | '汁物';

export interface PlannedMeal {
  id: string;
  date: string; // YYYY-MM-DD
  mealType: MealType;
  recipeId: string;
  servings: number;
}

export interface MealPlan {
  id: string;
  weekStartDate: string; // Monday
  meals: PlannedMeal[];
  weeklyBudget: number;
}
