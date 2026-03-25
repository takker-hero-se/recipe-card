import { postalCodeToPrefecture } from '../data/postalCodePrefectures';

const prefectureToShufooId: Record<string, string> = {
  '北海道': 'hokkaido', '青森県': 'aomori', '岩手県': 'iwate', '宮城県': 'miyagi',
  '秋田県': 'akita', '山形県': 'yamagata', '福島県': 'fukushima', '茨城県': 'ibaraki',
  '栃木県': 'tochigi', '群馬県': 'gunma', '埼玉県': 'saitama', '千葉県': 'chiba',
  '東京都': 'tokyo', '神奈川県': 'kanagawa', '新潟県': 'niigata', '富山県': 'toyama',
  '石川県': 'ishikawa', '福井県': 'fukui', '山梨県': 'yamanashi', '長野県': 'nagano',
  '岐阜県': 'gifu', '静岡県': 'shizuoka', '愛知県': 'aichi', '三重県': 'mie',
  '滋賀県': 'shiga', '京都府': 'kyoto', '大阪府': 'osaka', '兵庫県': 'hyogo',
  '奈良県': 'nara', '和歌山県': 'wakayama', '鳥取県': 'tottori', '島根県': 'shimane',
  '岡山県': 'okayama', '広島県': 'hiroshima', '山口県': 'yamaguchi', '徳島県': 'tokushima',
  '香川県': 'kagawa', '愛媛県': 'ehime', '高知県': 'kochi', '福岡県': 'fukuoka',
  '佐賀県': 'saga', '長崎県': 'nagasaki', '熊本県': 'kumamoto', '大分県': 'oita',
  '宮崎県': 'miyazaki', '鹿児島県': 'kagoshima', '沖縄県': 'okinawa',
};

export interface FlyerLink {
  serviceName: string;
  url: string;
  description: string;
}

export function getFlyerLinks(postalCode: string): FlyerLink[] {
  const prefecture = postalCodeToPrefecture(postalCode);
  const links: FlyerLink[] = [];

  if (prefecture) {
    const shufooId = prefectureToShufooId[prefecture];
    if (shufooId) {
      links.push({
        serviceName: 'Shufoo!（シュフー）',
        url: `https://www.shufoo.net/pntweb/shopDetail/prefectureSearchList/${shufooId}/`,
        description: '全国のスーパーのチラシが閲覧可能',
      });
    }
  }

  // トクバイ: 郵便番号で近隣店舗を検索
  const cleanedCode = postalCode.replace(/[-ー]/g, '');
  links.push({
    serviceName: 'トクバイ',
    url: `https://tokubai.co.jp/?postal_code=${cleanedCode}`,
    description: 'スーパーの特売情報・チラシ検索',
  });

  return links;
}

export function getPrefectureFromPostalCode(postalCode: string): string | null {
  return postalCodeToPrefecture(postalCode);
}
