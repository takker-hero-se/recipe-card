export interface RecipeSite {
  name: string;
  url: string;
  description: string;
  budgetSearchUrl?: string;
}

export const recipeSites: RecipeSite[] = [
  {
    name: 'クックパッド',
    url: 'https://cookpad.com',
    description: '日本最大のレシピ共有サイト。ユーザー投稿のレシピが豊富',
    budgetSearchUrl: 'https://cookpad.com/search/%E7%AF%80%E7%B4%84',
  },
  {
    name: 'クラシル',
    url: 'https://www.kurashiru.com',
    description: '動画付きレシピ。簡単で時短のレシピが多い',
    budgetSearchUrl: 'https://www.kurashiru.com/search?query=%E7%AF%80%E7%B4%84',
  },
  {
    name: 'DELISH KITCHEN',
    url: 'https://delishkitchen.tv',
    description: '動画レシピサービス。初心者にもわかりやすい',
    budgetSearchUrl: 'https://delishkitchen.tv/search?q=%E7%AF%80%E7%B4%84',
  },
  {
    name: '白ごはん.com',
    url: 'https://www.sirogohan.com',
    description: '和食中心のレシピサイト。基本の家庭料理が充実',
    budgetSearchUrl: 'https://www.sirogohan.com/recipe/category/setsuyaku/',
  },
  {
    name: 'Nadia',
    url: 'https://oceans-nadia.com',
    description: 'プロの料理家によるレシピ。節約レシピ特集あり',
    budgetSearchUrl: 'https://oceans-nadia.com/search?keyword=%E7%AF%80%E7%B4%84',
  },
  {
    name: 'E・レシピ',
    url: 'https://erecipe.woman.excite.co.jp',
    description: '管理栄養士監修のレシピ。献立提案機能あり',
    budgetSearchUrl: 'https://erecipe.woman.excite.co.jp/search/?q=%E7%AF%80%E7%B4%84',
  },
  {
    name: 'レシピブログ',
    url: 'https://www.recipe-blog.jp',
    description: '料理ブロガーのレシピ集。節約カテゴリが充実',
    budgetSearchUrl: 'https://www.recipe-blog.jp/search/recipe?keyword=%E7%AF%80%E7%B4%84',
  },
  {
    name: '味の素パーク',
    url: 'https://park.ajinomoto.co.jp',
    description: '味の素公式レシピサイト。定番家庭料理が豊富',
    budgetSearchUrl: 'https://park.ajinomoto.co.jp/recipe/search/?search_word=%E7%AF%80%E7%B4%84',
  },
];
