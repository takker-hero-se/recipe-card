import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { buildShoppingList } from '../utils/shoppingListBuilder';
import { getFlyerLinks, getPrefectureFromPostalCode } from '../utils/flyerLinks';
import { scrapeAllFlyers, type ScrapeResult } from '../utils/flyerScraper';

export function ShoppingPage() {
  const { settings, recipes, mealPlan, flyerPrices, inventory, addFlyerPrice, removeFlyerPrice } = useApp();
  const [tab, setTab] = useState<'list' | 'flyers' | 'prices'>('list');
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  // スクレイピング状態
  const [scraping, setScraping] = useState(false);
  const [scrapeResult, setScrapeResult] = useState<ScrapeResult | null>(null);

  // チラシ価格入力用
  const [newPriceName, setNewPriceName] = useState('');
  const [newPriceValue, setNewPriceValue] = useState('');
  const [newPriceQty, setNewPriceQty] = useState('1');
  const [newPriceUnit, setNewPriceUnit] = useState('個');
  const [newPriceStore, setNewPriceStore] = useState('');
  const [newPriceExpiry, setNewPriceExpiry] = useState('');

  const shoppingList = useMemo(
    () => buildShoppingList(mealPlan.meals, recipes, flyerPrices, inventory),
    [mealPlan.meals, recipes, flyerPrices, inventory]
  );

  const totalEstimated = shoppingList.reduce((sum, item) => sum + item.estimatedPrice, 0);
  const flyerLinks = settings.postalCode ? getFlyerLinks(settings.postalCode) : [];
  const prefecture = settings.postalCode ? getPrefectureFromPostalCode(settings.postalCode) : null;

  const toggleCheck = (name: string) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleAddFlyerPrice = () => {
    if (!newPriceName || !newPriceValue) return;
    addFlyerPrice({
      ingredientName: newPriceName,
      price: Number(newPriceValue),
      quantity: Number(newPriceQty),
      unit: newPriceUnit,
      storeName: newPriceStore,
      validUntil: newPriceExpiry || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    });
    setNewPriceName('');
    setNewPriceValue('');
    setNewPriceQty('1');
    setNewPriceStore('');
  };

  // チラシ情報取得
  const handleScrape = async () => {
    if (!settings.postalCode) return;
    setScraping(true);
    setScrapeResult(null);
    try {
      const result = await scrapeAllFlyers(settings.postalCode);
      setScrapeResult(result);
    } catch {
      // エラー時も直接リンクを表示
      setScrapeResult({
        stores: [],
        scrapedAt: new Date().toISOString(),
        source: 'error',
        error: 'エラーが発生しました',
        directLinks: [
          { name: 'トクバイで確認', url: `https://tokubai.co.jp/?postal_code=${settings.postalCode.replace(/[-ー]/g, '')}` },
          { name: 'Shufoo!で確認', url: `https://www.shufoo.net/pntweb/shopDetail/prefectureSearchList/?zipCode=${settings.postalCode.replace(/[-ー]/g, '')}` },
        ],
      });
    } finally {
      setScraping(false);
    }
  };

  return (
    <div className="app-container">
      <h2 className="page-title">買い物</h2>

      {/* タブ */}
      <div className="tabs">
        <button className={`tab ${tab === 'list' ? 'active' : ''}`} onClick={() => setTab('list')}>
          買い物リスト
        </button>
        <button className={`tab ${tab === 'flyers' ? 'active' : ''}`} onClick={() => setTab('flyers')}>
          チラシ取得
        </button>
        <button className={`tab ${tab === 'prices' ? 'active' : ''}`} onClick={() => setTab('prices')}>
          特売入力
        </button>
      </div>

      {/* 買い物リスト */}
      {tab === 'list' && (
        <>
          {shoppingList.length === 0 ? (
            <div className="empty-state">
              <p>献立を計画すると買い物リストが自動生成されます</p>
            </div>
          ) : (
            <>
              <div className="card mb-16">
                <div className="flex-between">
                  <span className="font-bold">合計（推定）</span>
                  <span className="font-bold" style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>
                    ¥{totalEstimated.toLocaleString()}
                  </span>
                </div>
                <div className="text-sm text-muted mt-8">
                  ※ 調味料（常備品）は含まれていません
                </div>
              </div>

              {/* カテゴリ別グループ */}
              {Array.from(new Set(shoppingList.map(i => i.category))).map(category => (
                <div key={category} className="mb-16">
                  <h3 className="text-sm font-bold mb-8" style={{ color: 'var(--primary)' }}>{category}</h3>
                  {shoppingList
                    .filter(i => i.category === category)
                    .map(item => (
                      <div
                        key={item.ingredientName}
                        className={`shopping-item ${checkedItems.has(item.ingredientName) ? 'checked' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={checkedItems.has(item.ingredientName)}
                          onChange={() => toggleCheck(item.ingredientName)}
                        />
                        <span className="shopping-item-name">{item.ingredientName}</span>
                        <span className="shopping-item-qty">{item.totalQuantity}{item.unit}</span>
                        <span className={`shopping-item-price ${
                          item.priceSource === 'flyer' ? 'price-flyer' :
                          item.priceSource === 'estimate' ? 'price-estimate' : 'price-unknown'
                        }`}>
                          {item.estimatedPrice > 0 ? `¥${item.estimatedPrice}` : '?'}
                          {item.priceSource === 'flyer' && item.storeName && (
                            <span className="text-xs"> ({item.storeName})</span>
                          )}
                        </span>
                      </div>
                    ))}
                </div>
              ))}
              <div className="text-sm text-muted mt-8">
                <span className="price-flyer">赤字</span> = チラシ価格 /
                <span className="price-estimate"> 灰字</span> = 推定価格
              </div>
            </>
          )}
        </>
      )}

      {/* チラシ取得（スクレイピング） */}
      {tab === 'flyers' && (
        <>
          {prefecture && (
            <div className="card mb-16">
              <div className="flex-between">
                <div>
                  <span className="text-sm text-muted">エリア: </span>
                  <span className="font-bold">{prefecture}</span>
                  <span className="text-sm text-muted">（〒{settings.postalCode}）</span>
                </div>
              </div>
            </div>
          )}

          {!settings.postalCode ? (
            <div className="empty-state">
              <p>設定画面から郵便番号を入力してください</p>
            </div>
          ) : (
            <>
              {/* スクレイピングボタン */}
              <button
                className="btn btn-primary btn-block mb-16"
                onClick={handleScrape}
                disabled={scraping}
              >
                {scraping ? '取得中...' : '近隣スーパーの特売情報を取得'}
              </button>

              {scraping && (
                <div className="card mb-16 text-center">
                  <p className="text-sm text-muted">確認中...</p>
                </div>
              )}

              {/* 取得結果（直接リンク案内） */}
              {scrapeResult && scrapeResult.directLinks && (
                <div className="card mb-16" style={{ borderLeft: '4px solid var(--primary)' }}>
                  <p className="text-sm mb-12">
                    以下のサイトで特売情報を確認し、「特売入力」タブから価格を登録してください。
                  </p>
                  {scrapeResult.directLinks.map((link, i) => (
                    <a
                      key={i}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline btn-block mb-8"
                      style={{ textAlign: 'center' }}
                    >
                      {link.name}
                    </a>
                  ))}
                </div>
              )}

              {/* 直接リンク */}
              <h3 className="text-sm font-bold mt-16 mb-8">チラシサイト</h3>
              {flyerLinks.map(link => (
                <a
                  key={link.serviceName}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flyer-link-card"
                >
                  <div className="flyer-link-icon">📰</div>
                  <div className="flyer-link-info">
                    <h3>{link.serviceName}</h3>
                    <p>{link.description}</p>
                  </div>
                </a>
              ))}
            </>
          )}
        </>
      )}

      {/* 特売価格入力 */}
      {tab === 'prices' && (
        <>
          <div className="card">
            <h3 className="mb-16">特売価格を手動登録</h3>
            <div className="form-group">
              <label>食材名</label>
              <input value={newPriceName} onChange={e => setNewPriceName(e.target.value)} placeholder="例: 鶏もも肉" />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label>価格（円）</label>
                <input type="number" value={newPriceValue} onChange={e => setNewPriceValue(e.target.value)} placeholder="例: 98" />
              </div>
              <div className="form-group">
                <label>数量</label>
                <div className="flex gap-8">
                  <input type="number" value={newPriceQty} onChange={e => setNewPriceQty(e.target.value)} style={{ width: '60px' }} />
                  <input value={newPriceUnit} onChange={e => setNewPriceUnit(e.target.value)} placeholder="単位" style={{ width: '60px' }} />
                </div>
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label>店名</label>
                <input value={newPriceStore} onChange={e => setNewPriceStore(e.target.value)} placeholder="例: イオン" />
              </div>
              <div className="form-group">
                <label>有効期限</label>
                <input type="date" value={newPriceExpiry} onChange={e => setNewPriceExpiry(e.target.value)} />
              </div>
            </div>
            <button className="btn btn-secondary btn-block" onClick={handleAddFlyerPrice} disabled={!newPriceName || !newPriceValue}>
              登録する
            </button>
          </div>

          {/* 登録済み特売価格 */}
          {flyerPrices.length > 0 && (
            <div className="mt-16">
              <h3 className="text-sm font-bold mb-8">登録済み特売価格 ({flyerPrices.length}件)</h3>
              {flyerPrices.map(fp => {
                const isExpired = fp.validUntil < new Date().toISOString().split('T')[0];
                return (
                  <div key={fp.id} className="card flex-between" style={isExpired ? { opacity: 0.5 } : {}}>
                    <div>
                      <div className="font-bold">{fp.ingredientName}</div>
                      <div className="text-sm text-muted">
                        ¥{fp.price}/{fp.quantity}{fp.unit} @ {fp.storeName}
                        {isExpired && <span className="badge badge-red" style={{ marginLeft: '8px' }}>期限切れ</span>}
                      </div>
                    </div>
                    <button className="btn btn-sm btn-danger" onClick={() => removeFlyerPrice(fp.id)}>
                      削除
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
