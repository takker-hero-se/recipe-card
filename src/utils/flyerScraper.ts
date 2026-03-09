/**
 * チラシ情報スクレイピングユーティリティ
 * CORSプロキシ経由でトクバイ等から特売情報を取得する
 */

export interface ScrapedProduct {
  name: string;
  price: number;
  originalPrice?: number;
  unit: string;
  storeName: string;
  storeArea: string;
  validUntil: string;
}

export interface ScrapedStore {
  name: string;
  area: string;
  products: ScrapedProduct[];
}

export interface ScrapeResult {
  stores: ScrapedStore[];
  scrapedAt: string;
  source: string;
  error?: string;
}

const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?url=',
];

async function fetchWithProxy(url: string): Promise<string> {
  for (const proxy of CORS_PROXIES) {
    try {
      const res = await fetch(proxy + encodeURIComponent(url), {
        signal: AbortSignal.timeout(15000),
      });
      if (res.ok) {
        return await res.text();
      }
    } catch {
      continue;
    }
  }
  throw new Error('全てのプロキシで取得に失敗しました');
}

/**
 * トクバイから特売情報をスクレイピング
 */
export async function scrapeTokubai(postalCode: string): Promise<ScrapeResult> {
  const cleaned = postalCode.replace(/[-ー]/g, '');
  const result: ScrapeResult = {
    stores: [],
    scrapedAt: new Date().toISOString(),
    source: 'tokubai',
  };

  try {
    // トクバイの郵便番号検索ページを取得
    const searchUrl = `https://tokubai.co.jp/search/result?keyword=&zip_code=${cleaned}`;
    const html = await fetchWithProxy(searchUrl);

    // 店舗リンクを抽出
    const storeLinks = extractStoreLinks(html);

    if (storeLinks.length === 0) {
      result.error = '近隣の店舗が見つかりませんでした';
      return result;
    }

    // 上位5店舗の特売情報を取得（並列）
    const storePromises = storeLinks.slice(0, 5).map(async (link) => {
      try {
        const storeHtml = await fetchWithProxy(link.url);
        const products = extractProducts(storeHtml, link.name, link.area);
        return { name: link.name, area: link.area, products };
      } catch {
        return { name: link.name, area: link.area, products: [] };
      }
    });

    result.stores = await Promise.all(storePromises);
  } catch (e) {
    result.error = e instanceof Error ? e.message : 'スクレイピングに失敗しました';
  }

  return result;
}

function extractStoreLinks(html: string): { name: string; url: string; area: string }[] {
  const links: { name: string; url: string; area: string }[] = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // トクバイの店舗リスト要素を探す
  const storeElements = doc.querySelectorAll('a[href*="/shop/"]');

  storeElements.forEach((el) => {
    const href = el.getAttribute('href');
    const name = el.textContent?.trim();
    if (href && name && name.length > 0 && name.length < 50) {
      const fullUrl = href.startsWith('http') ? href : `https://tokubai.co.jp${href}`;
      // 重複排除
      if (!links.some(l => l.url === fullUrl)) {
        links.push({
          name: name.replace(/\s+/g, ' ').trim(),
          url: fullUrl,
          area: '',
        });
      }
    }
  });

  return links;
}

function extractProducts(html: string, storeName: string, storeArea: string): ScrapedProduct[] {
  const products: ScrapedProduct[] = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // 有効期限（デフォルト: 3日後）
  const validUntil = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];

  // 商品情報の抽出パターン
  // トクバイでは商品名と価格がセットで表示される

  // パターン1: 構造化されたproductリスト
  const productElements = doc.querySelectorAll('[class*="product"], [class*="item"], [class*="chirashi"]');
  productElements.forEach((el) => {
    const nameEl = el.querySelector('[class*="name"], [class*="title"], h3, h4');
    const priceEl = el.querySelector('[class*="price"], [class*="value"]');
    if (nameEl && priceEl) {
      const name = nameEl.textContent?.trim() || '';
      const priceText = priceEl.textContent?.trim() || '';
      const price = extractPrice(priceText);
      if (name && price > 0 && name.length < 30) {
        products.push({
          name: cleanProductName(name),
          price,
          unit: guessUnit(name),
          storeName,
          storeArea,
          validUntil,
        });
      }
    }
  });

  // パターン2: テキストから価格パターンを抽出
  if (products.length === 0) {
    const text = doc.body?.textContent || '';
    const pricePattern = /([ぁ-んァ-ヶー一-龠々a-zA-Z\s]{2,15})\s*[¥￥]?\s*(\d{2,4})\s*円/g;
    let match;
    while ((match = pricePattern.exec(text)) !== null) {
      const name = cleanProductName(match[1].trim());
      const price = parseInt(match[2]);
      if (name.length >= 2 && price >= 10 && price <= 9999) {
        if (!products.some(p => p.name === name)) {
          products.push({
            name,
            price,
            unit: guessUnit(name),
            storeName,
            storeArea,
            validUntil,
          });
        }
      }
    }

    // パターン3: 「商品名 数字円」のパターン
    const pattern2 = /([ぁ-んァ-ヶー一-龠々]{2,10})\s+(\d{2,4})円/g;
    while ((match = pattern2.exec(text)) !== null) {
      const name = cleanProductName(match[1].trim());
      const price = parseInt(match[2]);
      if (name.length >= 2 && price >= 10 && price <= 9999) {
        if (!products.some(p => p.name === name)) {
          products.push({
            name,
            price,
            unit: guessUnit(name),
            storeName,
            storeArea,
            validUntil,
          });
        }
      }
    }
  }

  return products;
}

