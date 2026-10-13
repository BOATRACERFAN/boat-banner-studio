import type { Project, Racer, TextLayer, DecorationLayer, Taste } from '../types';
import { backgrounds } from './backgrounds';
import { palettes } from './palettes';
import { effects } from './effects';
import { decorations } from './decorations';
export const uid = () => crypto.randomUUID();
export const initialRacer: Racer = {
  name: '松田真実',
  reading: 'まつだ まみ',
  number: '5272',
  branch: '愛知',
  cheer: 'まみちゃんファイト！',
};
export interface Template {
  id: string;
  name: string;
  taste: Taste;
  bg: number;
  palette: number;
  font: string;
  effect: number;
  layout: number;
  decoration: string;
}
const specs: [string, Taste, number, number, string, number, string][] = [
  ['王道の赤金', 'かっこいい', 12, 0, 'Dela Gothic One', 2, 'deco-8-0'],
  ['スイートエール', 'かわいい', 15, 3, 'Mochiy Pop One', 14, 'deco-3-3'],
  ['全速前進', 'かっこいい', 0, 1, 'Dela Gothic One', 16, 'deco-0-3'],
  ['白金の輝き', '上品', 30, 5, 'Shippori Mincho', 1, 'deco-8-4'],
  ['荒波の向こう', '和風', 9, 30, 'Yuji Syuku', 0, 'deco-0-6'],
  ['ネオンピンク', '派手', 26, 2, 'Rampart One', 4, 'deco-2-1'],
  ['青空のエール', 'かわいい', 35, 9, 'Zen Maru Gothic', 0, 'deco-2-0'],
  ['ターンの瞬間', 'かっこいい', 2, 7, 'RocknRoll One', 8, 'deco-6-2'],
  ['桜に願いを', 'かわいい', 20, 8, 'Kaisei Decol', 10, 'deco-4-0'],
  ['勝利の月桂冠', '上品', 54, 6, 'Noto Serif JP', 2, 'deco-8-4'],
  ['墨の決意', '和風', 5, 31, 'Yuji Boku', 13, 'deco-5-4'],
  ['金箔の祝福', '和風', 6, 20, 'Zen Antique', 2, 'deco-4-6'],
  ['和紙の風', '和風', 7, 32, 'New Tegomin', 0, 'deco-5-8'],
  ['青海の誓い', '和風', 8, 30, 'Zen Old Mincho', 15, 'deco-0-0'],
  ['ファイヤースピリット', '派手', 10, 17, 'Reggae One', 6, 'deco-1-2'],
  ['スパークスター', '派手', 11, 14, 'Dela Gothic One', 14, 'deco-1-4'],
  ['ゴールデンボルト', 'かっこいい', 14, 4, 'RocknRoll One', 2, 'deco-1-0'],
  ['リボンの贈り物', 'かわいい', 16, 25, 'M PLUS Rounded 1c', 14, 'deco-3-5'],
  ['キャンディスター', 'かわいい', 17, 27, 'Mochiy Pop P One', 9, 'deco-2-4'],
  ['バブルパーティー', 'かわいい', 18, 11, 'Hachi Maru Pop', 5, 'deco-0-5'],
  ['ローズエレガンス', '上品', 22, 26, 'Kaisei Opti', 10, 'deco-4-2'],
  ['紫陽花だより', 'かわいい', 23, 15, 'Kiwi Maru', 0, 'deco-4-3'],
  ['サイバーアクセル', 'かっこいい', 25, 29, 'DotGothic16', 5, 'deco-6-1'],
  ['レーザーライン', '派手', 28, 28, 'Rampart One', 4, 'deco-6-6'],
  ['銀の航跡', '上品', 31, 23, 'BIZ UDPMincho', 3, 'deco-8-8'],
  ['シャンパントースト', '上品', 33, 21, 'Zen Antique Soft', 2, 'deco-2-3'],
  ['夕映えの海', '上品', 38, 13, 'Sawarabi Mincho', 7, 'deco-4-5'],
  ['コミックエール', '派手', 46, 24, 'Yusei Magic', 14, 'deco-9-1'],
  ['氷のスプリント', 'かっこいい', 51, 11, 'Noto Sans JP', 3, 'deco-2-6'],
  ['オーロラの夢', '派手', 56, 41, 'Stick', 11, 'deco-2-9'],
];
export const templates: Template[] = specs.map(
  ([name, taste, bg, palette, font, effect, decoration], i) => ({
    id: `template-${i}`,
    name,
    taste,
    bg,
    palette,
    font,
    effect,
    layout: i % 5,
    decoration,
  }),
);
function text(
  binding: keyof Racer,
  racer: Racer,
  x: number,
  y: number,
  width: number,
  size: number,
  font: string,
  style: TextLayer['style'],
  align: TextLayer['align'] = 'left',
): TextLayer {
  return {
    id: uid(),
    type: 'text',
    name: {
      name: '選手名',
      reading: 'ふりがな',
      number: '登録番号',
      branch: '支部',
      cheer: '応援メッセージ',
    }[binding],
    binding,
    text: racer[binding],
    x,
    y,
    width,
    height: size * 1.4,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    flipped: false,
    fontFamily: font,
    fontSize: size,
    style: { ...style },
    align,
  };
}
function deco(
  assetId: string,
  x: number,
  y: number,
  size: number,
  color: string,
  rotation = 0,
): DecorationLayer {
  return {
    id: uid(),
    type: 'decoration',
    name: decorations.find((d) => d.id === assetId)?.name || '装飾',
    assetId,
    x,
    y,
    width: size,
    height: size,
    scaleX: 1,
    scaleY: 1,
    rotation,
    opacity: 0.9,
    visible: true,
    locked: false,
    flipped: false,
    color,
  };
}
export function createTemplate(t: Template, racer: Racer = initialRacer): Project {
  const bg = backgrounds[t.bg],
    p = palettes[t.palette].colors,
    style = { ...effects[t.effect].style, fill: p[2] },
    small = {
      ...effects[0].style,
      fill: p[2],
      stroke: p[0],
      strokeWidth: 1,
      shadowDistance: 1,
      letterSpacing: 2,
    };
  const layouts = [
    { x: 195, y: 43, w: 610, align: 'center' as const, rx: 205, ry: 16, cx: 180, cy: 134, cw: 640 },
    { x: 155, y: 40, w: 610, align: 'left' as const, rx: 160, ry: 14, cx: 162, cy: 137, cw: 635 },
    { x: 220, y: 40, w: 620, align: 'center' as const, rx: 220, ry: 12, cx: 210, cy: 135, cw: 630 },
    { x: 78, y: 38, w: 640, align: 'left' as const, rx: 85, ry: 12, cx: 80, cy: 134, cw: 640 },
    { x: 185, y: 35, w: 590, align: 'center' as const, rx: 185, ry: 8, cx: 185, cy: 132, cw: 590 },
  ];
  const l = layouts[t.layout],
    size = Math.min(70, (l.w - 50) / Math.max(4, Array.from(racer.name).length));
  const decorations = [
    deco(t.decoration, t.layout === 3 ? 740 : 30, 25, 140, p[1], t.layout === 1 ? -8 : 0),
    deco(t.decoration, t.layout === 3 ? 842 : 805, 42, 110, p[1], t.layout === 1 ? 12 : 0),
  ];
  if (t.layout === 4)
    decorations.push(deco('deco-7-0', 10, 7, 170, p[1]), {
      ...deco('deco-6-0', 335, 152, 70, p[1]),
      width: 280,
      height: 24,
      opacity: 0.4,
    });
  const main = text('name', racer, l.x, l.y, l.w, size, t.font, style, l.align);
  return {
    schemaVersion: 1,
    id: uid(),
    name: `${racer.name}の横断幕`,
    racer: { ...racer },
    background: {
      presetId: bg.id,
      color: p[0],
      accent: p[1],
      brightness: 1,
      density: 1,
      direction: 15,
      flipped: false,
      transparent: false,
      imageX: 0,
      imageY: 0,
      imageScale: 1,
      imageOpacity: 1,
    },
    layers: [
      ...decorations,
      text('reading', racer, l.rx, l.ry, l.w, 15, 'Noto Sans JP', small, l.align),
      main,
      text('cheer', racer, l.cx, l.cy, l.cw, 26, 'Noto Sans JP', small, l.align),
      text('number', racer, t.layout === 3 ? 746 : 30, 158, 85, 19, 'Noto Sans JP', small),
      text('branch', racer, t.layout === 3 ? 850 : 122, 160, 75, 15, 'Noto Sans JP', small),
    ],
    customFonts: [],
    updatedAt: new Date().toISOString(),
  };
}
export function randomProject(taste: Taste, racer: Racer): Project {
  const candidates = templates.filter((t) => taste === 'おまかせ' || t.taste === taste),
    t = candidates[Math.floor(Math.random() * candidates.length)];
  const project = createTemplate(t, racer);
  const category = backgrounds[t.bg].category,
    options = backgrounds.filter((b) => b.category === category);
  project.background.presetId = options[Math.floor(Math.random() * options.length)].id;
  // Layout and text effect stay within the tested composition; accent art varies within its category.
  project.layers = project.layers.map((l) =>
    l.type === 'decoration'
      ? { ...l, assetId: l.assetId.replace(/-\d+$/, `-${Math.floor(Math.random() * 10)}`) }
      : l,
  );
  return project;
}
