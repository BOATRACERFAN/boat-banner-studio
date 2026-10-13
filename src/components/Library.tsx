import { useEffect, useRef, useState } from 'react';
import { Search, Star, Plus, Upload, Trash2, FolderOpen, ArrowUpRight } from 'lucide-react';
import { backgrounds, backgroundCategories } from '../catalog/backgrounds';
import { decorations, decorationCategories } from '../catalog/decorations';
import { fonts, fontCategories } from '../catalog/fonts';
import { palettes } from '../catalog/palettes';
import { templates, createTemplate, uid } from '../catalog/templates';
import { effects } from '../catalog/effects';
import { TemplatePreview } from './TemplatePreview';
import { useEditor } from '../editor/store';
import { backgroundSvg, decorationSvg, svgUrl } from '../editor/artwork';
import { loadFont, fontWeight, registerCustom } from '../lib/fonts';
import { readRaster } from '../lib/images';
import { readProjects, saveProjects, downloadJSON, parseProject } from '../lib/project';
import type { Project, DecorationLayer, CustomFont } from '../types';
export type Tab = 'templates' | 'backgrounds' | 'decorations' | 'text' | 'palettes' | 'projects';
export const tabNames: Record<Tab, string> = {
  templates: 'テンプレート',
  backgrounds: '背景',
  decorations: '装飾',
  text: '文字',
  palettes: '配色',
  projects: 'プロジェクト',
};
function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('boat-studio-favorites') || '[]');
    } catch {
      return [];
    }
  });
  const toggle = (id: string) =>
    setFavorites((f) => {
      const n = f.includes(id) ? f.filter((a) => a !== id) : [...f, id];
      try {
        localStorage.setItem('boat-studio-favorites', JSON.stringify(n));
      } catch {}
      return n;
    });
  return { favorites, toggle };
}
function Favorite({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button
      className={`favorite ${active ? 'active' : ''}`}
      title={active ? 'お気に入りを解除' : 'お気に入りに追加'}
      aria-label={active ? 'お気に入りを解除' : 'お気に入りに追加'}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <Star size={13} fill={active ? 'currentColor' : 'none'} />
    </button>
  );
}
function FontCard({
  family,
  category,
  favorite,
  onFavorite,
  onSelect,
  active,
  sample,
}: {
  family: string;
  category: string;
  favorite: boolean;
  onFavorite: () => void;
  onSelect: () => void;
  active: boolean;
  sample: string;
}) {
  const ref = useRef<HTMLDivElement>(null),
    [ready, setReady] = useState(false),
    [error, setError] = useState(false);
  useEffect(() => {
    let live = true;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        observer.disconnect();
        loadFont(family, sample)
          .then(() => {
            if (live) setReady(true);
          })
          .catch(() => {
            if (live) setError(true);
          });
      },
      { rootMargin: '80px' },
    );
    if (ref.current) observer.observe(ref.current);
    return () => {
      live = false;
      observer.disconnect();
    };
  }, [family, sample]);
  return (
    <div ref={ref} className={`font-card ${active ? 'selected' : ''}`}>
      <button onClick={onSelect} className="font-select">
        <strong
          style={{ fontFamily: ready ? `"${family}"` : undefined, fontWeight: fontWeight(family) }}
        >
          {sample}
        </strong>
        <span>
          {family}
          <small>
            {category}
            {error ? ' · 通信待ち' : ready ? '' : ' · 読込中'}
          </small>
        </span>
      </button>
      <Favorite active={favorite} onClick={onFavorite} />
    </div>
  );
}
export function Library({
  tab,
  onSave,
  onTabChange,
}: {
  tab: Tab;
  onSave: () => void;
  onTabChange: (tab: Tab) => void;
}) {
  const { project, selection, commit, add, load, setNotice, addText } = useEditor(),
    { favorites, toggle } = useFavorites();
  const [search, setSearch] = useState(''),
    [category, setCategory] = useState('すべて'),
    [onlyFav, setOnlyFav] = useState(false),
    [recent, setRecent] = useState<string[]>(() => {
      try {
        return JSON.parse(localStorage.getItem('boat-studio-recent-fonts') || '[]');
      } catch {
        return [];
      }
    }),
    [projects, setProjects] = useState<Project[]>(readProjects);
  useEffect(() => {
    setSearch('');
    setCategory('すべて');
    setOnlyFav(false);
    if (tab === 'projects') setProjects(readProjects());
  }, [tab, project.id]);
  useEffect(() => {
    if (tab === 'projects') setProjects(readProjects());
  }, [tab, project.updatedAt]);
  const filtered = (id: string, name: string, cat: string) =>
    (!onlyFav || favorites.includes(id)) &&
    (category === 'すべて' ||
      category === cat ||
      (category === '最近使った' && recent.includes(name))) &&
    name.toLowerCase().includes(search.toLowerCase());
  const selected = project.layers.find((l) => selection.includes(l.id) && l.type === 'text');
  const upload = async (file: File | undefined, type: 'background' | 'image') => {
    if (!file) return;
    try {
      const src = await readRaster(file);
      const img = new Image();
      img.src = src;
      await img.decode();
      if (type === 'background')
        commit((p) => {
          p.background.image = src;
          p.background.imageScale = Math.max(960 / img.width, 192 / img.height);
          p.background.imageX = (960 - img.width * p.background.imageScale) / 2;
          p.background.imageY = (192 - img.height * p.background.imageScale) / 2;
          p.background.transparent = false;
        });
      else {
        const scale = Math.min(160 / img.width, 150 / img.height);
        add({
          id: uid(),
          type: 'image',
          name: file.name.slice(0, 80),
          src,
          x: 400,
          y: 25,
          width: img.width * scale,
          height: img.height * scale,
          scaleX: 1,
          scaleY: 1,
          rotation: 0,
          opacity: 1,
          visible: true,
          locked: false,
          flipped: false,
        });
      }
    } catch (e) {
      setNotice((e as Error).message);
    }
  };
  const chooseFont = (family: string) => {
    if (selected?.type === 'text') {
      commit((p) => {
        p.layers.forEach((l) => {
          if (selection.includes(l.id) && l.type === 'text' && !l.locked) l.fontFamily = family;
        });
      });
      const next = [family, ...recent.filter((f) => f !== family)].slice(0, 8);
      setRecent(next);
      try {
        localStorage.setItem('boat-studio-recent-fonts', JSON.stringify(next));
      } catch {}
    } else {
      addText();
      const ids = useEditor.getState().selection;
      useEditor.getState().commit((p) => {
        const l = p.layers.find((l) => ids.includes(l.id));
        if (l?.type === 'text') l.fontFamily = family;
      });
    }
  };
  const customFont = async (file: File | undefined) => {
    if (!file) return;
    try {
      if (project.customFonts.length >= 10) throw new Error('独自フォントは10個までです。');
      if (file.size > 8_000_000 || !/\.(ttf|otf|woff2?)$/i.test(file.name))
        throw new Error('8MB以内のTTF / OTF / WOFF / WOFF2を選択してください。');
      const data = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve((r.result as string).replace(/^data:[^;]+;/, 'data:font/woff2;'));
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      const f: CustomFont = { family: `Custom-${uid()}`, name: file.name, data };
      await registerCustom(f);
      commit((p) => p.customFonts.push(f));
      chooseFont(f.family);
      setNotice('独自フォントを読み込みました。利用許諾と日本語の対応を確認してください。');
    } catch (e) {
      setNotice((e as Error).message);
    }
  };
  const categories =
    tab === 'backgrounds'
      ? backgroundCategories
      : tab === 'decorations'
        ? decorationCategories
        : tab === 'text'
          ? [...fontCategories, '最近使った']
          : tab === 'templates'
            ? ['かっこいい', 'かわいい', '和風', '派手', '上品']
            : [];
  return (
    <aside className="library">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">LIBRARY</span>
          <h2>{tabNames[tab]}</h2>
        </div>
        <span className="count">
          {
            {
              templates: templates.length,
              backgrounds: backgrounds.length,
              decorations: decorations.length,
              text: fonts.length,
              palettes: palettes.length,
              projects: projects.length,
            }[tab]
          }
        </span>
      </div>
      <select
        className="mobile-library-select"
        aria-label="素材ライブラリ"
        value={tab}
        onChange={(e) => onTabChange(e.target.value as Tab)}
      >
        {(Object.keys(tabNames) as Tab[]).map((t) => (
          <option value={t} key={t}>
            {tabNames[t]}
          </option>
        ))}
      </select>
      {tab !== 'projects' && (
        <>
          <div className="search">
            <Search size={15} />
            <input
              aria-label="素材を検索"
              placeholder={tab === 'text' ? 'フォントを検索' : '素材を検索…'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              className={onlyFav ? 'active' : ''}
              aria-label="お気に入りのみ"
              title="お気に入りのみ"
              onClick={() => setOnlyFav(!onlyFav)}
            >
              <Star size={15} fill={onlyFav ? 'currentColor' : 'none'} />
            </button>
          </div>
          {categories.length > 0 && (
            <div className="chips">
              {['すべて', ...categories].map((c) => (
                <button
                  key={c}
                  className={category === c ? 'active' : ''}
                  onClick={() => setCategory(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </>
      )}
      <div className="library-scroll">
        {tab === 'templates' && (
          <>
            <p className="hint">ひとつ選んで、あなたらしくアレンジ。</p>
            <div className="template-grid">
              {templates
                .filter((t) => filtered(t.id, t.name, t.taste))
                .map((t) => (
                  <div className="asset-card" key={t.id}>
                    <button
                      className="template-thumb"
                      aria-label={`テンプレート ${t.name}`}
                      onClick={() => {
                        const next = createTemplate(t, project.racer);
                        next.id = project.id;
                        next.name = project.name;
                        next.customFonts = project.customFonts;
                        load(next);
                      }}
                    >
                      <TemplatePreview template={t} racer={project.racer} />
                    </button>
                    <div className="asset-caption">
                      <span>
                        {t.name}
                        <small>{t.taste}</small>
                      </span>
                      <Favorite active={favorites.includes(t.id)} onClick={() => toggle(t.id)} />
                    </div>
                  </div>
                ))}
            </div>
          </>
        )}
        {tab === 'backgrounds' && (
          <>
            <label className="upload-button">
              <Upload size={15} />
              自分の画像を背景に
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => {
                  void upload(e.target.files?.[0], 'background');
                  e.target.value = '';
                }}
              />
            </label>
            <p className="hint">利用許諾のある画像を使用してください。</p>
            <div className="background-grid">
              {backgrounds
                .filter((a) => filtered(a.id, a.name, a.category))
                .map((a) => (
                  <div
                    key={a.id}
                    className={`asset-card ${project.background.presetId === a.id ? 'selected' : ''}`}
                  >
                    <button
                      className="bg-thumb"
                      aria-label={`背景 ${a.name}`}
                      onClick={() =>
                        commit((p) => {
                          p.background.presetId = a.id;
                          p.background.color = a.color;
                          p.background.accent = a.accent;
                          p.background.image = undefined;
                          p.background.transparent = false;
                        })
                      }
                    >
                      <img
                        loading="lazy"
                        src={svgUrl(
                          backgroundSvg({
                            ...project.background,
                            presetId: a.id,
                            color: a.color,
                            accent: a.accent,
                            brightness: 1,
                            density: 1,
                          }),
                        )}
                        alt={a.name}
                      />
                    </button>
                    <div className="asset-caption">
                      <span>
                        {a.name}
                        <small>{a.category}</small>
                      </span>
                      <Favorite active={favorites.includes(a.id)} onClick={() => toggle(a.id)} />
                    </div>
                  </div>
                ))}
            </div>
          </>
        )}
        {tab === 'decorations' && (
          <>
            <label className="upload-button">
              <Upload size={15} />
              画像をレイヤーとして追加
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => {
                  void upload(e.target.files?.[0], 'image');
                  e.target.value = '';
                }}
              />
            </label>
            <p className="hint">オリジナル素材。クリックで追加できます。</p>
            <div className="decoration-grid">
              {decorations
                .filter((a) => filtered(a.id, a.name, a.category))
                .map((a) => (
                  <div key={a.id} className="deco-card">
                    <button
                      className="deco-thumb"
                      aria-label={`装飾 ${a.name}`}
                      onClick={() => {
                        const l: DecorationLayer = {
                          id: uid(),
                          type: 'decoration',
                          name: a.name,
                          assetId: a.id,
                          color: project.background.accent,
                          x: 420,
                          y: 42,
                          width: 100,
                          height: 100,
                          scaleX: 1,
                          scaleY: 1,
                          rotation: 0,
                          opacity: 1,
                          visible: true,
                          locked: false,
                          flipped: false,
                        };
                        add(l);
                      }}
                    >
                      <img
                        loading="lazy"
                        src={svgUrl(decorationSvg(a.id, '#87e2d7'))}
                        alt={a.name}
                      />
                    </button>
                    <span>{a.name}</span>
                    <Favorite active={favorites.includes(a.id)} onClick={() => toggle(a.id)} />
                  </div>
                ))}
            </div>
          </>
        )}
        {tab === 'text' && (
          <>
            <button className="wide primary" onClick={addText}>
              <Plus size={15} />
              テキストを追加
            </button>
            <p className="hint">
              {selected ? `「${selected.name}」に適用` : 'フォント選択でテキストを追加'} ·
              日本語30書体＋英字2書体
            </p>
            {fonts
              .filter((f) => filtered(f.family, f.family, f.category))
              .map((f) => (
                <FontCard
                  key={f.family}
                  {...f}
                  sample={project.racer.name || '松田真実'}
                  favorite={favorites.includes(f.family)}
                  active={selected?.type === 'text' && selected.fontFamily === f.family}
                  onFavorite={() => toggle(f.family)}
                  onSelect={() => chooseFont(f.family)}
                />
              ))}
            {project.customFonts.map((f) => (
              <button
                className="wide"
                key={f.family}
                onClick={() => chooseFont(f.family)}
                style={{ fontFamily: `"${f.family}"` }}
              >
                {project.racer.name} — {f.name}
              </button>
            ))}
            <label className="upload-button">
              <Upload size={15} />
              独自フォントを追加
              <input
                type="file"
                accept=".ttf,.otf,.woff,.woff2"
                onChange={(e) => {
                  void customFont(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
            </label>
            <p className="hint">
              英字書体は日本語にNoto Sans JPを併用します。独自フォントの日本語対応はご確認ください。
            </p>
          </>
        )}
        {tab === 'palettes' && (
          <>
            <p className="hint">背景・文字・装飾をまとめて配色。元に戻すで復元できます。</p>
            <div className="palette-grid">
              {palettes
                .filter((p) => filtered(p.id, p.name, ''))
                .map((p) => (
                  <div className="asset-card" key={p.id}>
                    <button
                      className="palette-thumb"
                      aria-label={`配色 ${p.name}`}
                      onClick={() =>
                        commit((doc) => {
                          doc.background.color = p.colors[0];
                          doc.background.accent = p.colors[1];
                          doc.layers.forEach((l) => {
                            if (l.locked) return;
                            if (l.type === 'text') {
                              l.style.fill = p.colors[2];
                              l.style.stroke = p.colors[0];
                              if (l.style.gradient) l.style.gradient = p.colors[1];
                              if (l.style.outerWidth) l.style.outerStroke = p.colors[1];
                              l.style.shadowColor = p.colors[0];
                            } else if (l.type === 'decoration') l.color = p.colors[1];
                          });
                        })
                      }
                    >
                      {p.colors.map((c) => (
                        <span key={c} style={{ background: c }} />
                      ))}
                    </button>
                    <div className="asset-caption">
                      <span>{p.name}</span>
                      <Favorite active={favorites.includes(p.id)} onClick={() => toggle(p.id)} />
                    </div>
                  </div>
                ))}
            </div>
          </>
        )}
        {tab === 'projects' && (
          <>
            <button
              className="wide primary"
              onClick={() => {
                onSave();
                setTimeout(() => setProjects(readProjects()), 100);
              }}
            >
              <Plus size={15} />
              このプロジェクトを保存
            </button>
            <button className="wide" onClick={() => downloadJSON(project)}>
              <ArrowUpRight size={15} />
              編集データをJSONで書き出す
            </button>
            <label className="upload-button">
              <FolderOpen size={15} />
              JSONから読み込む
              <input
                type="file"
                accept=".json,application/json"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (!file) return;
                  try {
                    if (file.size > 40_000_000) throw new Error('JSONは40MB以内にしてください。');
                    load(parseProject(JSON.parse(await file.text())));
                    setNotice('プロジェクトを読み込みました。');
                  } catch (err) {
                    setNotice((err as Error).message);
                  }
                }}
              />
            </label>
            <p className="hint">このブラウザーに保存します。別の端末へはJSONで引き継げます。</p>
            {projects.map((p) => (
              <div className="project-card" key={p.id}>
                <div>
                  <strong>{p.name}</strong>
                  <span>
                    {p.racer.name} · {p.racer.number}
                  </span>
                  <small>{new Date(p.updatedAt).toLocaleString('ja-JP')}</small>
                </div>
                <button title="読み込む" aria-label={`${p.name}を読み込む`} onClick={() => load(p)}>
                  <FolderOpen size={17} />
                </button>
                <button
                  title="削除"
                  aria-label={`${p.name}を削除`}
                  onClick={() => {
                    if (!confirm('保存済みプロジェクトを削除しますか？')) return;
                    try {
                      const next = projects.filter((a) => a.id !== p.id);
                      saveProjects(next);
                      setProjects(next);
                    } catch {
                      setNotice('保存容量が不足しています。');
                    }
                  }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            {projects.length === 0 && (
              <div className="empty">まだ保存したプロジェクトはありません。</div>
            )}
          </>
        )}
        {tab !== 'projects' && (
          <div className="library-footer">
            素材はすべて編集できます <ArrowUpRight size={13} />
          </div>
        )}
      </div>
    </aside>
  );
}
export { effects };