function extractPrice(text: string): number {
  // 「98円」「¥198」「１９８」などから数値を抽出
  const cleaned = text
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
    .replace(/[,、]/g, '');
  const match = cleaned.match(/(\d{2,5})/);
  return match ? parseInt(match[1]) : 0;
}

function cleanProductName(name: string): string {
  return name
    .replace(/\s+/g, '')
    .replace(/[(（].*?[)）]/g, '')
    .replace(/【.*?】/g, '')
    .replace(/税[込抜]?/g, '')
    .trim();
}

function guessUnit(name: string): string {
  if (/100g|グラム/.test(name)) return '100g';
  if (/パック|pk/i.test(name)) return 'パック';
  if (/本/.test(name)) return '本';
  if (/個|玉/.test(name)) return '個';
  if (/袋/.test(name)) return '袋';
  if (/切|切れ/.test(name)) return '切れ';
  if (/束/.test(name)) return '束';
  return '個';
}

/**
 * Shufoo!からチラシ情報をスクレイピング
 */
export async function scrapeShufoo(postalCode: string): Promise<ScrapeResult> {
  const cleaned = postalCode.replace(/[-ー]/g, '');
  const result: ScrapeResult = {
    stores: [],
    scrapedAt: new Date().toISOString(),
    source: 'shufoo',
  };

  try {
    const searchUrl = `https://www.shufoo.net/pntweb/shopDetail/prefectureSearchList/?zipCode=${cleaned}`;
    const html = await fetchWithProxy(searchUrl);
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // 店舗情報とチラシリンクを抽出
    const shopElements = doc.querySelectorAll('[class*="shop"], [class*="store"], a[href*="chirashi"]');
    const storeNames = new Set<string>();

    shopElements.forEach((el) => {
      const name = el.textContent?.trim();
      if (name && name.length > 1 && name.length < 40) {
        storeNames.add(name.replace(/\s+/g, ' ').trim());
      }
    });

    // Shufooはチラシ画像ベースなので商品価格の構造化データは限定的
    // 取得できた店舗名だけ返す
    storeNames.forEach((name) => {
      result.stores.push({ name, area: '', products: [] });
    });

    if (result.stores.length === 0) {
      result.error = 'チラシ情報を取得できませんでした';
    }
  } catch (e) {
    result.error = e instanceof Error ? e.message : 'スクレイピングに失敗しました';
  }

  return result;
}

/**
 * 複数ソースからまとめてスクレイピング
 */
export async function scrapeAllFlyers(postalCode: string): Promise<ScrapeResult> {
  const [tokubaiResult, shufooResult] = await Promise.allSettled([
    scrapeTokubai(postalCode),
    scrapeShufoo(postalCode),
  ]);

  const combined: ScrapeResult = {
    stores: [],
    scrapedAt: new Date().toISOString(),
    source: 'combined',
  };

  if (tokubaiResult.status === 'fulfilled') {
    combined.stores.push(...tokubaiResult.value.stores);
  }
  if (shufooResult.status === 'fulfilled') {
    combined.stores.push(...shufooResult.value.stores);
  }

  if (combined.stores.length === 0) {
    combined.error = 'チラシ情報を取得できませんでした。しばらくしてからお試しください。';
  }

  return combined;
}
