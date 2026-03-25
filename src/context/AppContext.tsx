import { createContext, useContext, type ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { defaultRecipes } from '../data/defaultRecipes';
import type { Recipe, MealPlan, FlyerPrice, InventoryItem, UserSettings, PlannedMeal } from '../types';
import { defaultSettings } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface AppContextType {
  // Settings
  settings: UserSettings;
  updateSettings: (settings: UserSettings) => void;

  // Recipes
  recipes: Recipe[];
  addRecipe: (recipe: Omit<Recipe, 'id' | 'isBuiltIn' | 'createdAt'>) => void;
  deleteRecipe: (id: string) => void;

  // Meal Plan
  mealPlan: MealPlan;
  addMeal: (meal: Omit<PlannedMeal, 'id'>) => void;
  removeMeal: (mealId: string) => void;
  clearPlan: () => void;

  // Flyer Prices
  flyerPrices: FlyerPrice[];
  addFlyerPrice: (price: Omit<FlyerPrice, 'id' | 'enteredAt' | 'source'>) => void;
  removeFlyerPrice: (id: string) => void;

  // Inventory
  inventory: InventoryItem[];
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;
  toggleInventoryUsed: (id: string) => void;
  removeInventoryItem: (id: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

function getMonday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0];
}

const emptyPlan: MealPlan = {
  id: 'current',
  weekStartDate: getMonday(),
  meals: [],
  weeklyBudget: 5000,
};

// 旧MealType('朝食'/'昼食'/'夕食')のデータをクリア
function migrateMealPlan(plan: MealPlan): MealPlan {
  const validTypes = new Set(['主菜', '副菜1', '副菜2', '汁物']);
  const hasOldData = plan.meals.some(m => !validTypes.has(m.mealType));
  if (hasOldData) {
    return { ...plan, meals: plan.meals.filter(m => validTypes.has(m.mealType)) };
  }
  return plan;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useLocalStorage<UserSettings>('rp_settings', defaultSettings);
  const [userRecipes, setUserRecipes] = useLocalStorage<Recipe[]>('rp_recipes', []);
  const [rawMealPlan, setMealPlan] = useLocalStorage<MealPlan>('rp_mealplan', emptyPlan);
  const mealPlan = migrateMealPlan(rawMealPlan);
  const [flyerPrices, setFlyerPrices] = useLocalStorage<FlyerPrice[]>('rp_flyerprices', []);
  const [inventory, setInventory] = useLocalStorage<InventoryItem[]>('rp_inventory', []);

  const recipes = [...defaultRecipes, ...userRecipes];

  const updateSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
    setMealPlan(prev => ({ ...prev, weeklyBudget: newSettings.weeklyBudget }));
  };

  const addRecipe = (recipe: Omit<Recipe, 'id' | 'isBuiltIn' | 'createdAt'>) => {
    const newRecipe: Recipe = {
      ...recipe,
      id: uuidv4(),
      isBuiltIn: false,
      createdAt: new Date().toISOString(),
    };
    setUserRecipes(prev => [...prev, newRecipe]);
  };

  const deleteRecipe = (id: string) => {
    setUserRecipes(prev => prev.filter(r => r.id !== id));
  };

  const addMeal = (meal: Omit<PlannedMeal, 'id'>) => {
    setMealPlan(prev => ({
      ...prev,
      meals: [...prev.meals, { ...meal, id: uuidv4() }],
    }));
  };

  const removeMeal = (mealId: string) => {
    setMealPlan(prev => ({
      ...prev,
      meals: prev.meals.filter(m => m.id !== mealId),
    }));
  };

  const clearPlan = () => {
    setMealPlan({ ...emptyPlan, weekStartDate: getMonday(), weeklyBudget: settings.weeklyBudget });
  };

  const addFlyerPrice = (price: Omit<FlyerPrice, 'id' | 'enteredAt' | 'source'>) => {
    setFlyerPrices(prev => [
      ...prev,
      { ...price, id: uuidv4(), enteredAt: new Date().toISOString(), source: 'manual' as const },
    ]);
  };

  const removeFlyerPrice = (id: string) => {
    setFlyerPrices(prev => prev.filter(p => p.id !== id));
  };

  const addInventoryItem = (item: Omit<InventoryItem, 'id'>) => {
    setInventory(prev => [...prev, { ...item, id: uuidv4() }]);
  };

  const toggleInventoryUsed = (id: string) => {
    setInventory(prev =>
      prev.map(i => (i.id === id ? { ...i, usedUp: !i.usedUp } : i))
    );
  };

  const removeInventoryItem = (id: string) => {
    setInventory(prev => prev.filter(i => i.id !== id));
  };

  return (
    <AppContext.Provider
      value={{
        settings, updateSettings,
        recipes, addRecipe, deleteRecipe,
        mealPlan, addMeal, removeMeal, clearPlan,
        flyerPrices, addFlyerPrice, removeFlyerPrice,
        inventory, addInventoryItem, toggleInventoryUsed, removeInventoryItem,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
