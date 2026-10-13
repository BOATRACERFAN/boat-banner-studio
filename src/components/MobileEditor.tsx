import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type Konva from 'konva';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Check,
  ChevronRight,
  Copy,
  Hand,
  Image,
  LayoutTemplate,
  MoreHorizontal,
  MousePointer2,
  Palette,
  Plus,
  Redo2,
  Shapes,
  SlidersHorizontal,
  Trash2,
  Type,
  Undo2,
  Unlock,
  ZoomIn,
  Maximize,
  FolderOpen,
  Layers,
  Shuffle,
  HelpCircle,
} from 'lucide-react';
import { useEditor } from '../editor/store';
import { BannerScene } from '../editor/Scene';
import { Library } from './Library';
import type { Tab } from './Library';
import { Properties } from './Properties';
import { Color, Slider } from './Controls';
import type { Layer, TextLayer, Taste } from '../types';
import { randomProject } from '../catalog/templates';

type Panel =
  | 'templates'
  | 'text'
  | 'backgrounds'
  | 'decorations'
  | 'more'
  | 'object'
  | 'fonts'
  | 'palettes'
  | 'projects'
  | 'advanced'
  | 'layers'
  | 'random';
const labels: Record<string, string> = {
  name: '選手名',
  reading: 'ふりがな',
  number: '登録番号',
  branch: '支部',
  cheer: '応援メッセージ',
};
const colors = ['#ffffff', '#111827', '#ffdc5e', '#ff779c', '#8fe8d5', '#55bbff'];

