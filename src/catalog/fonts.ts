export interface FontMeta {
  family: string;
  category: string;
  weight: number;
  source: string;
  license: string;
}
export const fontCategories = [
  '太字ゴシック',
  '丸ゴシック',
  '明朝',
  '筆文字・和風',
  'ポップ・手書き',
  'レトロ',
  'デザイン',
  '英字レーシング',
];
const groups: [string, string[], number][] = [
  [
    '太字ゴシック',
    ['Noto Sans JP', 'M PLUS 1p', 'Zen Kaku Gothic New', 'BIZ UDPGothic', 'Sawarabi Gothic'],
    700,
  ],
  ['丸ゴシック', ['M PLUS Rounded 1c', 'Zen Maru Gothic', 'Kiwi Maru'], 500],
  [
    '明朝',
    [
      'Noto Serif JP',
      'BIZ UDPMincho',
      'Kaisei Decol',
      'Kaisei Opti',
      'Zen Old Mincho',
      'Shippori Mincho',
      'Sawarabi Mincho',
    ],
    400,
  ],
  ['筆文字・和風', ['Yuji Boku', 'Yuji Syuku', 'New Tegomin'], 400],
  ['ポップ・手書き', ['Yusei Magic', 'Hachi Maru Pop', 'Mochiy Pop One', 'Mochiy Pop P One'], 400],
  ['レトロ', ['DotGothic16', 'Zen Antique', 'Zen Antique Soft'], 400],
  ['デザイン', ['Dela Gothic One', 'RocknRoll One', 'Rampart One', 'Reggae One', 'Stick'], 400],
  ['英字レーシング', ['Bebas Neue', 'Orbitron'], 400],
];
export const fonts: FontMeta[] = groups.flatMap(([category, families, weight]) =>
  families.map((family) => ({
    family,
    category,
    weight: family === 'Sawarabi Gothic' ? 400 : weight,
    source: `https://github.com/google/fonts/tree/main/ofl/${family === 'M PLUS Rounded 1c' ? 'roundedmplus1c' : family.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
    license: 'SIL Open Font License 1.1',
  })),
);
