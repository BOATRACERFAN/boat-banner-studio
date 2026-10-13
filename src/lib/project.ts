import { backgrounds } from '../catalog/backgrounds';
import { decorations } from '../catalog/decorations';
import { fonts } from '../catalog/fonts';
import type { Project } from '../types';
const isObj = (x: unknown): x is Record<string, unknown> =>
  !!x && typeof x === 'object' && !Array.isArray(x);
function fail(): never {
  throw new Error('プロジェクト形式が不正です。バージョン1の有効なJSONを選択してください。');
}
function str(o: Record<string, unknown>, k: string, max = 1000) {
  if (typeof o[k] !== 'string' || (o[k] as string).length > max) fail();
}
function num(o: Record<string, unknown>, k: string, min: number, max: number) {
  if (
    typeof o[k] !== 'number' ||
    !Number.isFinite(o[k]) ||
    (o[k] as number) < min ||
    (o[k] as number) > max
  )
    fail();
}
function bool(o: Record<string, unknown>, k: string) {
  if (typeof o[k] !== 'boolean') fail();
}
const color = (s: unknown) => typeof s === 'string' && /^#[a-f0-9]{6}$/i.test(s);
export function parseProject(value: unknown): Project {
  if (
    !isObj(value) ||
    value.schemaVersion !== 1 ||
    !isObj(value.racer) ||
    !isObj(value.background) ||
    !Array.isArray(value.layers) ||
    value.layers.length > 250 ||
    !Array.isArray(value.customFonts) ||
    value.customFonts.length > 10
  )
    fail();
  for (const k of ['id', 'name', 'updatedAt']) str(value, k, 200);
  for (const k of ['name', 'reading', 'number', 'branch', 'cheer']) str(value.racer, k, 300);
  const b = value.background;
  if (!backgrounds.some((a) => a.id === b.presetId) || !color(b.color) || !color(b.accent)) fail();
  num(b, 'brightness', 0.2, 2);
  num(b, 'density', 0.1, 3);
  num(b, 'direction', 0, 360);
  num(b, 'imageScale', 0.01, 30);
  num(b, 'imageX', -5000, 5000);
  num(b, 'imageY', -5000, 5000);
  num(b, 'imageOpacity', 0, 1);
  bool(b, 'flipped');
  bool(b, 'transparent');
  const checkImage = (s: unknown) => {
    if (
      typeof s !== 'string' ||
      s.length > 12_000_000 ||
      !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=\r\n]+$/.test(s)
    )
      fail();
  };
  if (b.image) checkImage(b.image);
  const customNames: string[] = [];
  for (const f of value.customFonts) {
    if (!isObj(f)) fail();
    str(f, 'name', 100);
    str(f, 'family', 100);
    str(f, 'data', 12_000_000);
    if (
      !(f.family as string).startsWith('Custom-') ||
      !/^data:(font\/[a-z0-9-]+|application\/(octet-stream|x-font-[a-z0-9-]+|font-[a-z0-9-]+));base64,[A-Za-z0-9+/=]+$/.test(
        f.data as string,
      )
    )
      fail();
    customNames.push(f.family as string);
  }
  const ids = new Set<string>();
  for (const l of value.layers) {
    if (!isObj(l) || !['text', 'decoration', 'image'].includes(l.type as string)) fail();
    str(l, 'id', 100);
    str(l, 'name', 200);
    if (ids.has(l.id as string)) fail();
    ids.add(l.id as string);
    for (const k of ['x', 'y']) num(l, k, -5000, 5000);
    for (const k of ['width', 'height']) num(l, k, 1, 3000);
    for (const k of ['scaleX', 'scaleY']) num(l, k, 0.01, 30);
    num(l, 'rotation', -36000, 36000);
    num(l, 'opacity', 0, 1);
    for (const k of ['visible', 'locked', 'flipped']) bool(l, k);
    if (l.groupId !== undefined) str(l, 'groupId', 100);
    if (l.type === 'text') {
      str(l, 'text', 3000);
      str(l, 'fontFamily', 100);
      if (
        !fonts.some((f) => f.family === l.fontFamily) &&
        !customNames.includes(l.fontFamily as string)
      )
        fail();
      num(l, 'fontSize', 6, 160);
      if (!['left', 'center', 'right'].includes(l.align as string)) fail();
      if (
        l.binding &&
        !['name', 'reading', 'number', 'branch', 'cheer'].includes(l.binding as string)
      )
        fail();
      if (!isObj(l.style)) fail();
      const s = l.style;
      for (const k of ['fill', 'stroke', 'outerStroke', 'shadowColor']) if (!color(s[k])) fail();
      if (s.gradient !== '' && !color(s.gradient)) fail();
      for (const k of ['strokeWidth', 'outerWidth']) num(s, k, 0, 16);
      num(s, 'shadowDistance', 0, 40);
      num(s, 'shadowAngle', 0, 360);
      num(s, 'shadowBlur', 0, 40);
      num(s, 'glow', 0, 40);
      num(s, 'letterSpacing', -5, 20);
      num(s, 'lineHeight', 0.7, 3);
      bool(s, 'italic');
      if (!['normal', 'metal', 'extrude', 'long', 'emboss'].includes(s.effect as string)) fail();
    } else if (l.type === 'decoration') {
      if (!decorations.some((a) => a.id === l.assetId) || !color(l.color)) fail();
    } else checkImage(l.src);
  }
  return structuredClone(value) as unknown as Project;
}
export function readAutosave(): Project | undefined {
  try {
    const raw = localStorage.getItem('boat-studio-autosave');
    return raw ? parseProject(JSON.parse(raw)) : undefined;
  } catch {
    return undefined;
  }
}
export function readProjects(): Project[] {
  try {
    const raw = JSON.parse(localStorage.getItem('boat-studio-projects') || '[]');
    if (!Array.isArray(raw)) return [];
    return raw.flatMap((p) => {
      try {
        return [parseProject(p)];
      } catch {
        return [];
      }
    });
  } catch {
    return [];
  }
}
export function saveProjects(projects: Project[]) {
  localStorage.setItem('boat-studio-projects', JSON.stringify(projects));
}
export function download(data: string, filename: string) {
  const a = document.createElement('a');
  a.href = data;
  a.download = filename;
  a.click();
}
export function downloadJSON(project: Project) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' }),
  );
  download(url, `${safeName(project.racer.name)}_${safeName(project.racer.number)}.json`);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function safeName(s: string) {
  return s.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').slice(0, 60) || 'banner';
}