function QuickObject({
  layer,
  onFonts,
  onAdvanced,
}: {
  layer: Layer;
  onFonts: () => void;
  onAdvanced: () => void;
}) {
  const state = useEditor();
  const ids = state.selection;
  const update = (patch: Partial<Layer>) => state.updateLayers(ids, patch);
  const color =
    layer.type === 'text' ? layer.style.fill : layer.type === 'decoration' ? layer.color : null;
  const changeColor = (value: string) =>
    state.commit((p) => {
      p.layers.forEach((l) => {
        if (!ids.includes(l.id) || l.locked) return;
        if (l.type === 'text') l.style.fill = value;
        if (l.type === 'decoration') l.color = value;
      });
    });
  const move = (x: number, y: number) =>
    state.commit((p) => {
      p.layers.forEach((l) => {
        if (ids.includes(l.id) && !l.locked) {
          l.x += x;
          l.y += y;
        }
      });
    });
  return (
    <div className="mobile-object">
      {layer.locked && (
        <button
          className="wide"
          onClick={() =>
            state.commit((p) => {
              p.layers.forEach((l) => {
                if (ids.includes(l.id)) l.locked = false;
              });
            })
          }
        >
          <Unlock size={18} />
          ロックを解除して編集
        </button>
      )}
      <fieldset disabled={layer.locked}>
        {layer.type === 'text' && (
          <>
            <label className="field">
              <span>{labels[layer.binding || ''] || '文字の内容'}</span>
              <textarea
                aria-label="選択文字の内容"
                rows={2}
                value={layer.text}
                maxLength={layer.binding ? 300 : 3000}
                onChange={(e) => {
                  const text = e.target.value;
                  if (layer.binding) state.setRacer({ [layer.binding]: text });
                  else state.updateLayers([layer.id], { text } as Partial<TextLayer>);
                }}
              />
            </label>
            <button className="mobile-font-button" onClick={onFonts}>
              <Type size={20} />
              <span>
                {layer.fontFamily}
                <small>書体を変える</small>
              </span>
              <ChevronRight size={18} />
            </button>
            <Slider
              label="文字の大きさ"
              value={layer.fontSize}
              min={6}
              max={160}
              onChange={(fontSize) => update({ fontSize } as Partial<TextLayer>)}
            />
          </>
        )}
        {layer.type !== 'text' && (
          <Slider
            label="飾りの大きさ"
            suffix="%"
            value={Math.round(layer.scaleX * 100)}
            min={10}
            max={400}
            onChange={(value) => {
              const ratio = value / 100 / layer.scaleX;
              state.commit((p) =>
                p.layers.forEach((l) => {
                  if (ids.includes(l.id) && !l.locked) {
                    l.x += (l.width * l.scaleX * (1 - ratio)) / 2;
                    l.y += (l.height * l.scaleY * (1 - ratio)) / 2;
                    l.scaleX *= ratio;
                    l.scaleY *= ratio;
                  }
                }),
              );
            }}
          />
        )}
        {color && (
          <div className="mobile-colors">
            <span>色を変える</span>
            <div className="mobile-swatches">
              {colors.map((value) => (
                <button
                  key={value}
                  aria-label={`色 ${value}`}
                  aria-pressed={color === value}
                  style={{ background: value }}
                  onClick={() => changeColor(value)}
                >
                  {color === value && (
                    <Check color={value === '#111827' ? '#fff' : '#111827'} size={22} />
                  )}
                </button>
              ))}
            </div>
            <Color label="好きな色" value={color} onChange={changeColor} />
          </div>
        )}
        <details className="mobile-adjust">
          <summary>位置・傾きを調整</summary>
          <p>プレビュー上でも指で動かせます。</p>
          <div className="mobile-nudge">
            {(
              [
                [ArrowLeft, -5, 0, '左へ動かす'],
                [ArrowUp, 0, -5, '上へ動かす'],
                [ArrowDown, 0, 5, '下へ動かす'],
                [ArrowRight, 5, 0, '右へ動かす'],
              ] as const
            ).map(([Icon, x, y, name]) => (
              <button key={name} aria-label={name} onClick={() => move(x, y)}>
                <Icon size={22} />
              </button>
            ))}
          </div>
          <button className="wide" onClick={() => state.align('centerX')}>
            横断幕の中央に置く
          </button>
          <Slider
            label="傾き"
            value={layer.rotation}
            min={-180}
            max={180}
            suffix="°"
            onChange={(rotation) => update({ rotation })}
          />
        </details>
      </fieldset>
      <div className="mobile-object-actions">
        <button onClick={state.duplicate}>
          <Copy size={18} />
          複製
        </button>
        <button disabled={layer.locked} onClick={state.remove}>
          <Trash2 size={18} />
          削除
        </button>
        <button onClick={onAdvanced}>
          <SlidersHorizontal size={18} />
          詳細
        </button>
      </div>
    </div>
  );
}

