import type { DefaultPrice } from '../types';

export const ingredientPrices: DefaultPrice[] = [
  // ===== 肉類 =====
  { ingredientName: '鶏もも肉', price: 128, quantity: 100, unit: 'g', category: '肉類', shelfLifeDays: 3, source: 'estimate' },
  { ingredientName: '鶏むね肉', price: 68, quantity: 100, unit: 'g', category: '肉類', shelfLifeDays: 3, source: 'estimate' },
  { ingredientName: '鶏ひき肉', price: 98, quantity: 100, unit: 'g', category: '肉類', shelfLifeDays: 2, source: 'estimate' },
  { ingredientName: '豚バラ肉', price: 198, quantity: 100, unit: 'g', category: '肉類', shelfLifeDays: 3, source: 'estimate' },
  { ingredientName: '豚こま切れ肉', price: 128, quantity: 100, unit: 'g', category: '肉類', shelfLifeDays: 3, source: 'estimate' },
  { ingredientName: '豚ひき肉', price: 118, quantity: 100, unit: 'g', category: '肉類', shelfLifeDays: 2, source: 'estimate' },
  { ingredientName: '合いびき肉', price: 148, quantity: 100, unit: 'g', category: '肉類', shelfLifeDays: 2, source: 'estimate' },
  { ingredientName: '牛こま切れ肉', price: 258, quantity: 100, unit: 'g', category: '肉類', shelfLifeDays: 3, source: 'estimate' },
  { ingredientName: 'ウインナー', price: 298, quantity: 1, unit: '袋', category: '肉類', shelfLifeDays: 14, source: 'estimate' },
  { ingredientName: 'ベーコン', price: 198, quantity: 1, unit: 'パック', category: '肉類', shelfLifeDays: 14, source: 'estimate' },
  { ingredientName: 'ハム', price: 198, quantity: 1, unit: 'パック', category: '肉類', shelfLifeDays: 14, source: 'estimate' },

  // ===== 魚介類 =====
  { ingredientName: '鮭切り身', price: 298, quantity: 2, unit: '切れ', category: '魚介類', shelfLifeDays: 2, source: 'estimate' },
  { ingredientName: 'サバ切り身', price: 248, quantity: 2, unit: '切れ', category: '魚介類', shelfLifeDays: 2, source: 'estimate' },
  { ingredientName: 'ツナ缶', price: 128, quantity: 1, unit: '缶', category: '魚介類', shelfLifeDays: 730, source: 'estimate' },
  { ingredientName: 'しらす', price: 198, quantity: 1, unit: 'パック', category: '魚介類', shelfLifeDays: 3, source: 'estimate' },
  { ingredientName: 'ちくわ', price: 98, quantity: 1, unit: '袋', category: '魚介類', shelfLifeDays: 7, source: 'estimate' },
  { ingredientName: 'かにかま', price: 98, quantity: 1, unit: 'パック', category: '魚介類', shelfLifeDays: 7, source: 'estimate' },

  // ===== 野菜 =====
  { ingredientName: 'にんじん', price: 40, quantity: 1, unit: '本', category: '野菜', shelfLifeDays: 14, source: 'estimate' },
  { ingredientName: 'たまねぎ', price: 40, quantity: 1, unit: '個', category: '野菜', shelfLifeDays: 30, source: 'estimate' },
  { ingredientName: 'じゃがいも', price: 40, quantity: 1, unit: '個', category: '野菜', shelfLifeDays: 21, source: 'estimate' },
  { ingredientName: 'キャベツ', price: 198, quantity: 1, unit: '玉', category: '野菜', shelfLifeDays: 10, source: 'estimate' },
  { ingredientName: 'もやし', price: 30, quantity: 1, unit: '袋', category: '野菜', shelfLifeDays: 3, source: 'estimate' },
  { ingredientName: '大根', price: 158, quantity: 1, unit: '本', category: '野菜', shelfLifeDays: 10, source: 'estimate' },
  { ingredientName: 'ほうれん草', price: 178, quantity: 1, unit: '束', category: '野菜', shelfLifeDays: 4, source: 'estimate' },
  { ingredientName: '小松菜', price: 148, quantity: 1, unit: '束', category: '野菜', shelfLifeDays: 4, source: 'estimate' },
  { ingredientName: 'ピーマン', price: 40, quantity: 1, unit: '個', category: '野菜', shelfLifeDays: 7, source: 'estimate' },
  { ingredientName: 'なす', price: 50, quantity: 1, unit: '本', category: '野菜', shelfLifeDays: 5, source: 'estimate' },
  { ingredientName: 'トマト', price: 80, quantity: 1, unit: '個', category: '野菜', shelfLifeDays: 7, source: 'estimate' },
  { ingredientName: 'きゅうり', price: 50, quantity: 1, unit: '本', category: '野菜', shelfLifeDays: 5, source: 'estimate' },
  { ingredientName: 'レタス', price: 198, quantity: 1, unit: '玉', category: '野菜', shelfLifeDays: 5, source: 'estimate' },
  { ingredientName: '白菜', price: 198, quantity: 1, unit: '玉', category: '野菜', shelfLifeDays: 10, source: 'estimate' },
  { ingredientName: 'ねぎ', price: 98, quantity: 1, unit: '本', category: '野菜', shelfLifeDays: 7, source: 'estimate' },
  { ingredientName: 'にら', price: 98, quantity: 1, unit: '束', category: '野菜', shelfLifeDays: 4, source: 'estimate' },
  { ingredientName: 'しめじ', price: 98, quantity: 1, unit: 'パック', category: '野菜', shelfLifeDays: 5, source: 'estimate' },
  { ingredientName: 'えのき', price: 88, quantity: 1, unit: '袋', category: '野菜', shelfLifeDays: 5, source: 'estimate' },
  { ingredientName: 'にんにく', price: 30, quantity: 1, unit: '片', category: '野菜', shelfLifeDays: 30, source: 'estimate' },
  { ingredientName: 'しょうが', price: 50, quantity: 1, unit: '片', category: '野菜', shelfLifeDays: 14, source: 'estimate' },
  { ingredientName: '長ねぎ', price: 128, quantity: 1, unit: '本', category: '野菜', shelfLifeDays: 7, source: 'estimate' },
  { ingredientName: 'ごぼう', price: 148, quantity: 1, unit: '本', category: '野菜', shelfLifeDays: 7, source: 'estimate' },
  { ingredientName: 'れんこん', price: 198, quantity: 1, unit: '個', category: '野菜', shelfLifeDays: 7, source: 'estimate' },
  { ingredientName: 'かぼちゃ', price: 298, quantity: 1, unit: '個', category: '野菜', shelfLifeDays: 14, source: 'estimate' },
  { ingredientName: 'さつまいも', price: 148, quantity: 1, unit: '本', category: '野菜', shelfLifeDays: 21, source: 'estimate' },

  // ===== 乳製品・卵 =====
  { ingredientName: '卵', price: 248, quantity: 10, unit: '個', category: '乳製品・卵', shelfLifeDays: 14, source: 'estimate' },
  { ingredientName: '牛乳', price: 218, quantity: 1000, unit: 'ml', category: '乳製品・卵', shelfLifeDays: 7, source: 'estimate' },
  { ingredientName: 'バター', price: 398, quantity: 200, unit: 'g', category: '乳製品・卵', shelfLifeDays: 60, source: 'estimate' },
  { ingredientName: 'スライスチーズ', price: 198, quantity: 1, unit: 'パック', category: '乳製品・卵', shelfLifeDays: 30, source: 'estimate' },
  { ingredientName: 'ピザ用チーズ', price: 298, quantity: 1, unit: '袋', category: '乳製品・卵', shelfLifeDays: 30, source: 'estimate' },
  { ingredientName: 'ヨーグルト', price: 148, quantity: 1, unit: 'パック', category: '乳製品・卵', shelfLifeDays: 14, source: 'estimate' },

  // ===== 豆腐・大豆製品 =====
  { ingredientName: '豆腐', price: 48, quantity: 1, unit: '丁', category: '豆腐・大豆製品', shelfLifeDays: 5, source: 'estimate' },
  { ingredientName: '油揚げ', price: 78, quantity: 1, unit: '袋', category: '豆腐・大豆製品', shelfLifeDays: 5, source: 'estimate' },
  { ingredientName: '納豆', price: 88, quantity: 1, unit: 'パック', category: '豆腐・大豆製品', shelfLifeDays: 7, source: 'estimate' },
  { ingredientName: '厚揚げ', price: 98, quantity: 1, unit: 'パック', category: '豆腐・大豆製品', shelfLifeDays: 5, source: 'estimate' },

  // ===== 穀物 =====
  { ingredientName: '米', price: 490, quantity: 1000, unit: 'g', category: '穀物', shelfLifeDays: 60, source: 'estimate' },
  { ingredientName: 'パスタ', price: 198, quantity: 500, unit: 'g', category: '穀物', shelfLifeDays: 365, source: 'estimate' },
  { ingredientName: 'うどん', price: 30, quantity: 1, unit: '玉', category: '穀物', shelfLifeDays: 3, source: 'estimate' },
  { ingredientName: 'そば', price: 30, quantity: 1, unit: '玉', category: '穀物', shelfLifeDays: 3, source: 'estimate' },
  { ingredientName: '食パン', price: 148, quantity: 1, unit: '袋', category: '穀物', shelfLifeDays: 4, source: 'estimate' },
  { ingredientName: '小麦粉', price: 178, quantity: 1000, unit: 'g', category: '穀物', shelfLifeDays: 365, source: 'estimate' },
  { ingredientName: '片栗粉', price: 148, quantity: 200, unit: 'g', category: '穀物', shelfLifeDays: 365, source: 'estimate' },
  { ingredientName: 'パン粉', price: 128, quantity: 200, unit: 'g', category: '穀物', shelfLifeDays: 180, source: 'estimate' },

  // ===== 調味料 =====
  { ingredientName: '醤油', price: 298, quantity: 1000, unit: 'ml', category: '調味料', shelfLifeDays: 365, source: 'estimate' },
  { ingredientName: 'みりん', price: 298, quantity: 500, unit: 'ml', category: '調味料', shelfLifeDays: 365, source: 'estimate' },
  { ingredientName: '料理酒', price: 198, quantity: 500, unit: 'ml', category: '調味料', shelfLifeDays: 365, source: 'estimate' },
  { ingredientName: '味噌', price: 298, quantity: 750, unit: 'g', category: '調味料', shelfLifeDays: 180, source: 'estimate' },
  { ingredientName: '砂糖', price: 198, quantity: 1000, unit: 'g', category: '調味料', shelfLifeDays: 730, source: 'estimate' },
  { ingredientName: '塩', price: 98, quantity: 1000, unit: 'g', category: '調味料', shelfLifeDays: 730, source: 'estimate' },
  { ingredientName: 'サラダ油', price: 298, quantity: 1000, unit: 'ml', category: '調味料', shelfLifeDays: 365, source: 'estimate' },
  { ingredientName: 'ごま油', price: 298, quantity: 200, unit: 'ml', category: '調味料', shelfLifeDays: 365, source: 'estimate' },
  { ingredientName: 'オリーブオイル', price: 498, quantity: 400, unit: 'ml', category: '調味料', shelfLifeDays: 365, source: 'estimate' },
  { ingredientName: '酢', price: 198, quantity: 500, unit: 'ml', category: '調味料', shelfLifeDays: 365, source: 'estimate' },
  { ingredientName: 'めんつゆ', price: 298, quantity: 500, unit: 'ml', category: '調味料', shelfLifeDays: 180, source: 'estimate' },
  { ingredientName: 'ケチャップ', price: 198, quantity: 500, unit: 'g', category: '調味料', shelfLifeDays: 365, source: 'estimate' },
  { ingredientName: 'マヨネーズ', price: 198, quantity: 400, unit: 'g', category: '調味料', shelfLifeDays: 180, source: 'estimate' },
  { ingredientName: 'ソース', price: 198, quantity: 500, unit: 'ml', category: '調味料', shelfLifeDays: 365, source: 'estimate' },
  { ingredientName: 'ポン酢', price: 248, quantity: 360, unit: 'ml', category: '調味料', shelfLifeDays: 180, source: 'estimate' },
  { ingredientName: '鶏ガラスープの素', price: 198, quantity: 50, unit: 'g', category: '調味料', shelfLifeDays: 365, source: 'estimate' },
  { ingredientName: 'コンソメ', price: 248, quantity: 1, unit: '袋', category: '調味料', shelfLifeDays: 365, source: 'estimate' },
  { ingredientName: 'カレールー', price: 198, quantity: 1, unit: '袋', category: '調味料', shelfLifeDays: 365, source: 'estimate' },
  { ingredientName: 'こしょう', price: 148, quantity: 20, unit: 'g', category: '調味料', shelfLifeDays: 365, source: 'estimate' },
  { ingredientName: '味の素', price: 198, quantity: 70, unit: 'g', category: '調味料', shelfLifeDays: 365, source: 'estimate' },

  // ===== 乾物 =====
  { ingredientName: 'わかめ（乾燥）', price: 198, quantity: 1, unit: '袋', category: '乾物', shelfLifeDays: 365, source: 'estimate' },
  { ingredientName: '春雨', price: 98, quantity: 1, unit: '袋', category: '乾物', shelfLifeDays: 365, source: 'estimate' },
  { ingredientName: 'ひじき', price: 148, quantity: 1, unit: '袋', category: '乾物', shelfLifeDays: 365, source: 'estimate' },
  { ingredientName: 'かつお節', price: 198, quantity: 1, unit: '袋', category: '乾物', shelfLifeDays: 180, source: 'estimate' },
  { ingredientName: 'のり', price: 198, quantity: 1, unit: '袋', category: '乾物', shelfLifeDays: 365, source: 'estimate' },

  // ===== その他 =====
  { ingredientName: 'こんにゃく', price: 88, quantity: 1, unit: '袋', category: 'その他', shelfLifeDays: 30, source: 'estimate' },
  { ingredientName: 'トマト缶', price: 128, quantity: 1, unit: '缶', category: 'その他', shelfLifeDays: 730, source: 'estimate' },
  { ingredientName: 'カレー粉', price: 298, quantity: 1, unit: '缶', category: '調味料', shelfLifeDays: 365, source: 'estimate' },
];
