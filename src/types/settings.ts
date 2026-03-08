export interface UserSettings {
  postalCode: string;
  weeklyBudget: number;
  servingsPerMeal: number;
  planningDays: number; // 7 for weekly
}

export const defaultSettings: UserSettings = {
  postalCode: '',
  weeklyBudget: 5000,
  servingsPerMeal: 2,
  planningDays: 7,
};