export function MobileEditor({
  stageRef,
  fonts,
  onSave,
  onEdit,
  onHelp,
}: {
  stageRef: RefObject<Konva.Stage | null>;
  fonts: { loading: boolean; error: string; revision: number; retry: () => void };
  onSave: () => void;
  onEdit: (layer: TextLayer) => void;
  onHelp: () => void;
}) {
  const state = useEditor();
  const { project, selection } = state;
  const [panel, setPanel] = useState<Panel>('text');
  const [expanded, setExpanded] = useState(true);
  const [pan, setPan] = useState(false);
  const [width, setWidth] = useState(390);
  const [position, setPosition] = useState(50);
  const [taste, setTaste] = useState<Taste>('かっこいい');
  const viewport = useRef<HTMLDivElement>(null);
  const panStart = useRef<{ id: number; x: number; scroll: number } | null>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const focusX = useRef(480);
  const selected = project.layers.find((l) => selection.includes(l.id));
  const fit = Math.max(0.2, (width - 32) / 960);
  const zoom = expanded ? Math.max(fit, 0.7) : fit;
  useEffect(() => {
    const visual = window.visualViewport;
    const shell = document.querySelector<HTMLElement>('.app-shell');
    if (!visual || !shell) return;
    const resize = () => {
      // Preserve browser pinch-to-zoom. Only respond to the keyboard/browser bars.
      if (visual.scale !== 1) return;
      shell.style.setProperty('--phone-height', `${visual.height}px`);
      shell.classList.toggle('keyboard-open', visual.height < window.innerHeight * 0.78);
    };
    resize();
    visual.addEventListener('resize', resize);
    return () => {
      visual.removeEventListener('resize', resize);
      shell.style.removeProperty('--phone-height');
      shell.classList.remove('keyboard-open');
    };
  }, []);
  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useLayoutEffect(() => {
    if (viewport.current)
      viewport.current.scrollLeft = focusX.current * zoom + 16 - viewport.current.clientWidth / 2;
  }, [zoom, width]);
  useEffect(() => {
    sheet.current?.scrollTo(0, 0);
  }, [panel]);
  // A newly added decoration or text is immediately ready to edit. Selecting a font
  // keeps the font list open so choices can be compared against the live preview.
  const previousSelection = useRef(selection.join(','));
  useEffect(() => {
    const key = selection.join(',');
    if (key !== previousSelection.current && selected) {
      if (panel !== 'advanced' && panel !== 'layers') setPanel('object');
      focusX.current = selected.x + (selected.width * selected.scaleX) / 2;
      if (viewport.current)
        viewport.current.scrollLeft = focusX.current * zoom + 16 - viewport.current.clientWidth / 2;
      setPan(false);
    }
    previousSelection.current = key;
  }, [selection, selected, panel, zoom, width]);
  const choose = (l: Layer) => {
    state.select(
      l.groupId ? project.layers.filter((a) => a.groupId === l.groupId).map((a) => a.id) : [l.id],
    );
    setPanel('object');
    setPan(false);
  };
  const changeTab = (tab: Tab) => setPanel(tab === 'text' ? 'fonts' : tab);
  const libraryTab: Tab | null =
    panel === 'fonts'
      ? 'text'
      : ['templates', 'backgrounds', 'decorations', 'palettes', 'projects'].includes(panel)
        ? (panel as Tab)
        : null;
  const title =
    panel === 'object'
      ? selected?.name || '編集するものを選ぶ'
      : panel === 'text'
        ? '文字をタップして編集'
        : panel === 'more'
          ? 'ほかの操作'
          : panel === 'layers'
            ? '重なっている文字・飾り'
            : panel === 'random'
              ? 'おまかせデザイン'
              : '詳しい設定';
  return (
    <div className="mobile-editor">
      <section className="mobile-preview" aria-label="横断幕プレビュー">
        <div className="mobile-preview-toolbar">
          <div className="mobile-view-toggle">
            <button aria-pressed={!expanded} onPointerUp={(e) => { if (e.pointerType === 'touch') setExpanded(false); }} onClick={() => setExpanded(false)}>
              <Maximize size={16} />
              全体
            </button>
            <button aria-pressed={expanded} onPointerUp={(e) => { if (e.pointerType === 'touch') setExpanded(true); }} onClick={() => setExpanded(true)}>
              <ZoomIn size={16} />
              拡大
            </button>
          </div>
          <div className="mobile-history">
            <button aria-label="元に戻す" disabled={!state.past.length} onClick={state.undo}>
              <Undo2 size={21} />
            </button>
            <button aria-label="やり直す" disabled={!state.future.length} onClick={state.redo}>
              <Redo2 size={21} />
            </button>
          </div>
        </div>
        <div
          className={`mobile-canvas-scroll ${pan ? 'pan-mode' : ''}`}
          ref={viewport}
          onPointerDownCapture={(e) => {
            if (!pan || !e.isPrimary || e.button !== 0) return;
            e.preventDefault();
            e.stopPropagation();
            panStart.current = {
              id: e.pointerId,
              x: e.clientX,
              scroll: e.currentTarget.scrollLeft,
            };
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMoveCapture={(e) => {
            const start = panStart.current;
            if (!start || start.id !== e.pointerId) return;
            e.preventDefault();
            e.stopPropagation();
            e.currentTarget.scrollLeft = start.scroll + start.x - e.clientX;
          }}
          onPointerUpCapture={(e) => {
            if (panStart.current?.id !== e.pointerId) return;
            panStart.current = null;
            e.currentTarget.releasePointerCapture(e.pointerId);
          }}
          onPointerCancel={() => {
            panStart.current = null;
          }}
          onLostPointerCapture={() => {
            panStart.current = null;
          }}
          onScroll={(e) => {
            const el = e.currentTarget;
            const max = el.scrollWidth - el.clientWidth;
            setPosition(max > 0 ? Math.round((el.scrollLeft / max) * 100) : 50);
            focusX.current = (el.scrollLeft + el.clientWidth / 2 - 16) / zoom;
          }}
        >
          <div className="mobile-canvas-track" style={{ width: 960 * zoom + 32 }}>
            <div className="checker" style={{ width: 960 * zoom, height: 192 * zoom }}>
              <BannerScene
                project={project}
                zoom={zoom}
                stageRef={stageRef}
                revision={fonts.revision}
                guides={false}
                onEdit={onEdit}
                touch
                pan={pan}
                onSelect={() => setPanel('object')}
              />
            </div>
          </div>
        </div>
        <div className="mobile-pan-row">
          <button aria-pressed={pan} onClick={() => setPan(!pan)}>
            {pan ? <Hand size={18} /> : <MousePointer2 size={18} />}
            {pan ? '画面を動かす' : '文字・飾りを動かす'}
          </button>
          {960 * zoom + 32 > width + 1 && (
            <label>
              <span>表示位置</span>
              <input
                type="range"
                aria-label="横断幕の表示位置"
                min="0"
                max="100"
                value={position}
                onChange={(e) => {
                  const el = viewport.current;
                  if (el)
                    el.scrollLeft =
                      (Number(e.target.value) / 100) * (el.scrollWidth - el.clientWidth);
                }}
              />
            </label>
          )}
        </div>
        <div className="mobile-preview-status">
          {fonts.error ? (
            <button className="error" onClick={fonts.retry}>
              フォントを再読み込み
            </button>
          ) : (
            <span>{fonts.loading ? 'フォント読込中…' : '書き出し準備完了'}</span>
          )}
          <span>PNG 960 × 192</span>
        </div>
      </section>
      <section className="mobile-sheet" aria-label="編集パネル">
        {(panel === 'fonts' ||
          panel === 'advanced' ||
          panel === 'palettes' ||
          panel === 'projects') && (
          <button className="mobile-back" onClick={() => setPanel(selected ? 'object' : 'more')}>
            <ArrowLeft size={18} />
            {selected ? '選んだ文字・飾りに戻る' : 'メニューに戻る'}
          </button>
        )}
        {libraryTab ? (
          <Library tab={libraryTab} onSave={onSave} onTabChange={changeTab} />
        ) : panel === 'advanced' ? (
          <Properties
            onFonts={() => setPanel('fonts')}
            onBackground={() => setPanel('backgrounds')}
          />
        ) : (
          <>
            <div className="mobile-sheet-heading">
              <h2>{title}</h2>
              {panel === 'object' && (
                <button onClick={() => setPanel('text')} aria-label="文字一覧に戻る">
                  <ArrowLeft size={18} />
                  一覧
                </button>
              )}
              {panel === 'text' && (
                <button onClick={state.addText}>
                  <Plus size={18} />
                  追加
                </button>
              )}
            </div>
            <div className="mobile-sheet-scroll" ref={sheet}>
              {panel === 'text' && (
                <>
                  <p className="mobile-hint">名前も応援メッセージも、ここから変更できます。</p>
                  <div className="mobile-text-list">
                    {project.layers
                      .filter((l): l is TextLayer => l.type === 'text')
                      .sort((a, b) => (a.binding === 'name' ? -1 : b.binding === 'name' ? 1 : 0))
                      .map((l) => (
                        <button key={l.id} onClick={() => choose(l)}>
                          <span>
                            <small>
                              {labels[l.binding || ''] || '追加した文字'}
                              {!l.visible && ' · 非表示'}
                              {l.locked && ' · ロック中'}
                            </small>
                            <strong>{l.text || '文字を入力'}</strong>
                          </span>
                          <ChevronRight size={20} />
                        </button>
                      ))}
                  </div>
                  <button className="wide" onClick={state.addText}>
                    <Plus size={20} />
                    テキストを追加
                  </button>
                </>
              )}
              {panel === 'object' &&
                (selected ? (
                  <QuickObject
                    layer={selected}
                    onFonts={() => setPanel('fonts')}
                    onAdvanced={() => setPanel('advanced')}
                  />
                ) : (
                  <button className="wide" onClick={() => setPanel('text')}>
                    文字一覧を開く
                  </button>
                ))}
              {panel === 'layers' && (
                <div className="mobile-text-list">
                  {[...project.layers].reverse().map((l) => (
                    <button key={l.id} onClick={() => choose(l)}>
                      <span>
                        <small>
                          {l.type === 'text' ? '文字' : '飾り・画像'}
                          {!l.visible && ' · 非表示'}
                          {l.locked && ' · ロック中'}
                        </small>
                        <strong>{l.type === 'text' ? l.text || l.name : l.name}</strong>
                      </span>
                      <ChevronRight size={20} />
                    </button>
                  ))}
                </div>
              )}
              {panel === 'random' && (
                <>
                  <label className="field">
                    <span>好きな雰囲気を選ぶ</span>
                    <select
                      aria-label="デザインのテイスト"
                      value={taste}
                      onChange={(e) => setTaste(e.target.value as Taste)}
                    >
                      {(
                        ['かっこいい', 'かわいい', '和風', '派手', '上品', 'おまかせ'] as Taste[]
                      ).map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </label>
                  <button
                    className="wide primary"
                    onClick={() => {
                      const next = randomProject(taste, project.racer);
                      next.id = project.id;
                      next.name = project.name;
                      next.customFonts = project.customFonts;
                      state.load(next);
                    }}
                  >
                    <Shuffle size={20} />
                    おまかせデザインを作る
                  </button>
                  <p className="mobile-hint">
                    何度でも作り直せます。「元に戻す」で前のデザインに戻れます。
                  </p>
                </>
              )}
              {panel === 'more' && (
                <div className="mobile-menu">
                  <button onClick={() => setPanel('palettes')}>
                    <Palette />
                    色の組み合わせ
                    <ChevronRight />
                  </button>
                  <button onClick={() => setPanel('random')}>
                    <Shuffle />
                    おまかせデザイン
                    <ChevronRight />
                  </button>
                  <button onClick={() => setPanel('layers')}>
                    <Layers />
                    文字・飾りの一覧
                    <ChevronRight />
                  </button>
                  <button onClick={() => setPanel('projects')}>
                    <FolderOpen />
                    保存したデザイン
                    <ChevronRight />
                  </button>
                  <button onClick={() => setPanel('advanced')}>
                    <SlidersHorizontal />
                    詳しい設定
                    <ChevronRight />
                  </button>
                  <button onClick={onHelp}>
                    <HelpCircle />
                    使い方
                    <ChevronRight />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </section>
      <nav className="mobile-tabbar" aria-label="編集メニュー">
        {(
          [
            ['templates', LayoutTemplate, 'デザイン'],
            ['text', Type, '文字'],
            ['backgrounds', Image, '背景'],
            ['decorations', Shapes, '飾り'],
            ['more', MoreHorizontal, 'その他'],
          ] as const
        ).map(([key, Icon, label]) => (
          <button
            key={key}
            aria-pressed={
              panel === key ||
              (key === 'text' &&
                (panel === 'fonts' || (panel === 'object' && selected?.type === 'text'))) ||
              (key === 'decorations' && panel === 'object' && selected?.type !== 'text')
            }
            onClick={() => setPanel(key)}
          >
            <Icon size={23} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
