import { useApp } from '../context/AppContext';
import { calculatePlanTotalCost } from '../utils/mealPlanner';
import { recipeSites } from '../data/recipeSites';
import { Link } from 'react-router-dom';

export function HomePage() {
  const { settings, recipes, mealPlan, flyerPrices, inventory } = useApp();
  const totalCost = calculatePlanTotalCost(mealPlan.meals, recipes, flyerPrices);
  const budgetUsed = settings.weeklyBudget > 0 ? (totalCost / settings.weeklyBudget) * 100 : 0;

  // 期限が近い在庫
  const today = new Date();
  const expiringItems = inventory
    .filter(i => {
      if (i.usedUp) return false;
      const expiry = new Date(i.estimatedExpiryDate);
      const days = (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
      return days <= 3 && days >= 0;
    })
    .sort((a, b) => new Date(a.estimatedExpiryDate).getTime() - new Date(b.estimatedExpiryDate).getTime());

  const budgetColor = budgetUsed > 90 ? '#d32f2f' : budgetUsed > 70 ? '#f57c00' : '#388e3c';

  return (
    <div className="app-container">
      <h2 className="page-title">ダッシュボード</h2>

      {/* 予算状況 */}
      <div className="card">
        <div className="flex-between">
          <span className="font-bold">今週の予算</span>
          <span className="font-bold" style={{ color: budgetColor }}>
            ¥{totalCost.toLocaleString()} / ¥{settings.weeklyBudget.toLocaleString()}
          </span>
        </div>
        <div className="budget-meter">
          <div
            className="budget-meter-fill"
            style={{ width: `${Math.min(100, budgetUsed)}%`, background: budgetColor }}
          />
        </div>
        <div className="flex-between text-sm text-muted">
          <span>残り ¥{Math.max(0, settings.weeklyBudget - totalCost).toLocaleString()}</span>
          <span>{mealPlan.meals.length}食 計画済み</span>
        </div>
      </div>

      {/* 期限切れ近い食材 */}
      {expiringItems.length > 0 && (
        <div className="card" style={{ borderLeft: '4px solid var(--warning)' }}>
          <h3 className="mb-8" style={{ color: 'var(--warning)' }}>期限が近い食材</h3>
          {expiringItems.map(item => {
            const expiry = new Date(item.estimatedExpiryDate);
            const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            return (
              <div key={item.id} className="flex-between mb-8">
                <span>{item.ingredientName}</span>
                <span className={daysLeft <= 1 ? 'badge badge-red' : 'badge badge-orange'}>
                  {daysLeft <= 0 ? '今日まで' : `あと${daysLeft}日`}
                </span>
              </div>
            );
          })}
          <Link to="/recipes" className="text-sm" style={{ color: 'var(--primary)' }}>
            → これらを使うレシピを探す
          </Link>
        </div>
      )}

      {/* クイックリンク */}
      <div className="grid-2 mt-16">
        <Link to="/planner" className="card text-center" style={{ textDecoration: 'none', color: 'var(--text)' }}>
          <div style={{ fontSize: '2rem' }}>📅</div>
          <div className="font-bold mt-8">献立を立てる</div>
        </Link>
        <Link to="/shopping" className="card text-center" style={{ textDecoration: 'none', color: 'var(--text)' }}>
          <div style={{ fontSize: '2rem' }}>🛒</div>
          <div className="font-bold mt-8">買い物リスト</div>
        </Link>
      </div>

      {/* 参考レシピサイト */}
      <div className="mt-16">
        <h3 className="page-title">参考レシピサイト</h3>
        {recipeSites.map(site => (
          <a
            key={site.name}
            href={site.budgetSearchUrl || site.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flyer-link-card"
          >
            <div className="flyer-link-icon">📝</div>
            <div className="flyer-link-info">
              <h3>{site.name}</h3>
              <p>{site.description}</p>
            </div>
          </a>
        ))}
      </div>

      {!settings.postalCode && (
        <div className="card mt-16" style={{ borderLeft: '4px solid var(--primary)' }}>
          <p className="text-sm">
            <Link to="/settings" style={{ fontWeight: 700 }}>設定</Link>から郵便番号を入力すると、
            近隣スーパーのチラシ情報にアクセスできます。
          </p>
        </div>
      )}
    </div>
  );
}
