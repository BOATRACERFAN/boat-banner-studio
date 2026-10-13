import { describe, it, expect } from 'vitest';
import { backgrounds, backgroundCategories } from '../catalog/backgrounds';
import { decorations, decorationCategories } from '../catalog/decorations';
import { fonts } from '../catalog/fonts';
import { palettes } from '../catalog/palettes';
import { templates, createTemplate, initialRacer, randomProject } from '../catalog/templates';
import { effects } from '../catalog/effects';
import { backgroundSvg, decorationSvg } from './artwork';
import { parseProject } from '../lib/project';
describe('実素材カタログ', () => {
  it('背景60点は構図が異なり、カテゴリごとに5点ある', () => {
    expect(backgrounds).toHaveLength(60);
    for (const cat of backgroundCategories)
      expect(backgrounds.filter((b) => b.category === cat)).toHaveLength(5);
    const sample = createTemplate(templates[2]).background;
    const svgs = backgrounds.map((b) =>
      backgroundSvg({ ...sample, presetId: b.id, color: '#112233', accent: '#aabbcc' }),
    );
    expect(new Set(svgs).size).toBe(60);
    svgs.forEach((s) => expect(s).toContain('<svg'));
  });
  it('装飾100点は同一色で比較しても異なる図形である', () => {
    expect(decorations).toHaveLength(100);
    for (const cat of decorationCategories)
      expect(decorations.filter((d) => d.category === cat)).toHaveLength(10);
    const svgs = decorations.map((d) => decorationSvg(d.id, '#ffffff'));
    expect(new Set(svgs).size).toBe(100);
    svgs.forEach((s) => expect(s).toMatch(/<(path|polygon|circle|ellipse|rect)/));
  });
  it('日本語30書体、配色40以上、効果15以上を提供する', () => {
    expect(fonts.filter((f) => f.category !== '英字レーシング')).toHaveLength(30);
    expect(new Set(fonts.map((f) => f.family)).size).toBe(fonts.length);
    expect(palettes.length).toBeGreaterThanOrEqual(40);
    expect(effects.length).toBeGreaterThanOrEqual(15);
  });
  it('全30テンプレートに選手情報と編集可能な要素がある', () => {
    expect(templates).toHaveLength(30);
    for (const t of templates) {
      const p = createTemplate(t);
      expect(p.layers.filter((l) => l.type === 'text')).toHaveLength(5);
      expect(p.layers.some((l) => l.type === 'decoration')).toBe(true);
      expect(parseProject(p)).toEqual(p);
      expect(
        p.layers.filter((l) => l.type === 'text').map((l) => (l.type === 'text' ? l.text : '')),
      ).toContain(initialRacer.name);
    }
  });
  it('おまかせのすべてのテイストが有効なプロジェクトを生成する', () => {
    for (const taste of ['かっこいい', 'かわいい', '和風', '派手', '上品', 'おまかせ'] as const) {
      const racer = { ...initialRacer, name: 'テスト選手', number: '1234' };
      for (let i = 0; i < 10; i++) {
        const p = randomProject(taste, racer);
        expect(parseProject(p).racer).toEqual(racer);
        expect(p.layers.some((l) => l.type === 'text' && l.text === racer.name)).toBe(true);
      }
    }
  });
});
describe('インポート検証', () => {
  it('JSON往復で図形、スタイル、順序、グループを復元する', () => {
    const p = createTemplate(templates[9]);
    p.layers[0].groupId = 'test';
    p.layers[0].locked = true;
    p.layers[1].visible = false;
    p.background.transparent = true;
    expect(parseProject(JSON.parse(JSON.stringify(p)))).toEqual(p);
  });
  it('未知のバージョン、壊れた要素、外部画像、無限値を拒否する', () => {
    const p = createTemplate(templates[2]);
    expect(() => parseProject({ ...p, schemaVersion: 2 })).toThrow();
    expect(() => parseProject({ ...p, layers: [{ ...p.layers[0], x: NaN }] })).toThrow();
    expect(() =>
      parseProject({
        ...p,
        background: { ...p.background, image: 'https://example.com/image.png' },
      }),
    ).toThrow();
    expect(() => parseProject({ ...p, layers: [{ ...p.layers[0], color: '<script>' }] })).toThrow();
    expect(() => parseProject({ ...p, layers: [p.layers[0], p.layers[0]] })).toThrow();
  });
});
