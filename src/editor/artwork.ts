import { backgrounds, backgroundCategories } from '../catalog/backgrounds';
import { decorations, decorationCategories } from '../catalog/decorations';
import type { Background } from '../types';
const path = (d: string, c: string, extra = '') => `<path d="${d}" fill="${c}" ${extra}/>`;
const line = (d: string, c: string, w = 2, extra = '') =>
  `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" ${extra}/>`;
const circle = (x: number, y: number, r: number, c: string, extra = '') =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" ${extra}/>`;
const rect = (x: number, y: number, w: number, h: number, c: string, extra = '') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}" ${extra}/>`;
const repeat = (n: number, fn: (i: number) => string) =>
  Array.from({ length: n }, (_, i) => fn(i)).join('');
function starPoints(n: number, outer: number, inner: number, cx = 50, cy = 50) {
  return Array.from({ length: n * 2 }, (_, i) => {
    const a = (i * Math.PI) / n - Math.PI / 2,
      r = i % 2 ? inner : outer;
    return `${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}`;
  }).join(' ');
}
const star = (n: number, r: number, inner: number, c: string) =>
  `<polygon points="${starPoints(n, r, inner)}" fill="${c}"/>`;
const heart = (c: string) => path('M50 85 C-15 48 10 0 36 21 L50 34 L64 21 C90 0 115 48 50 85Z', c);
const petals = (n: number, c: string) =>
  repeat(
    n,
    (i) =>
      `<ellipse cx="50" cy="27" rx="12" ry="22" fill="${c}" transform="rotate(${(i * 360) / n} 50 50)"/>`,
  ) + circle(50, 50, 9, c);
