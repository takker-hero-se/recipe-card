export type MealType = '朝食' | '昼食' | '夕食';

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
