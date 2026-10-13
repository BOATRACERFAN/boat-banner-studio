import type { Project } from '../types';
import Konva from 'konva';
import { fontWeight } from './fonts';
function luminance(hex: string) {
  const c = hex
    .slice(1)
    .match(/../g)!
    .map((a) => parseInt(a, 16) / 255)
    .map((a) => (a <= 0.04045 ? a / 12.92 : ((a + 0.055) / 1.055) ** 2.4));
  return c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722;
}
export function inspectDesign(p: Project, stage: Konva.Stage | null): string[] {
  const warnings: string[] = [],
    ctx = document.createElement('canvas').getContext('2d')!;
  for (const l of p.layers) {
    if (!l.visible) continue;
    const n = stage?.findOne(`#${l.id}`);
    if (n) {
      const r = n.getClientRect({ relativeTo: stage! });
      if (r.x < 0 || r.y < 0 || r.x + r.width > 960.5 || r.y + r.height > 192.5)
        warnings.push(`「${l.name}」が画像の外に出ています。`);
    }
    if (l.type === 'text') {
      ctx.font = `${l.style.italic ? 'italic ' : ''}${fontWeight(l.fontFamily)} ${l.fontSize}px "${l.fontFamily}"`;
      const lines = l.text.split('\n'),
        padding = Math.max(l.style.outerWidth + l.style.strokeWidth, 2) * 2;
      const width = Math.max(
        ...lines.map(
          (s) =>
            ctx.measureText(s).width +
            Math.max(0, Array.from(s).length - 1) * l.style.letterSpacing,
        ),
      );
      if (
        width + padding > l.width ||
        lines.length * l.fontSize * l.style.lineHeight + padding > l.height
      )
        warnings.push(
          `「${l.name}」の文字がテキスト枠に収まりません。幅・高さ・文字サイズを調整してください。`,
        );
      const a = luminance(l.style.fill),
        b = luminance(p.background.color),
        ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      if (
        !p.background.transparent &&
        !p.background.image &&
        ratio < 1.8 &&
        l.style.strokeWidth < 1 &&
        l.style.outerWidth < 1
      )
        warnings.push(`「${l.name}」の文字と背景の色が近く、読みにくい可能性があります。`);
    }
  }
  return warnings;
}
