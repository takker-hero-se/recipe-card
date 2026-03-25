import type { PlannedMeal, Recipe, FlyerPrice, InventoryItem, MealType } from '../types';
import { buildShoppingList } from './shoppingListBuilder';
import { getRecipeTotalCost } from './priceEstimator';

const COURSE_LABELS: Record<MealType, string> = {
  '主菜': '主菜',
  '副菜1': '副菜',
  '副菜2': '副菜',
  '汁物': '汁物',
};
const DAY_NAMES = ['月', '火', '水', '木', '金', '土', '日'];

interface ExportParams {
  meals: PlannedMeal[];
  recipes: Recipe[];
  flyerPrices: FlyerPrice[];
  inventory: InventoryItem[];
  weekStartDate: string;
  weeklyBudget: number;
  servingsPerMeal: number;
}

function getWeekDates(startDate: string): string[] {
  const dates: string[] = [];
  const start = new Date(startDate);
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

export function exportMealPlanPdf(params: ExportParams) {
  const { meals, recipes, flyerPrices, inventory, weekStartDate, weeklyBudget, servingsPerMeal } = params;
  const dates = getWeekDates(weekStartDate);
  const shoppingList = buildShoppingList(meals, recipes, flyerPrices, inventory);
  const totalCost = shoppingList.reduce((sum, item) => sum + item.estimatedPrice, 0);

  // 使用されているレシピを重複なしで収集
  const usedRecipeIds = [...new Set(meals.map(m => m.recipeId))];
  const usedRecipes = usedRecipeIds
    .map(id => recipes.find(r => r.id === id))
    .filter((r): r is Recipe => r !== null);

  const startD = new Date(weekStartDate);
  const endD = new Date(startD);
  endD.setDate(startD.getDate() + 6);
  const title = `${startD.getMonth() + 1}/${startD.getDate()} 〜 ${endD.getMonth() + 1}/${endD.getDate()} の献立`;

  let html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', 'Meiryo', sans-serif; font-size: 11px; color: #222; line-height: 1.5; padding: 12mm; }
  h1 { font-size: 18px; margin-bottom: 4px; }
  h2 { font-size: 14px; margin: 16px 0 6px; padding-bottom: 3px; border-bottom: 2px solid #2e7d32; color: #2e7d32; }
  h3 { font-size: 12px; margin: 10px 0 4px; color: #333; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
  th, td { border: 1px solid #ccc; padding: 4px 6px; text-align: left; vertical-align: top; }
  th { background: #e8f5e9; font-weight: bold; white-space: nowrap; }
  .meal-table th:first-child { width: 52px; }
  .right { text-align: right; }
  .muted { color: #888; }
  .subtitle { font-size: 12px; color: #666; margin-bottom: 12px; }
  .recipe-block { page-break-inside: avoid; margin-bottom: 14px; border: 1px solid #ddd; border-radius: 4px; padding: 8px 10px; }
  .recipe-title { font-size: 13px; font-weight: bold; color: #2e7d32; margin-bottom: 2px; }
  .recipe-meta { font-size: 10px; color: #888; margin-bottom: 6px; }
  .ing-grid { display: flex; flex-wrap: wrap; gap: 0; margin-bottom: 6px; }
  .ing-item { width: 50%; display: flex; justify-content: space-between; padding: 1px 4px; border-bottom: 1px solid #f0f0f0; font-size: 10px; }
  .ing-item:nth-child(odd) { padding-right: 12px; }
  ol { padding-left: 18px; font-size: 10.5px; }
  ol li { margin-bottom: 2px; }
  .page-break { page-break-before: always; }
  .summary-box { background: #f5f5f5; border-radius: 4px; padding: 6px 10px; margin-bottom: 12px; font-size: 11px; }
  .category-header { background: #e8f5e9; padding: 2px 6px; font-weight: bold; font-size: 10px; margin-top: 6px; }
  @media print {
    body { padding: 0; }
    .no-print { display: none; }
  }
</style>
</head>
<body>
<div class="no-print" style="text-align:center;margin-bottom:16px;">
  <button onclick="window.print()" style="font-size:16px;padding:10px 32px;background:#2e7d32;color:#fff;border:none;border-radius:6px;cursor:pointer;">PDFを保存 / 印刷</button>
  <p style="font-size:12px;color:#888;margin-top:6px;">ブラウザの印刷ダイアログで「PDFに保存」を選択してください</p>
</div>

<h1>${title}</h1>
<p class="subtitle">${servingsPerMeal}人分 ／ 予算 ¥${weeklyBudget.toLocaleString()}</p>
`;

  // === 献立表 ===
  html += `<h2>週間献立（一汁三菜）</h2>
<table class="meal-table">
<tr><th></th>`;
  const courseTypes: MealType[] = ['主菜', '副菜1', '副菜2', '汁物'];
  courseTypes.forEach(ct => { html += `<th>${COURSE_LABELS[ct]}</th>`; });
  html += `</tr>`;

  dates.forEach((date, i) => {
    const d = new Date(date);
    const dayMeals = meals.filter(m => m.date === date);
    html += `<tr><th>${DAY_NAMES[i]} ${d.getMonth() + 1}/${d.getDate()}</th>`;
    courseTypes.forEach(ct => {
      const meal = dayMeals.find(m => m.mealType === ct);
      const recipe = meal ? recipes.find(r => r.id === meal.recipeId) : null;
      html += `<td>${recipe ? recipe.name : '<span class="muted">-</span>'}</td>`;
    });
    html += `</tr>`;
  });
  html += `</table>`;

  // === 買い物リスト ===
  html += `<h2>買い物リスト</h2>`;
  html += `<div class="summary-box">合計（推定）: <strong>¥${totalCost.toLocaleString()}</strong>　※調味料（常備品）は除く</div>`;

  const categories = [...new Set(shoppingList.map(i => i.category))];
  html += `<table><tr><th>食材</th><th class="right">数量</th><th class="right">推定価格</th></tr>`;
  categories.forEach(cat => {
    html += `<tr><td colspan="3" class="category-header">${cat}</td></tr>`;
    shoppingList.filter(i => i.category === cat).forEach(item => {
      html += `<tr>
        <td>${item.ingredientName}</td>
        <td class="right">${item.totalQuantity}${item.unit}</td>
        <td class="right">${item.estimatedPrice > 0 ? `¥${item.estimatedPrice}` : '-'}</td>
      </tr>`;
    });
  });
  html += `</table>`;

  // === レシピ詳細 ===
  html += `<div class="page-break"></div>`;
  html += `<h2>レシピ詳細（${usedRecipes.length}品）</h2>`;

  usedRecipes.forEach(recipe => {
    const cost = Math.round(getRecipeTotalCost(recipe.ingredients, flyerPrices));
    html += `<div class="recipe-block">
      <div class="recipe-title">${recipe.name}</div>
      <div class="recipe-meta">${recipe.category}　|　${recipe.servings}人分　|　調理${recipe.prepTimeMinutes + recipe.cookTimeMinutes}分　|　約¥${cost}</div>
      <h3>材料</h3>
      <div class="ing-grid">`;
    recipe.ingredients.forEach(ing => {
      html += `<div class="ing-item"><span>${ing.name}</span><span class="muted">${ing.quantity}${ing.unit}</span></div>`;
    });
    html += `</div>
      <h3>作り方</h3>
      <ol>`;
    recipe.steps.forEach(step => {
      html += `<li>${step}</li>`;
    });
    html += `</ol></div>`;
  });

  html += `</body></html>`;

  // 新しいウィンドウで開いて印刷
  const w = window.open('', '_blank');
  if (w) {
    w.document.write(html);
    w.document.close();
  }
}