export function decorationMarkup(id: string, c: string): string {
  const asset = decorations.find((a) => a.id === id);
  if (!asset) return '';
  const cat = decorationCategories.indexOf(asset.category),
    v = asset.variant;
  let s = '';
  if (cat === 0)
    s = [
      line('M3 60 Q25 20 48 60 T97 60', c, 8),
      repeat(3, (i) =>
        line(`M5 ${30 + i * 20} Q28 ${i * 20} 50 ${30 + i * 20} T95 ${30 + i * 20}`, c, 5),
      ),
      path('M50 4 C40 25 18 46 18 65 A32 32 0 0 0 82 65 C82 46 60 25 50 4Z', c),
      path('M8 85 Q28 67 27 28 Q43 56 51 8 Q63 57 84 22 Q69 69 97 83 Q51 72 8 85Z', c),
      line('M50 50 C72 18 93 51 72 72 C37 100 5 56 28 26 C54 -8 97 22 91 58', c, 7),
      repeat(7, (i) =>
        circle(
          50 + Math.cos(i * 0.9) * 32,
          50 + Math.sin(i * 0.9) * 32,
          7 + (i % 3),
          c,
          'fill-opacity=".75"',
        ),
      ),
      path('M3 78 Q23 67 27 31 Q48 0 78 35 Q44 23 49 49 Q56 63 97 79Z', c),
      `<circle cx="50" cy="50" r="35" fill="none" stroke="${c}" stroke-width="8"/>` +
        circle(72, 22, 12, c),
      repeat(5, (i) => line(`M${i * 17 + 4} ${60 - i * 8} l12 -8 l8 8 l-12 8Z`, c, 3)),
      repeat(
        7,
        (i) =>
          `<ellipse cx="50" cy="22" rx="4" ry="19" fill="${c}" transform="rotate(${(i - 3) * 24} 50 90)"/>`,
      ),
    ][v];
  if (cat === 1)
    s = [
      path('M59 3 L18 56 H43 L32 97 L85 40 H58Z', c),
      path('M35 4 L8 50 H28 L17 90 L58 39 H38Z M76 13 L46 63 H65 L54 98 L93 48 H73Z', c),
      path(
        'M53 3 C65 34 87 45 80 72 C76 98 15 103 19 65 Q24 40 39 28 Q37 53 48 57 Q60 42 53 3Z',
        c,
      ),
      circle(56, 61, 28, c) + path('M4 4 Q43 9 64 33 L46 52Z', c),
      repeat(9, (i) => line('M50 25 L50 5', c, 3, `transform="rotate(${i * 40} 50 50)"`)) +
        circle(50, 50, 11, c),
      star(12, 47, 13, c),
      line('M8 12 L36 40 L21 56 L65 78 L51 94 L92 90', c, 9),
      path('M50 92 Q6 64 6 10 Q21 41 42 29 L50 66 L58 29 Q79 41 94 10 Q94 64 50 92Z', c),
      line('M50 10 Q90 33 85 62 Q67 95 34 85 Q4 72 14 42 Q30 17 50 10', c, 10) +
        path('M50 2 L65 22 L36 27Z', c),
      path('M4 6 L81 48 L95 69 L78 91 L53 86Z', c) + line('M12 45 L50 72 M32 8 L79 36', c, 5),
    ][v];
  if (cat === 2)
    s = [
      star(5, 47, 21, c),
      star(4, 48, 8, c),
      star(8, 47, 15, c),
      `<ellipse cx="50" cy="55" rx="46" ry="19" fill="none" stroke="${c}" stroke-width="3" transform="rotate(-25 50 50)"/>` +
        star(5, 24, 10, c),
      `<g transform="translate(-18 -5) scale(.8)">${star(4, 32, 6, c)}</g><g transform="translate(42 35) scale(.5)">${star(4, 40, 8, c)}</g>` +
        circle(77, 16, 5, c),
      repeat(
        8,
        (i) =>
          `<g transform="translate(${Math.cos(i * 0.785) * 32} ${Math.sin(i * 0.785) * 32}) scale(.3)">${star(5, 40, 18, c)}</g>`,
      ),
      `<polygon points="50,4 90,76 10,76" fill="none" stroke="${c}" stroke-width="5"/><polygon points="50,96 90,24 10,24" fill="none" stroke="${c}" stroke-width="5"/>`,
      repeat(16, (i) => line('M50 32 L50 5', c, 2, `transform="rotate(${i * 22.5} 50 50)"`)),
      path('M4 13 L77 49 L58 73Z', c) + circle(72, 65, 22, c),
      repeat(20, (i) => circle(((i * 31) % 93) + 3, ((i * 53) % 93) + 3, 1 + (i % 5), c)),
    ][v];
  if (cat === 3)
    s = [
      heart(c),
      `<g transform="translate(-5 2) scale(.7)">${heart(c)}</g><g transform="translate(40 25) scale(.55)">${heart(c)}</g>`,
      path('M5 25 L33 34 L50 63 L67 34 L95 25 L83 67 L50 86 L17 67Z', c) +
        `<g transform="translate(20 14) scale(.6)">${heart(c)}</g>`,
      path(
        'M5 26 L49 43 L95 26 L87 67 L50 55 L13 67Z M34 53 L15 95 L41 79 L50 56 L65 92 L78 73 L65 51Z',
        c,
      ),
      path('M7 13 L49 37 L93 13 L93 84 L51 63 L7 84Z', c) + circle(50, 50, 12, c),
      path('M2 35 L18 54 L2 75 L98 75 L82 54 L98 35Z', c),
      repeat(
        8,
        (i) =>
          `<g transform="translate(${Math.cos(i * 0.785) * 34 + 35} ${Math.sin(i * 0.785) * 34 + 35}) scale(.3)">${heart(c)}</g>`,
      ),
      line('M5 15 Q95 35 5 55 Q95 75 5 95 M95 15 Q5 35 95 55 Q5 75 95 95', c, 7),
      `<g transform="translate(12 7) scale(.7)">${heart(c)}</g>` +
        line('M4 85 L95 8 M79 8 H95 V24', c, 5),
      repeat(
        5,
        (i) => `<g transform="translate(${i * 19} ${(i % 2) * 38}) scale(.25)">${heart(c)}</g>`,
      ),
    ][v];
  if (cat === 4)
    s = [
      petals(5, c),
      petals(5, c) + circle(50, 50, 15, '#ffffff', 'fill-opacity=".6"'),
      line(
        'M50 52 Q25 3 71 17 Q105 37 73 75 Q37 107 13 67 Q-2 32 36 16 Q73 2 82 48 Q78 79 46 77 Q19 62 34 37 Q60 23 65 47 Q63 64 44 58',
        c,
        9,
      ),
      repeat(
        9,
        (i) =>
          `<g transform="translate(${(i % 3) * 30} ${Math.floor(i / 3) * 30}) scale(.38)">${petals(4, c)}</g>`,
      ),
      petals(12, c) + circle(50, 50, 22, '#111827', 'fill-opacity=".6"'),
      path('M15 87 Q12 14 82 8 Q92 67 15 87Z', c),
      line('M14 96 Q30 36 81 4', c, 4) +
        repeat(5, (i) =>
          path(
            `M${25 + i * 10} ${80 - i * 15} q-30 -5 -20 -23 q28 5 20 23 M${30 + i * 10} ${72 - i * 14} q30 -3 28 -24 q-30 2 -28 24`,
            c,
          ),
        ),
      path('M3 68 Q15 27 36 37 Q40 8 50 3 Q60 8 64 37 Q85 27 97 68 Q50 99 3 68Z', c),
      repeat(
        8,
        (i) =>
          `<g transform="translate(${Math.cos(i * 0.785) * 35 + 35} ${Math.sin(i * 0.785) * 35 + 35}) scale(.3)">${petals(5, c)}</g>`,
      ),
      path('M50 96 V58 M15 22 L33 34 L50 10 L67 34 L85 22 Q82 69 50 69 Q18 69 15 22Z', c) +
        path('M50 91 Q15 96 10 67 Q42 69 50 91Z', c),
    ][v];
  if (cat === 5)
    s = [
      path('M3 36 Q23 26 94 19 L86 64 Q31 82 9 67Z', c),
      repeat(9, (i) =>
        line(
          `M${5 + (i % 3) * 4} ${17 + i * 8} L${95 - (i % 4) * 8} ${12 + i * 7}`,
          c,
          3 + (i % 3),
        ),
      ),
      path(
        'M13 44 Q0 10 38 21 Q59 0 77 25 Q105 24 87 61 Q101 94 67 85 Q32 102 26 78 Q-3 74 13 44Z',
        c,
      ),
      line('M72 12 C14 -9 -4 72 34 88 C79 111 108 28 77 15', c, 9),
      path('M8 89 L28 25 L72 7 L89 19 L41 79Z', c),
      repeat(3, (i) =>
        path(
          `M${4 + i * 7} ${23 + i * 27} L93 ${8 + i * 26} L87 ${24 + i * 26} L11 ${37 + i * 27}Z`,
          c,
        ),
      ),
      circle(50, 50, 21, c) +
        repeat(15, (i) => circle((i * 37) % 98, (i * 61) % 94, 1 + (i % 6), c)),
      path('M1 75 L43 11 L58 5 L99 78 L77 87 L48 32 L25 91Z', c),
      path('M2 70 Q40 58 98 66 L90 77 L9 86Z', c),
      line('M49 50 Q24 20 15 50 Q5 85 50 91 Q101 91 91 37 Q76 -4 31 13', c, 8),
    ][v];
  if (cat === 6)
    s = [
      repeat(3, (i) =>
        path(`M3 ${22 + i * 24} L95 ${10 + i * 24} L88 ${17 + i * 24} L12 ${30 + i * 24}Z`, c),
      ),
      path('M4 40 H65 V18 L98 50 L65 82 V60 H4Z', c),
      path('M8 7 L51 50 L8 93 H31 L74 50 L31 7Z M49 7 L92 50 L49 93 H67 L99 50 L67 7Z', c),
      line('M7 91 Q7 12 81 15', c, 12) + path('M72 2 L97 15 L73 31Z', c),
      path('M1 50 L25 24 V40 H75 V24 L99 50 L75 76 V60 H25 V76Z', c),
      repeat(9, (i) => line('M50 30 L50 3', c, 3, `transform="rotate(${i * 40} 50 50)"`)),
      repeat(4, (i) => line(`M3 ${28 + i * 15} Q45 ${-10 + i * 15} 97 ${12 + i * 15}`, c, 4)),
      path('M4 89 V67 H29 V45 H54 V24 H74 V4 L98 24 L74 44 V34 H63 V55 H38 V77 H14 V89Z', c),
      repeat(6, (i) => rect(4 + i * 16, 40 - (i % 3) * 9, 10, 5 + (i % 3) * 9, c)),
      line('M18 76 A36 36 0 1 1 84 38', c, 9) + path('M65 35 L95 30 L91 58Z', c),
    ][v];
  if (cat === 7)
    s = [
      line('M3 30 V3 H30 M70 3 H97 V30 M97 70 V97 H70 M30 97 H3 V70', c, 6),
      rect(4, 12, 92, 76, 'none', `stroke="${c}" stroke-width="3"`) +
        rect(12, 20, 76, 60, 'none', `stroke="${c}" stroke-width="2"`),
      circle(50, 50, 45, 'none', `stroke="${c}" stroke-width="5"`),
      `<ellipse cx="50" cy="50" rx="47" ry="30" fill="none" stroke="${c}" stroke-width="5"/>`,
      `<polygon points="25,7 75,7 97,50 75,93 25,93 3,50" fill="none" stroke="${c}" stroke-width="5"/>`,
      line('M5 20 Q20 5 35 20 T65 20 T95 20 L95 80 Q80 95 65 80 T35 80 T5 80Z', c, 3),
      rect(4, 12, 92, 76, 'none', `stroke="${c}" stroke-width="4" stroke-dasharray="5 5"`),
      rect(15, 15, 70, 70, 'none', `stroke="${c}" stroke-width="3"`) +
        repeat(
          4,
          (i) =>
            `<g transform="rotate(${i * 90} 50 50)">${circle(15, 15, 9, c) + line('M15 32 Q1 26 4 13 M32 15 Q26 1 13 4', c, 3)}</g>`,
        ),
      line('M10 8 H90 V58 Q86 81 50 97 Q14 81 10 58Z', c, 5),
      line('M8 94 V47 A42 42 0 0 1 92 47 V94Z', c, 5),
    ][v];
  if (cat === 8)
    s = [
      path('M5 27 L24 46 L50 5 L76 46 L95 27 L82 80 H18Z', c) + rect(18, 86, 64, 7, c),
      path('M5 22 L22 49 L35 15 L50 49 L65 15 L78 49 L95 22 L83 86 H17Z', c),
      path('M25 4 L50 25 L75 4 L67 54 H33Z', c) + circle(50, 68, 27, c),
      path('M18 2 L40 12 L50 36 L60 12 L82 2 L70 46 H30Z', c) +
        `<g transform="translate(18 35) scale(.64)">${star(5, 47, 21, c)}</g>`,
      line('M39 92 Q-6 59 24 10 M61 92 Q106 59 76 10', c, 4) +
        repeat(6, (i) =>
          path(
            `M${23 - (i % 2) * 5} ${18 + i * 12} q-19 -14 -19 1 q0 12 19 15 M${77 + (i % 2) * 5} ${18 + i * 12} q19 -14 19 1 q0 12 -19 15`,
            c,
          ),
        ),
      path('M28 6 H72 V49 Q68 65 56 70 V85 H77 V96 H23 V85 H44 V70 Q32 65 28 49Z', c) +
        line('M28 19 H9 Q7 55 33 56 M72 19 H91 Q93 55 67 56', c, 6),
      path('M9 7 H91 V58 Q83 84 50 98 Q17 84 9 58Z', c),
      circle(50, 35, 29, c) +
        path('M24 49 L9 95 L33 86 L43 97 L50 62 L57 97 L67 86 L91 95 L76 49Z', c),
      path('M5 32 L26 5 H74 L95 32 L50 96Z', c) +
        line('M5 32 H95 M26 5 L50 96 L74 5', '#ffffff', 2, 'opacity=".5"'),
      path('M50 38 L5 10 L12 54 L37 71 L50 59 L63 71 L88 54 L95 10Z', c) + circle(50, 45, 19, c),
    ][v];
  if (cat === 9)
    s = [
      path('M5 40 A45 32 0 1 1 85 61 L68 64 L50 93 L46 70 Q5 69 5 40Z', c),
      star(13, 48, 33, c),
      path('M4 8 H96 V72 H61 L40 97 V72 H4Z', c),
      path(
        'M13 65 Q-3 40 14 29 Q8 10 30 12 Q45 -3 59 14 Q87 2 89 27 Q112 43 91 62 Q87 82 61 74 Q30 89 13 65Z',
        c,
      ),
      `<ellipse cx="53" cy="37" rx="43" ry="31" fill="${c}"/>` +
        circle(25, 77, 10, c) +
        circle(9, 94, 5, c),
      path('M50 3 L97 94 H3Z', c),
      `<polygon points="25,6 75,6 99,50 75,94 25,94 1,50" fill="${c}"/>`,
      line('M50 50 C60 37 37 30 33 49 C26 78 79 83 82 47 C84 0 5 3 7 55 C10 98 66 104 94 72', c, 7),
      repeat(
        15,
        (i) =>
          `<rect x="${(i * 37) % 92}" y="${(i * 53) % 94}" width="7" height="14" fill="${c}" transform="rotate(${i * 31} ${(i * 37) % 92} ${(i * 53) % 94})"/>`,
      ),
      circle(50, 50, 37, c) +
        circle(11, 21, 9, c) +
        circle(89, 75, 7, c) +
        line('M9 80 Q70 -9 93 25', c, 4),
    ][v];
  return s;
}
export function decorationSvg(id: string, color: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">${decorationMarkup(id, color)}</svg>`;
}
const motif = (id: string, x: number, y: number, size: number, c: string, rot = 0) =>
  `<g transform="translate(${x} ${y}) rotate(${rot} ${size / 2} ${size / 2}) scale(${size / 100})">${decorationMarkup(id, c)}</g>`;
