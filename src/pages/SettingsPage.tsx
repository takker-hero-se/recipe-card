import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getPrefectureFromPostalCode } from '../utils/flyerLinks';
import { exportAllData, importAllData } from '../utils/storage';
import type { IngredientUnit } from '../types';
import { ingredientPrices } from '../data/ingredientPrices';

export function SettingsPage() {
  const { settings, updateSettings, inventory, addInventoryItem, toggleInventoryUsed, removeInventoryItem } = useApp();
  const [postalCode, setPostalCode] = useState(settings.postalCode);
  const [budget, setBudget] = useState(settings.weeklyBudget);
  const [servings, setServings] = useState(settings.servingsPerMeal);
  const [tab, setTab] = useState<'settings' | 'inventory' | 'data'>('settings');

  // 在庫入力
  const [invName, setInvName] = useState('');
  const [invQty, setInvQty] = useState('1');
  const [invUnit, setInvUnit] = useState<IngredientUnit>('個');
  const [invDate, setInvDate] = useState(new Date().toISOString().split('T')[0]);

  const prefecture = postalCode ? getPrefectureFromPostalCode(postalCode) : null;

  const handleSave = () => {
    updateSettings({
      postalCode,
      weeklyBudget: budget,
      servingsPerMeal: servings,
      planningDays: 7,
    });
  };

  const handleAddInventory = () => {
    if (!invName) return;
    const priceInfo = ingredientPrices.find(p => p.ingredientName === invName);
    const shelfLife = priceInfo?.shelfLifeDays || 7;
    const expiry = new Date(invDate);
    expiry.setDate(expiry.getDate() + shelfLife);

    addInventoryItem({
      ingredientName: invName,
      quantity: Number(invQty),
      unit: invUnit,
      purchasedDate: invDate,
      estimatedExpiryDate: expiry.toISOString().split('T')[0],
      usedUp: false,
    });
    setInvName('');
    setInvQty('1');
  };

  const handleExport = () => {
    const data = exportAllData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recipe-planner-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const success = importAllData(reader.result as string);
        if (success) {
          window.location.reload();
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const unitOptions: IngredientUnit[] = ['g', 'ml', '個', '本', '枚', '束', 'パック', '丁', '合', '袋', '缶', '切れ', '玉', '把', '片', '適量'];

  const today = new Date();
  const activeInventory = inventory.filter(i => !i.usedUp).sort((a, b) =>
    new Date(a.estimatedExpiryDate).getTime() - new Date(b.estimatedExpiryDate).getTime()
  );

  return (
    <div className="app-container">
      <h2 className="page-title">設定</h2>

      <div className="tabs">
        <button className={`tab ${tab === 'settings' ? 'active' : ''}`} onClick={() => setTab('settings')}>基本設定</button>
        <button className={`tab ${tab === 'inventory' ? 'active' : ''}`} onClick={() => setTab('inventory')}>在庫管理</button>
        <button className={`tab ${tab === 'data' ? 'active' : ''}`} onClick={() => setTab('data')}>データ</button>
      </div>

      {tab === 'settings' && (
        <div className="card">
          <div className="form-group">
            <label>郵便番号</label>
            <input
              value={postalCode}
              onChange={e => setPostalCode(e.target.value)}
              placeholder="例: 100-0001"
              maxLength={8}
            />
            {prefecture && (
              <span className="text-sm" style={{ color: 'var(--success)' }}>
                → {prefecture}
              </span>
            )}
          </div>

          <div className="form-group">
            <label>週間予算（円）</label>
            <input
              type="number"
              value={budget}
              onChange={e => setBudget(Number(e.target.value))}
              min={0}
              step={500}
            />
          </div>

          <div className="form-group">
            <label>1食あたりの人数</label>
            <input
              type="number"
              value={servings}
              onChange={e => setServings(Number(e.target.value))}
              min={1}
              max={10}
            />
          </div>

          <button className="btn btn-primary btn-block" onClick={handleSave}>
            保存する
          </button>
        </div>
      )}

      {tab === 'inventory' && (
        <>
          <div className="card">
            <h3 className="mb-16">食材を追加</h3>
            <div className="form-group">
              <label>食材名</label>
              <input value={invName} onChange={e => setInvName(e.target.value)} placeholder="例: 鶏もも肉" list="ingredient-list" />
              <datalist id="ingredient-list">
                {ingredientPrices.map(p => (
                  <option key={p.ingredientName} value={p.ingredientName} />
                ))}
              </datalist>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label>数量</label>
                <div className="flex gap-8">
                  <input type="number" value={invQty} onChange={e => setInvQty(e.target.value)} style={{ width: '60px' }} />
                  <select value={invUnit} onChange={e => setInvUnit(e.target.value as IngredientUnit)}>
                    {unitOptions.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>購入日</label>
                <input type="date" value={invDate} onChange={e => setInvDate(e.target.value)} />
              </div>
            </div>
            <button className="btn btn-primary btn-block" onClick={handleAddInventory} disabled={!invName}>
              追加
            </button>
          </div>

          <h3 className="mt-16 mb-8 text-sm font-bold">現在の在庫 ({activeInventory.length}件)</h3>
          {activeInventory.length === 0 ? (
            <div className="empty-state"><p>在庫がありません</p></div>
          ) : (
            activeInventory.map(item => {
              const expiry = new Date(item.estimatedExpiryDate);
              const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              const badgeClass = daysLeft <= 1 ? 'badge-red' : daysLeft <= 3 ? 'badge-orange' : 'badge-green';

              return (
                <div key={item.id} className="card flex-between">
                  <div>
                    <div className="font-bold">{item.ingredientName}</div>
                    <div className="text-sm text-muted">
                      {item.quantity}{item.unit}
                      <span className={`badge ${badgeClass}`} style={{ marginLeft: '8px' }}>
                        {daysLeft <= 0 ? '期限切れ' : `あと${daysLeft}日`}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-8">
                    <button className="btn btn-sm btn-outline" onClick={() => toggleInventoryUsed(item.id)}>
                      使い切り
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => removeInventoryItem(item.id)}>
                      削除
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </>
      )}

      {tab === 'data' && (
        <div className="card">
          <h3 className="mb-16">データ管理</h3>
          <div className="flex gap-12" style={{ flexDirection: 'column' }}>
            <button className="btn btn-outline btn-block" onClick={handleExport}>
              データをエクスポート
            </button>
            <button className="btn btn-outline btn-block" onClick={handleImport}>
              データをインポート
            </button>
            <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />
            <button
              className="btn btn-danger btn-block"
              onClick={() => {
                if (confirm('全データを削除しますか？この操作は取り消せません。')) {
                  localStorage.clear();
                  window.location.reload();
                }
              }}
            >
              全データを削除
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
