import { useCallback, useEffect, useRef, useState } from 'react';
import Konva from 'konva';
import {
  LayoutTemplate,
  Image,
  Shapes,
  Type,
  Palette,
  FolderOpen,
  Undo2,
  Redo2,
  Download,
  Save,
  HelpCircle,
  ZoomIn,
  ZoomOut,
  Maximize,
  Shuffle,
  ChevronDown,
  Check,
  PanelLeft,
  SlidersHorizontal,
  X,
  Flag,
  RotateCcw,
  MousePointer2,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import { Library, tabNames } from './components/Library';
import type { Tab } from './components/Library';
import { Properties } from './components/Properties';
import { ExportDialog, HelpDialog, Modal } from './components/Dialogs';
import { useEditor } from './editor/store';
import { BannerScene } from './editor/Scene';
import { createTemplate, initialRacer, randomProject, templates, uid } from './catalog/templates';
import { useProjectFonts } from './lib/fonts';
import { readProjects, saveProjects } from './lib/project';
import { inspectDesign } from './lib/guides';
import type { Taste, TextLayer } from './types';
const nav: [Tab, typeof Type][] = [
  ['templates', LayoutTemplate],
  ['backgrounds', Image],
  ['decorations', Shapes],
  ['text', Type],
  ['palettes', Palette],
  ['projects', FolderOpen],
];
export default function App() {
  const { project, notice, saveStatus, setNotice, select, commit, load, undo, redo, past, future } =
    useEditor();
  const [tab, setTab] = useState<Tab>('templates'),
    [drawer, setDrawer] = useState<'library' | 'properties' | null>(null),
    [zoom, setZoom] = useState(0.75),
    [guides, setGuides] = useState(false),
    [dialog, setDialog] = useState<'export' | 'help' | 'save' | 'reset' | null>(null),
    [taste, setTaste] = useState<Taste>('かっこいい'),
    [editing, setEditing] = useState<TextLayer | null>(null),
    [editValue, setEditValue] = useState(''),
    [saveName, setSaveName] = useState(project.name),
    [saveCopy, setSaveCopy] = useState(false),
    [warnings, setWarnings] = useState<string[]>([]);
  const stage = useRef<Konva.Stage>(null),
    workspace = useRef<HTMLDivElement>(null),
    fonts = useProjectFonts(project),
    [workspaceWidth, setWorkspaceWidth] = useState(960);
  useEffect(() => {
    if (!workspace.current) return;
    const ro = new ResizeObserver(([entry]) => {
      setWorkspaceWidth(entry.contentRect.width);
      setZoom(Math.min(1, (entry.contentRect.width - 72) / 960));
    });
    ro.observe(workspace.current);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => setWarnings(inspectDesign(project, stage.current)), 150);
    return () => clearTimeout(timer);
  }, [project, fonts.revision]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 6000);
    return () => clearTimeout(timer);
  }, [notice, setNotice]);
  const openSave = useCallback(() => {
    setSaveName(useEditor.getState().project.name);
    setSaveCopy(false);
    setDialog('save');
  }, []);
  const openLibrary = (next: Tab) => {
    setTab(next);
    if (window.innerWidth < 1100) setDrawer('library');
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const editingInput = (e.target as HTMLElement).closest(
        'input,textarea,select,[contenteditable]',
      );
      if (e.key === 'Escape') {
        setDialog(null);
        setEditing(null);
        setDrawer(null);
        select([]);
        return;
      }
      if (editingInput || dialog || editing) return;
      const mod = e.ctrlKey || e.metaKey;
      const s = useEditor.getState();
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        e.shiftKey ? s.redo() : s.undo();
      } else if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        s.redo();
      } else if (mod && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        s.duplicate();
      } else if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault();
        openSave();
      } else if (mod && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        s.select(s.project.layers.filter((l) => l.visible && !l.locked).map((l) => l.id));
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        s.remove();
      } else if (
        ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key) &&
        s.selection.length
      ) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        s.commit((p) =>
          p.layers.forEach((l) => {
            if (!s.selection.includes(l.id) || l.locked) return;
            if (e.key === 'ArrowLeft') l.x -= step;
            if (e.key === 'ArrowRight') l.x += step;
            if (e.key === 'ArrowUp') l.y -= step;
            if (e.key === 'ArrowDown') l.y += step;
          }),
        );
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dialog, editing, select, openSave]);
  const save = () => {
    try {
      const next = {
        ...project,
        id: saveCopy ? uid() : project.id,
        name: saveName.trim() || `${project.racer.name}の横断幕`,
        updatedAt: new Date().toISOString(),
      };
      const list = readProjects(),
        others = list.filter((p) => p.id !== next.id);
      if (others.length >= 30)
        throw new Error('保存できるプロジェクトは30件までです。不要なものを削除してください。');
      saveProjects([next, ...others]);
      commit((p) => {
        p.id = next.id;
        p.name = next.name;
        p.updatedAt = next.updatedAt;
      });
      setDialog(null);
      setNotice('プロジェクトを保存しました。');
    } catch (e) {
      setNotice((e as Error).message);
    }
  };
  const applyEdit = () => {
    if (!editing) return;
    commit((p) => {
      const l = p.layers.find((l) => l.id === editing.id);
      if (l?.type === 'text') {
        l.text = editValue;
        if (l.binding) {
          p.racer[l.binding] = editValue;
          p.layers.forEach((t) => {
            if (t.type === 'text' && t.binding === l.binding) t.text = editValue;
          });
        }
      }
    });
    setEditing(null);
  };
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">
            <Flag size={20} />
          </div>
          <div>
            <strong>
              BOAT BANNER<span> STUDIO</span>
            </strong>
            <small>応援を、かたちに。</small>
          </div>
        </div>
        <div className="project-title">
          <input
            aria-label="プロジェクト名"
            value={project.name}
            maxLength={100}
            onChange={(e) =>
              commit((p) => {
                p.name = e.target.value;
              })
            }
          />
          <ChevronDown size={13} />
        </div>
        <div className="top-actions">
          <span className={`save-status ${saveStatus === '保存容量不足' ? 'error' : ''}`}>
            <Check size={12} />
            {saveStatus}
          </span>
          <button
            className="icon-button"
            title="使い方"
            aria-label="使い方"
            onClick={() => setDialog('help')}
          >
            <HelpCircle size={19} />
          </button>
          <button className="save-button" onClick={openSave}>
            <Save size={15} />
            <span>保存</span>
          </button>
          <button className="primary download-button" onClick={() => setDialog('export')}>
            <Download size={16} />
            <span>ダウンロード</span>
          </button>
        </div>
      </header>
      <div className="editor-layout">
        <nav className="nav-rail" aria-label="素材カテゴリ">
          {nav.map(([key, Icon]) => (
            <button
              className={tab === key ? 'active' : ''}
              key={key}
              onClick={() => openLibrary(key)}
            >
              <Icon size={21} />
              <span>{tabNames[key]}</span>
            </button>
          ))}
          <div className="rail-bottom">
            <span>960×192</span>
            <small>BANNER</small>
          </div>
        </nav>
        <div className={`library-container ${drawer === 'library' ? 'open' : ''}`}>
          <button
            className="drawer-close"
            aria-label="素材パネルを閉じる"
            onClick={() => setDrawer(null)}
          >
            <X size={19} />
          </button>
          <Library tab={tab} onSave={openSave} onTabChange={setTab} />
        </div>
        <main className="canvas-workspace" ref={workspace}>
          <div className="workspace-top">
            <div>
              <span className="eyebrow">YOUR CHEERING BANNER</span>
              <h1>
                想いが届く、
                <br className="mobile-break" />
                一枚をつくろう。
              </h1>
            </div>
            <div className="history">
              <button
                aria-label="元に戻す"
                title="元に戻す (Ctrl+Z)"
                onClick={undo}
                disabled={!past.length}
              >
                <Undo2 size={18} />
              </button>
              <button
                aria-label="やり直す"
                title="やり直す (Ctrl+Shift+Z)"
                onClick={redo}
                disabled={!future.length}
              >
                <Redo2 size={18} />
              </button>
              <span />
              <button
                aria-label="初期状態に戻す"
                title="初期状態に戻す"
                onClick={() => setDialog('reset')}
              >
                <RotateCcw size={16} />
              </button>
            </div>
          </div>
          <div className="design-toolbar">
            <div className="taste-select">
              <Shuffle size={15} />
              <select
                aria-label="デザインのテイスト"
                value={taste}
                onChange={(e) => setTaste(e.target.value as Taste)}
              >
                {(['かっこいい', 'かわいい', '和風', '派手', '上品', 'おまかせ'] as Taste[]).map(
                  (t) => (
                    <option key={t}>{t}</option>
                  ),
                )}
              </select>
            </div>
            <button
              className="random-button"
              onClick={() => {
                const next = randomProject(taste, project.racer);
                next.id = project.id;
                next.name = project.name;
                next.customFonts = project.customFonts;
                load(next);
                setNotice(`${taste}デザインを生成しました。自由に編集できます。`);
              }}
            >
              おまかせデザイン <span>↗</span>
            </button>
            <button
              className={`guide-toggle ${guides ? 'active' : ''}`}
              onClick={() => setGuides(!guides)}
            >
              <ShieldCheck size={14} />
              ガイド
            </button>
          </div>
          <div className="artboard-zone">
            <div className="artboard-meta">
              <span>
                横断幕 <b>01</b>
              </span>
              <span>
                960 × 192 px <span className="dimension-dot">·</span> 5 : 1
              </span>
            </div>
            <div className="canvas-scroll">
              <div
                className="canvas-frame checker"
                style={{ width: 960 * zoom, height: 192 * zoom }}
              >
                <BannerScene
                  project={project}
                  zoom={zoom}
                  stageRef={stage}
                  guides={guides}
                  revision={fonts.revision}
                  onEdit={(l) => {
                    setEditing(l);
                    setEditValue(l.text);
                  }}
                />
              </div>
            </div>
            <div className="artboard-caption">
              <MousePointer2 size={13} />
              <span>クリックで選択 · ダブルクリックで文字編集</span>
            </div>
          </div>
          <div className="workspace-bottom">
            <div className="zoom-control">
              <button aria-label="縮小表示" onClick={() => setZoom((z) => Math.max(0.2, z - 0.1))}>
                <ZoomOut size={16} />
              </button>
              <input
                type="range"
                aria-label="プレビュー倍率"
                min={20}
                max={200}
                step={5}
                value={zoom * 100}
                onChange={(e) => setZoom(Number(e.target.value) / 100)}
              />
              <span>{Math.round(zoom * 100)}%</span>
              <button aria-label="拡大表示" onClick={() => setZoom((z) => Math.min(2, z + 0.1))}>
                <ZoomIn size={16} />
              </button>
              <button
                title="画面に合わせる"
                aria-label="画面に合わせる"
                onClick={() => setZoom(Math.min(1, (workspaceWidth - 72) / 960))}
              >
                <Maximize size={15} />
              </button>
            </div>
            <div className="font-status">
              {fonts.loading ? (
                <>
                  <span className="spinner" />
                  フォント読込中
                </>
              ) : fonts.error ? (
                <button className="error" onClick={fonts.retry}>
                  フォント再試行
                </button>
              ) : (
                <>
                  <span className="status-dot" />
                  書き出し準備完了
                </>
              )}
            </div>
          </div>
          {fonts.error && (
            <div className="font-error" role="alert">
              {fonts.error}
              <button onClick={fonts.retry}>再試行</button>
            </div>
          )}
          {guides && warnings.length > 0 && (
            <div className="design-warnings">
              <strong>ガイドからのチェック</strong>
              {warnings.slice(0, 5).map((w, i) => (
                <p key={i}>{w}</p>
              ))}
            </div>
          )}
          <div className="workspace-tip">
            <div className="tip-icon">✦</div>
            <div>
              <strong>ひとつの声が、大きな追い風になる。</strong>
              <p>素材を重ねて、色を選んで。あなたの応援を自由にデザイン。</p>
            </div>
            <button onClick={() => openLibrary('decorations')}>装飾を見てみる ↗</button>
          </div>
          <footer className="workspace-footer">
            <span>オリジナル素材・Google Fonts使用</span>
            <span>公式サービスではありません</span>
          </footer>
        </main>
        <div className={`properties-container ${drawer === 'properties' ? 'open' : ''}`}>
          <button
            className="drawer-close"
            aria-label="設定パネルを閉じる"
            onClick={() => setDrawer(null)}
          >
            <X size={19} />
          </button>
          <Properties
            onFonts={() => openLibrary('text')}
            onBackground={() => openLibrary('backgrounds')}
          />
        </div>
      </div>
      <div className="mobile-controls">
        <button onClick={() => setDrawer(drawer === 'library' ? null : 'library')}>
          <PanelLeft size={18} />
          素材
        </button>
        <button
          onClick={() => {
            setDrawer(drawer === 'properties' ? null : 'properties');
          }}
        >
          <SlidersHorizontal size={18} />
          設定
        </button>
        <button onClick={() => setDrawer('properties')}>
          <Layers size={18} />
          レイヤー
        </button>
        <button onClick={() => setDialog('export')}>
          <Download size={18} />
          出力
        </button>
      </div>
      {drawer && (
        <button
          aria-label="パネルを閉じる"
          className="drawer-scrim"
          onClick={() => setDrawer(null)}
        />
      )}
      {notice && (
        <div className="toast" role="status">
          <Check size={16} />
          <span>{notice}</span>
          <button onClick={() => setNotice('')} aria-label="通知を閉じる">
            <X size={14} />
          </button>
        </div>
      )}
      {dialog === 'export' && (
        <ExportDialog
          stage={stage.current}
          onClose={() => setDialog(null)}
          fontError={fonts.error}
          loading={fonts.loading}
          warnings={warnings}
        />
      )}
      {dialog === 'help' && <HelpDialog onClose={() => setDialog(null)} />}
      {dialog === 'save' && (
        <Modal title="プロジェクトを保存" onClose={() => setDialog(null)}>
          <div className="modal-body">
            <label className="field">
              <span>プロジェクト名</span>
              <input
                autoFocus
                value={saveName}
                maxLength={100}
                onChange={(e) => setSaveName(e.target.value)}
              />
            </label>
            <label className="confirm-check">
              <input
                type="checkbox"
                checked={saveCopy}
                onChange={(e) => setSaveCopy(e.target.checked)}
              />
              別のプロジェクトとして保存
            </label>
            <p className="hint">
              このブラウザーに保存します。画像や独自フォントを含む大きなデータは、JSONでも保管してください。
            </p>
            <button className="wide primary" onClick={save}>
              <Save size={16} />
              保存する
            </button>
          </div>
        </Modal>
      )}
      {dialog === 'reset' && (
        <Modal title="初期状態に戻す" onClose={() => setDialog(null)}>
          <div className="modal-body">
            <p>
              現在の編集を初期デザインに戻します。元に戻す操作で復元できます。保存済みプロジェクトは残ります。
            </p>
            <button
              className="wide primary"
              onClick={() => {
                load(createTemplate(templates[2], initialRacer));
                setDialog(null);
              }}
            >
              初期状態に戻す
            </button>
          </div>
        </Modal>
      )}
      {editing && (
        <Modal title="文字を直接編集" onClose={() => setEditing(null)}>
          <div className="modal-body">
            <textarea
              autoFocus
              aria-label="文字を直接編集"
              rows={4}
              value={editValue}
              maxLength={editing.binding ? 300 : 3000}
              onChange={(e) => setEditValue(e.target.value)}
            />
            <p className="hint">選手情報に紐づく文字は、情報欄にも反映されます。</p>
            <button className="wide primary" onClick={applyEdit}>
              反映する
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
