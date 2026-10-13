import { useState } from 'react';
import type { ReactNode } from 'react';
import { X, Download, Check, Info } from 'lucide-react';
import type Konva from 'konva';
import { useEditor } from '../editor/store';
import { downloadImage } from '../lib/export/image';
import type { ExportOptions } from '../lib/export/image';
import { Color, Field, Slider, Toggle } from './Controls';
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <header>
          <h2>{title}</h2>
          <button onClick={onClose} title="閉じる" aria-label="閉じる">
            <X size={20} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
export function ExportDialog({
  stage,
  onClose,
  fontError,
  loading,
  warnings,
}: {
  stage: Konva.Stage | null;
  onClose: () => void;
  fontError: string;
  loading: boolean;
  warnings: string[];
}) {
  const project = useEditor((s) => s.project),
    [options, setOptions] = useState<ExportOptions>({
      format: 'png',
      quality: 95,
      transparent: project.background.transparent,
      jpegColor: project.background.color,
    }),
    [checked, setChecked] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [done, setDone] = useState(false);
  const update = (p: Partial<ExportOptions>) => {
    setOptions((o) => ({ ...o, ...p }));
    setDone(false);
  };
  return (
    <Modal
      title="横断幕を書き出す"
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <div className="modal-body">
        <div className="export-spec">
          <span>完成サイズ</span>
          <strong>
            960 × 192 <small>px</small>
          </strong>
          <span>5 : 1 · 表示倍率に依存しません</span>
        </div>
        <div className="racer-confirm">
          <span>選手情報の最終確認</span>
          <strong>
            {project.racer.name} <small>{project.racer.reading}</small>
          </strong>
          <p>
            登録番号 <b>{project.racer.number}</b>　／　支部 <b>{project.racer.branch}</b>
          </p>
          <p>{project.racer.cheer}</p>
        </div>
        <div className="two-col">
          <Field label="ファイル形式">
            <select
              aria-label="ファイル形式"
              value={options.format}
              onChange={(e) => update({ format: e.target.value as 'png' | 'jpeg' })}
            >
              <option value="png">PNG（透過対応）</option>
              <option value="jpeg">JPEG</option>
            </select>
          </Field>
          <div className="file-size">
            <Info size={15} />
            <span>
              選択枠・ガイドは
              <br />
              画像に含まれません
            </span>
          </div>
        </div>
        {options.format === 'png' ? (
          <Toggle
            label="背景を透明にして出力"
            checked={options.transparent}
            onChange={(transparent) => update({ transparent })}
          />
        ) : (
          <>
            <Slider
              label="JPEG品質"
              value={options.quality}
              min={80}
              max={100}
              suffix="%"
              onChange={(quality) => update({ quality })}
            />
            <Color
              label="JPEGの合成背景色"
              value={options.jpegColor}
              onChange={(jpegColor) => update({ jpegColor })}
            />
            <Toggle
              label="デザイン背景を省いて合成色を使う"
              checked={options.transparent}
              onChange={(transparent) => update({ transparent })}
            />
          </>
        )}
        {warnings.length > 0 && (
          <div className="warning">
            <strong>デザインを確認してください</strong>
            {warnings.map((w, i) => (
              <p key={i}>{w}</p>
            ))}
          </div>
        )}
        <div className="checklist">
          <strong>画像を応募する前の確認事項</strong>
          <ul>
            <li>選手名・登録番号・支部の誤記がないこと。</li>
            <li>アップロードした画像・フォントの利用許諾があること。</li>
            <li>応募先の最新の規約・サイズ・禁止表現を確認すること。</li>
            <li>公式ロゴ、既存キャラクター、無許諾の選手写真を使っていないこと。</li>
          </ul>
          <p>このアプリは素材の権利状態や応募条件への適合を保証しません。</p>
        </div>
        <label className="confirm-check">
          <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
          <span>選手情報と確認事項を確認しました</span>
        </label>
        {fontError && <p className="error">{fontError}</p>}
        {loading && <p className="hint">日本語フォントを読み込んでいます…</p>}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button
          className="wide primary export-button"
          disabled={!checked || busy || loading || !!fontError || !stage}
          onClick={async () => {
            if (!stage) return;
            setBusy(true);
            setError('');
            try {
              await downloadImage(stage, project, options);
              setDone(true);
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          {done ? <Check size={18} /> : <Download size={18} />}{' '}
          {busy
            ? '画像を生成しています…'
            : done
              ? '保存しました · もう一度保存'
              : '画像をダウンロード'}
        </button>
      </div>
    </Modal>
  );
}
export function HelpDialog({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="使い方とショートカット" onClose={onClose}>
      <div className="modal-body">
        <ol className="help-steps">
          <li>テンプレートを選ぶか、背景・素材を自由に組み合わせます。</li>
          <li>右側の「選手情報」で名前や応援文を変更します。</li>
          <li>
            キャンバスの要素を選び、ドラッグやハンドルで調整します。文字はダブルクリックで直接入力できます。
          </li>
          <li>
            プロジェクトを保存すると、あとから編集できます。画像のダウンロード時は選手情報を確認してください。
          </li>
        </ol>
        <dl className="shortcuts">
          {[
            ['Ctrl / ⌘ + Z', '元に戻す'],
            ['Ctrl / ⌘ + Shift + Z / Y', 'やり直す'],
            ['Ctrl / ⌘ + D', '複製'],
            ['Ctrl / ⌘ + S', 'プロジェクト保存'],
            ['Ctrl / ⌘ + A', '表示中の要素を選択'],
            ['Shift + クリック', '複数選択'],
            ['矢印 / Shift + 矢印', '1px / 10px移動'],
            ['Delete / Backspace', '選択要素を削除'],
            ['Esc', '選択解除・パネルを閉じる'],
          ].map(([key, desc]) => (
            <div key={key}>
              <dt>{key}</dt>
              <dd>{desc}</dd>
            </div>
          ))}
        </dl>
        <p className="hint">
          複数選択では要素をまとめて移動・変形できます。ロックした要素は動きません。スマートフォンでは下部の「素材」「設定」からパネルを開きます。
        </p>
        <p className="hint">
          日本語フォントはGoogle
          Fontsから必要時に読み込みます。通信に失敗したときは上部の「再試行」を押してください。フォントの読み込みが完了するまで画像出力は止めています。
        </p>
        <a href="https://developers.google.com/fonts/faq" target="_blank" rel="noreferrer">
          Google Fontsのライセンスについて ↗
        </a>
      </div>
    </Modal>
  );
}