export function backgroundSvg(bg: Background): string {
  const a = backgrounds.find((a) => a.id === bg.presetId) || backgrounds[0],
    c = bg.accent,
    v = a.variant,
    cat = backgroundCategories.indexOf(a.category);
  const n = Math.max(1, Math.round(16 * bg.density)),
    soft = 'opacity=".28"';
  const particles = () =>
    repeat(n * 2, (i) =>
      circle(
        (i * 157 + 33) % 960,
        (i * 73 + 9) % 192,
        1 + (i % 4),
        c,
        `opacity="${0.15 + (i % 5) * 0.12}"`,
      ),
    );
  const waves = (count = 3) =>
    repeat(count, (i) =>
      line(
        `M-50 ${80 + i * 30} C160 ${-60 + i * 30} 320 ${240 + i * 30} 500 ${90 + i * 30} S760 ${60 + i * 30} 1030 ${120 + i * 30}`,
        c,
        3 + i * 2,
        soft,
      ),
    );
  let s = '';
  if (cat === 0)
    s = [
      path('M0 160 Q260 160 440 38 Q310 142 720 192 H0Z', c, 'opacity=".35"') +
        repeat(n, (i) =>
          line(
            `M${i * 62 - 90} 200 Q${i * 62 + 150} 60 ${i * 62 + 430} -20`,
            c,
            (i % 3) + 1,
            'opacity=".5"',
          ),
        ) +
        particles(),
      repeat(n, (i) =>
        path(
          `M${i * 80 - 100} 192 L${i * 80 + 150} 0 H${i * 80 + 165} L${i * 80 - 60} 192Z`,
          c,
          soft,
        ),
      ) + waves(2),
      repeat(n, (i) =>
        line(
          `M${i * 90 - 200} 192 L${i * 90 + 260} 0 M${i * 90} 0 L${i * 90 + 320} 192`,
          c,
          1 + (i % 4),
          soft,
        ),
      ),
      repeat(
        7,
        (i) =>
          `<ellipse cx="160" cy="230" rx="${70 + i * 90}" ry="${50 + i * 29}" fill="none" stroke="${c}" stroke-width="${i % 2 ? 8 : 2}" opacity=".4"/>`,
      ),
      waves(5) + repeat(6, (i) => motif('deco-0-6', i * 185 - 50, 100, 150, c)),
    ][v];
  if (cat === 1)
    s = [
      motif('deco-5-0', -40, 0, 700, c, -5) + motif('deco-5-6', 820, 5, 160, c),
      particles() +
        repeat(n, (i) =>
          rect(
            (i * 193) % 960,
            (i * 89) % 192,
            14 + (i % 4) * 10,
            8 + (i % 3) * 7,
            c,
            `opacity=".5" transform="rotate(${i * 37} ${(i * 193) % 960} ${(i * 89) % 192})"`,
          ),
        ),
      repeat(
        n * 2,
        (i) =>
          `<g transform="translate(${(i % 16) * 65} ${Math.floor(i / 16) * 64 - 12})">${line('M0 32 L32 0 L64 32 L32 64Z M0 32 H64 M32 0 V64 M0 32 L32 64 L64 32 L32 0Z', c, 1, soft)}</g>`,
      ),
      repeat(
        n * 3,
        (i) =>
          `<g transform="translate(${(i % 18) * 60 - 30 + (Math.floor(i / 18) % 2) * 30} ${Math.floor(i / 18) * 40})">${repeat(4, (j) => line(`M${-24 + j * 6} 32 A${24 - j * 6} ${24 - j * 6} 0 0 1 ${24 - j * 6} 32`, c, 1, 'opacity=".5"'))}</g>`,
      ),
      path('M0 167 L161 32 L278 157 L345 91 L481 192 H0Z', c, 'opacity=".18"') +
        motif('deco-0-6', 670, 20, 300, c) +
        waves(3),
    ][v];
  if (cat === 2)
    s = [
      repeat(7, (i) =>
        path(
          `M${i * 150 - 100} 192 Q${i * 150 + 70} 120 ${i * 150 + 30} 15 Q${i * 150 + 180} 102 ${i * 150 + 85} 192Z`,
          c,
          soft,
        ),
      ),
      particles() +
        repeat(n, (i) => line(`M${i * 70} 170 l20 -${20 + (i % 5) * 12}`, c, 2, 'opacity=".8"')),
      repeat(8, (i) =>
        circle(
          480,
          220,
          45 + i * 35,
          'none',
          `stroke="${c}" stroke-width="${18 - i}" opacity=".18"`,
        ),
      ),
      repeat(n, (i) => path(`M480 160 L${i * 85 - 200} 0 H${i * 85 - 170}Z`, c, soft)),
      repeat(5, (i) => motif('deco-1-0', i * 230 - 50, -40, 230, c, 20)),
    ][v];
  if (cat === 3)
    s = [
      repeat(n, (i) =>
        motif(
          'deco-3-0',
          (i * 139) % 960,
          ((i * 37) % 170) - 10,
          20 + (i % 5) * 9,
          c,
          ((i % 3) - 1) * 20,
        ),
      ),
      motif('deco-3-3', -40, -30, 260, c) +
        motif('deco-3-3', 760, -30, 260, c) +
        line('M0 160 Q480 80 960 160', c, 16, soft),
      repeat(n, (i) =>
        motif('deco-2-0', (i * 137) % 960, ((i * 53) % 190) - 15, 20 + (i % 3) * 13, c, i * 17),
      ),
      repeat(n, (i) => circle((i * 131) % 960, (i * 73) % 192, 10 + (i % 4) * 16, c, soft)),
      repeat(n, (i) =>
        rect(i * 80 - 100, -120, 25, 420, c, `opacity=".25" transform="rotate(28 ${i * 80} 96)"`),
      ) + repeat(9, (i) => circle(i * 120, 192, 40, c, soft)),
    ][v];
  if (cat === 4)
    s = [
      repeat(n, (i) =>
        motif('deco-4-0', (i * 163) % 960, ((i * 71) % 190) - 10, 26 + (i % 4) * 12, c, i * 23),
      ),
      waves(2) +
        repeat(n, (i) =>
          motif('deco-4-5', (i * 123) % 960, 80 + Math.sin(i) * 65, 22 + (i % 3) * 9, c, i * 41),
        ),
      repeat(8, (i) => motif('deco-4-2', i * 135 - 20, i % 2 ? 110 : -30, 115, c)),
      repeat(10, (i) => motif('deco-4-3', i * 120 - 30, i % 2 ? 90 : -25, 120, c)) + particles(),
      repeat(12, (i) => motif('deco-4-1', i * 90 - 20, i % 2 ? 157 : -30, 65, c)) +
        motif('deco-4-6', 0, 30, 130, c) +
        motif('deco-4-6', 830, 30, 130, c, 180),
    ][v];
  if (cat === 5)
    s = [
      repeat(n, (i) => line(`M${i * 65} 0 V192 M0 ${i * 28} H960`, c, 1, soft)) +
        line('M0 160 L270 95 L380 155 H630 L760 40 H960', c, 3),
      repeat(5, (i) =>
        line(
          `M0 ${22 + i * 38} H310 L${370 + i * 25} ${60 + i * 20} H960`,
          c,
          2 + (i % 2),
          'opacity=".65"',
        ),
      ),
      repeat(n, (i) => rect(i * 65, 192 - (30 + ((i * 37) % 140)), 40, 180, c, soft)) +
        repeat(n * 3, (i) => rect((i * 31) % 960, 30 + ((i * 67) % 140), 3, 8, c, 'opacity=".65"')),
      repeat(6, (i) =>
        line(
          `M${i * 190 - 70} 0 L${i * 110 + 340} 192 M${i * 170} 192 L${i * 110 + 150} 0`,
          c,
          2,
          'opacity=".65"',
        ),
      ),
      repeat(
        n,
        (i) =>
          line(`M${i * 90} 0 V${40 + (i % 4) * 23} H${i * 90 + 45} V192`, c, 2, soft) +
          circle(i * 90 + 45, 70, 4, c),
      ),
    ][v];
  if (cat === 6)
    s = [
      repeat(6, (i) =>
        line(
          `M${-80 + i * 20} 192 Q${320 + i * 25} ${-120 + i * 20} ${1040 + i * 20} 192`,
          c,
          i === 3 ? 9 : 1,
          'opacity=".5"',
        ),
      ),
      waves(8),
      repeat(9, (i) =>
        line(
          `M${i * 160 - 180} 0 L${i * 100 + 70} 40 L${i * 160 + 20} 62 L${i * 100 + 80} 120 L${i * 160 + 70} 192`,
          c,
          1 + (i % 2),
          soft,
        ),
      ),
      particles() +
        repeat(12, (i) =>
          circle(
            i * 89,
            30 + ((i * 61) % 170),
            9 + (i % 3) * 5,
            'none',
            `stroke="${c}" opacity=".35"`,
          ),
        ),
      repeat(10, (i) => rect(i * 120 - 80, 0, 60, 192, c, `opacity=".12" transform="skewX(-25)"`)) +
        line('M0 14 H960 M0 178 H960', c, 2),
    ][v];
  if (cat === 7)
    s = [
      path('M0 155 Q180 126 360 150 T960 143 V192 H0Z', c, 'opacity=".3"') +
        circle(815, 42, 25, c, 'opacity=".7"'),
      repeat(8, (i) =>
        path(
          `M${i * 145 - 70} ${65 + (i % 3) * 45} q-30 -25 -9 -43 q12 -29 32 -10 q37 -18 49 13 q39 15 12 40Z`,
          c,
          'opacity=".3"',
        ),
      ),
      waves(5) + line('M0 78 H960', c, 1, soft) + particles(),
      circle(720, 110, 70, c, 'opacity=".8"') +
        path('M0 132 Q280 112 470 142 T960 126 V192 H0Z', bg.color, 'opacity=".6"') +
        waves(2),
      repeat(
        6,
        (i) =>
          `<ellipse cx="480" cy="205" rx="${310 + i * 16}" ry="${145 + i * 11}" fill="none" stroke="${['#ff8894', '#ffba7b', '#fbea9b', '#9bf7c9', '#92dbfc', '#cdb8ff'][i]}" stroke-width="10" opacity=".55"/>`,
      ),
    ][v];
  if (cat === 8)
    s = [
      '',
      rect(0, 0, 960, 192, 'url(#accent-gradient)', 'opacity=".6"'),
      path('M0 0 H270 L410 192 H0Z M700 0 H960 V192 H850Z', c, soft) +
        path('M270 0 L520 192 H410Z', c, 'opacity=".15"'),
      path('M0 0 H370 L590 192 H0Z', c, 'opacity=".32"'),
      line('M36 20 H924 M36 172 H924', c, 1, soft) + circle(42, 26, 3, c) + circle(918, 166, 3, c),
    ][v];
  if (cat === 9)
    s = [
      repeat(n * 5, (i) => circle((i % 25) * 40, Math.floor(i / 25) * 40, 3 + (i % 4), c, soft)),
      repeat(
        20,
        (i) =>
          `<g transform="rotate(${i * 18} 150 96)">${path('M170 96 L1000 45 L1000 85Z', c, soft)}</g>`,
      ) + particles(),
      repeat(n, (i) =>
        rect(i * 90 - 70, -90, 22, 380, c, `opacity=".3" transform="rotate(35 ${i * 90} 96)"`),
      ),
      repeat(12, (i) =>
        rect(
          (i % 6) * 160,
          Math.floor(i / 6) * 96,
          140 - (i % 3) * 20,
          76,
          c,
          `opacity="${0.1 + (i % 4) * 0.1}"`,
        ),
      ),
      repeat(9, (i) =>
        circle(
          i * 130 - 40,
          96,
          60 + (i % 3) * 10,
          'none',
          `stroke="${c}" stroke-width="${10 + (i % 3) * 5}" opacity=".25"`,
        ),
      ),
    ][v];
  if (cat === 10)
    s = [
      path('M0 192 L350 0 H630 L290 192Z M720 192 L960 30 V130 L870 192Z', c, soft) +
        line('M210 192 L560 0', c, 2),
      repeat(n, (i) =>
        motif('deco-2-6', (i * 139) % 960, ((i * 61) % 192) - 20, 65 + (i % 3) * 35, c, i * 20),
      ),
      repeat(10, (i) => rect(i * 120, 0, 70, 192, c, 'opacity=".1"')) +
        repeat(24, (i) => circle((i % 12) * 87 + 8, i < 12 ? 10 : 182, 3, c)),
      repeat(12, (i) =>
        path(
          `M${i * 90 - 90} 192 L${i * 85 + 90} 0 L${i * 90 + 120} 192Z`,
          c,
          `opacity="${0.08 + (i % 3) * 0.07}"`,
        ),
      ),
      repeat(5, (i) =>
        path(
          `M0 ${40 + i * 35} Q180 ${-20 + i * 50} 450 ${100 + i * 30} T960 ${i * 28} V192 H0Z`,
          c,
          `opacity="${0.03 + i * 0.03}"`,
        ),
      ),
    ][v];
  if (cat === 11)
    s = [
      repeat(7, (i) =>
        line(
          `M-50 ${i * 34} Q270 ${-140 + i * 37} 480 ${80 + i * 18} T1020 ${i * 34}`,
          `hsl(${i * 42 + 160},85%,75%)`,
          18,
          'opacity=".35"',
        ),
      ),
      repeat(n, (i) =>
        path(
          `M${i * 70 - 50} 0 Q${i * 70 + 60} 120 ${i * 70 - 40} 192 L${i * 70 + 10} 192 Q${i * 70 + 100} 90 ${i * 70} 0Z`,
          c,
          `opacity="${0.05 + (i % 4) * 0.07}"`,
        ),
      ),
      particles() +
        repeat(n * 3, (i) =>
          rect((i * 157) % 960, (i * 67) % 192, 2 + (i % 3), 2 + (i % 3), c, 'opacity=".7"'),
        ),
      repeat(n, (i) =>
        motif('deco-2-1', (i * 173) % 960, ((i * 59) % 192) - 10, 12 + (i % 5) * 10, c, i * 10),
      ),
      repeat(
        5,
        (i) =>
          `<ellipse cx="480" cy="96" rx="${200 + i * 70}" ry="${15 + i * 11}" fill="none" stroke="${c}" stroke-width="1" opacity=".25" transform="rotate(${i * 12 - 24} 480 96)"/>`,
      ) + particles(),
    ][v];
  const rad = (bg.direction * Math.PI) / 180,
    x = 50 + Math.cos(rad) * 50,
    y = 50 + Math.sin(rad) * 50;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="192" viewBox="0 0 960 192"><defs><linearGradient id="base" x1="${100 - x}%" y1="${100 - y}%" x2="${x}%" y2="${y}%"><stop stop-color="${bg.color}"/><stop offset="1" stop-color="${cat === 8 && v === 0 ? bg.color : c}" stop-opacity="${cat === 8 && v === 0 ? 1 : 0.4}"/></linearGradient><linearGradient id="accent-gradient"><stop stop-color="${c}" stop-opacity="0"/><stop offset="1" stop-color="${c}"/></linearGradient><filter id="brightness" color-interpolation-filters="sRGB"><feComponentTransfer><feFuncR type="linear" slope="${bg.brightness}"/><feFuncG type="linear" slope="${bg.brightness}"/><feFuncB type="linear" slope="${bg.brightness}"/></feComponentTransfer></filter></defs><g filter="url(#brightness)" transform="${bg.flipped ? 'translate(960 0) scale(-1 1)' : ''}">${rect(0, 0, 960, 192, bg.color)}${rect(0, 0, 960, 192, 'url(#base)')}${s}</g></svg>`;
}
export function svgUrl(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
