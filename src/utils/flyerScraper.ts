/**
 * チラシ情報取得ユーティリティ
 *
 * トクバイ・Shufoo! はJavaScript描画のSPAのため、
 * CORSプロキシ経由のHTMLスクレイピングでは商品データを取得できない。
 * そのため直接リンクへの誘導と手動入力を中心にする。
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
  directLinks?: { name: string; url: string }[];
}

/**
 * 特売情報取得を試みる
 * SPAサイトはスクレイピング不可のため、直接リンクを返す
 */
export async function scrapeAllFlyers(postalCode: string): Promise<ScrapeResult> {
  const cleaned = postalCode.replace(/[-ー]/g, '');

  const result: ScrapeResult = {
    stores: [],
    scrapedAt: new Date().toISOString(),
    source: 'combined',
    directLinks: [
      {
        name: 'トクバイで確認',
        url: `https://tokubai.co.jp/?postal_code=${cleaned}`,
      },
      {
        name: 'Shufoo!で確認',
        url: `https://www.shufoo.net/pntweb/shopDetail/prefectureSearchList/?zipCode=${cleaned}`,
      },
    ],
    error: 'トクバイ・Shufoo!はJavaScript描画のため自動取得できません。上記リンクからサイトを確認し、「特売入力」タブから手動で価格を登録してください。',
  };

  return result;
}
