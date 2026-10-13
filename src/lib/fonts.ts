import { useEffect, useState } from 'react';
import { fonts } from '../catalog/fonts';
import type { CustomFont, Project } from '../types';
const sheets = new Map<string, Promise<void>>(),
  customs = new Map<string, Promise<FontFace>>(),
  links = new Map<string, HTMLLinkElement>();
function deadline<T>(p: Promise<T>, ms = 25000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () =>
        reject(
          new Error('フォントの読み込みがタイムアウトしました。通信を確認して再試行してください。'),
        ),
      ms,
    );
    p.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}
export async function registerCustom(f: CustomFont) {
  if (!customs.has(f.family)) {
    const face = new FontFace(f.family, `url(${f.data})`);
    customs.set(
      f.family,
      face
        .load()
        .then((loaded) => {
          document.fonts.add(loaded);
          return loaded;
        })
        .catch((e) => {
          customs.delete(f.family);
          throw e;
        }),
    );
  }
  await customs.get(f.family);
}
export async function loadFont(
  family: string,
  text: string,
  customFonts: CustomFont[] = [],
): Promise<void> {
  const custom = customFonts.find((f) => f.family === family);
  if (custom) {
    await deadline(registerCustom(custom));
    return;
  }
  const meta = fonts.find((f) => f.family === family);
  if (!meta) throw new Error(`フォント「${family}」が見つかりません。`);
  if (meta.category === '英字レーシング') await loadFont('Noto Sans JP', text, customFonts);
  if (!sheets.has(family))
    sheets.set(
      family,
      new Promise<void>((resolve, reject) => {
        const link = document.createElement('link');
        links.set(family, link);
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+').replace(/:/g, '%3A')}:wght@${meta.weight}&display=swap`;
        link.onload = () => resolve();
        link.onerror = () => {
          link.remove();
          sheets.delete(family);
          reject(new Error(`${family}を読み込めませんでした。通信を確認してください。`));
        };
        document.head.append(link);
      }),
    );
  await deadline(sheets.get(family)!);
  const spec = `${meta.weight} 32px "${family}"`;
  // A stylesheet load event can precede the FontFaceSet update in Chromium.
  // Force style resolution, then retry discovery before treating it as a failure.
  const probe = document.createElement('span');
  probe.textContent = text || '松田真実';
  probe.style.cssText = 'position:fixed;visibility:hidden;left:-10000px;';
  probe.style.font = spec;
  document.body.append(probe);
  try {
    let faces: FontFace[] = [];
    for (let attempt = 0; attempt < 4; attempt++) {
      void probe.offsetWidth;
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
      faces = await deadline(document.fonts.load(spec, text || '松田真実'));
      if (faces.length && document.fonts.check(spec, text || '松田真実')) return;
      await new Promise((r) => setTimeout(r, 80));
    }
    throw new Error(`${family}の読み込みを確認できません。`);
  } catch (error) {
    links.get(family)?.remove();
    links.delete(family);
    sheets.delete(family);
    throw error;
  } finally {
    probe.remove();
  }
}
export function fontWeight(family: string) {
  return fonts.find((f) => f.family === family)?.weight || 400;
}
export function useProjectFonts(project: Project) {
  const [status, setStatus] = useState<{ loading: boolean; error: string; revision: number }>({
      loading: true,
      error: '',
      revision: 0,
    }),
    [retry, setRetry] = useState(0);
  const key = JSON.stringify(
    project.layers
      .filter((l) => l.type === 'text' && l.visible)
      .map((l) => (l.type === 'text' ? [l.fontFamily, l.text] : null)),
  );
  useEffect(() => {
    let active = true;
    setStatus((s) => ({ ...s, loading: true, error: '' }));
    Promise.all(
      project.layers
        .filter((l) => l.type === 'text' && l.visible)
        .map((l) =>
          l.type === 'text'
            ? loadFont(l.fontFamily, l.text, project.customFonts)
            : Promise.resolve(),
        ),
    )
      .then(() => {
        if (active) setStatus((s) => ({ loading: false, error: '', revision: s.revision + 1 }));
      })
      .catch((e) => {
        if (active) setStatus((s) => ({ ...s, loading: false, error: String(e.message) }));
      });
    return () => {
      active = false;
    };
  }, [key, retry, project.customFonts]);
  return { ...status, retry: () => setRetry((n) => n + 1) };
}
export async function ensureProjectFonts(p: Project) {
  await Promise.all(
    p.layers
      .filter((l) => l.type === 'text' && l.visible)
      .map((l) =>
        l.type === 'text' ? loadFont(l.fontFamily, l.text, p.customFonts) : Promise.resolve(),
      ),
  );
}
