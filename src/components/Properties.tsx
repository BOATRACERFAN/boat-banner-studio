import {
  Copy,
  Trash2,
  FlipHorizontal,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  AlignHorizontalJustifyCenter,
  AlignVerticalJustifyCenter,
  Group,
  Ungroup,
  Type,
  SlidersHorizontal,
} from 'lucide-react';
import { useEditor } from '../editor/store';
import { backgrounds } from '../catalog/backgrounds';
import { fonts } from '../catalog/fonts';
import { effects } from '../catalog/effects';
import { Color, Field, NumberField, Section, Slider, Toggle } from './Controls';
import type { Layer, TextStyle, Background, Racer } from '../types';
export function Properties({
  onFonts,
  onBackground,
}: {
  onFonts: () => void;
  onBackground: () => void;
}) {
  const state = useEditor(),
    { project, selection, commit, updateLayers, select } = state;
  const l = project.layers.find((l) => selection.includes(l.id)),
    multi = selection.length > 1;
  const update = (patch: Partial<Layer>) => updateLayers(selection, patch);
  const style = (patch: Partial<TextStyle>) =>
    commit((p) =>
      p.layers.forEach((l) => {
        if (selection.includes(l.id) && l.type === 'text' && !l.locked)
          Object.assign(l.style, patch);
      }),
    );
  const background = (patch: Partial<Background>) =>
    commit((p) => Object.assign(p.background, patch));
  const b = project.background;
  const chooseLayer = (layer: Layer, multi: boolean) => {
    const ids = layer.groupId
      ? project.layers.filter((l) => l.groupId === layer.groupId).map((l) => l.id)
      : [layer.id];
    select(
      multi
        ? selection.includes(layer.id)
          ? selection.filter((id) => !ids.includes(id))
          : [...new Set([...selection, ...ids])]
        : ids,
    );
  };
  return (
    <aside className="properties">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">INSPECTOR</span>
          <h2>{l ? (multi ? `${selection.length}個の要素` : l.name) : 'デザイン設定'}</h2>
        </div>
        <SlidersHorizontal size={17} />
      </div>
      <div className="property-scroll">
        <Section title="選手情報" open={!l}>
          {(['name', 'reading', 'number', 'branch', 'cheer'] as (keyof Racer)[]).map((k) => (
            <Field
              key={k}
              label={
                {
                  name: '選手名',
                  reading: 'ふりがな',
                  number: '登録番号',
                  branch: '支部',
                  cheer: '応援メッセージ',
                }[k]
              }
            >
              <input
                maxLength={k === 'cheer' ? 150 : 40}
                value={project.racer[k]}
                aria-label={
                  {
                    name: '選手名',
                    reading: 'ふりがな',
                    number: '登録番号',
                    branch: '支部',
                    cheer: '応援メッセージ',
                  }[k]
                }
                onChange={(e) => state.setRacer({ [k]: e.target.value })}
              />
            </Field>
          ))}
          <p className="hint">情報を変更すると、対応する文字レイヤーも更新されます。</p>
        </Section>
        {l && (
          <>
            <fieldset className="object-fields" disabled={l.locked}>
              <Section title="位置と変形">
                <div className="two-col">
                  <NumberField label="X" value={l.x} onChange={(x) => update({ x })} />
                  <NumberField label="Y" value={l.y} onChange={(y) => update({ y })} />
                  <NumberField
                    label="幅"
                    value={l.width}
                    min={1}
                    max={3000}
                    onChange={(width) => update({ width })}
                  />
                  <NumberField
                    label="高さ"
                    value={l.height}
                    min={1}
                    max={3000}
                    onChange={(height) => update({ height })}
                  />
                  <NumberField
                    label="横倍率"
                    value={l.scaleX}
                    min={0.01}
                    max={30}
                    step={0.05}
                    onChange={(scaleX) => update({ scaleX })}
                  />
                  <NumberField
                    label="縦倍率"
                    value={l.scaleY}
                    min={0.01}
                    max={30}
                    step={0.05}
                    onChange={(scaleY) => update({ scaleY })}
                  />
                </div>
                <Slider
                  label="回転"
                  value={l.rotation}
                  min={-180}
                  max={180}
                  suffix="°"
                  onChange={(rotation) => update({ rotation })}
                />
                <Slider
                  label="不透明度"
                  value={Math.round(l.opacity * 100)}
                  suffix="%"
                  onChange={(n) => update({ opacity: n / 100 })}
                />
                <div className="button-row">
                  <button title="左右反転" onClick={() => update({ flipped: !l.flipped })}>
                    <FlipHorizontal size={16} />
                    反転
                  </button>
                  <button title="左右中央に配置" onClick={() => state.align('centerX')}>
                    <AlignHorizontalJustifyCenter size={17} />
                  </button>
                  <button title="上下中央に配置" onClick={() => state.align('centerY')}>
                    <AlignVerticalJustifyCenter size={17} />
                  </button>
                </div>
                <div className="button-row">
                  {(['left', 'right', 'top', 'bottom'] as const).map((mode, i) => (
                    <button key={mode} onClick={() => state.align(mode)}>
                      {['左揃え', '右揃え', '上揃え', '下揃え'][i]}
                    </button>
                  ))}
                </div>
              </Section>
              {l.type === 'text' && (
                <>
                  <Section title="文字">
                    <Field label="テキスト">
                      <textarea
                        rows={2}
                        maxLength={l.binding ? 300 : 3000}
                        value={l.text}
                        aria-label="選択文字の内容"
                        onChange={(e) => {
                          const text = e.target.value;
                          commit((p) => {
                            const t = p.layers.find((a) => a.id === l.id);
                            if (t?.type === 'text') {
                              t.text = text;
                              if (t.binding) {
                                p.racer[t.binding] = text;
                                p.layers.forEach((a) => {
                                  if (a.type === 'text' && a.binding === t.binding) a.text = text;
                                });
                              }
                            }
                          });
                        }}
                      />
                    </Field>
                    <button className="font-picker" onClick={onFonts}>
                      <Type size={16} />
                      <span>
                        {project.customFonts.find((f) => f.family === l.fontFamily)?.name ||
                          l.fontFamily}
                      </span>
                      <span>変更 ›</span>
                    </button>
                    <Field label="フォントを選ぶ">
                      <select
                        aria-label="フォント"
                        value={l.fontFamily}
                        onChange={(e) => update({ fontFamily: e.target.value } as Partial<Layer>)}
                      >
                        {fonts.map((f) => (
                          <option key={f.family}>{f.family}</option>
                        ))}
                        {project.customFonts.map((f) => (
                          <option key={f.family} value={f.family}>
                            {f.name}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <div className="two-col">
                      <NumberField
                        label="文字サイズ"
                        value={l.fontSize}
                        min={6}
                        max={160}
                        onChange={(fontSize) => update({ fontSize } as Partial<Layer>)}
                      />
                      <Field label="文字揃え">
                        <select
                          value={l.align}
                          aria-label="文字揃え"
                          onChange={(e) => update({ align: e.target.value } as Partial<Layer>)}
                        >
                          <option value="left">左揃え</option>
                          <option value="center">中央</option>
                          <option value="right">右揃え</option>
                        </select>
                      </Field>
                    </div>
                    <Slider
                      label="文字間隔"
                      value={l.style.letterSpacing}
                      min={-5}
                      max={20}
                      step={0.5}
                      onChange={(letterSpacing) => style({ letterSpacing })}
                    />
                    <Slider
                      label="行間"
                      value={l.style.lineHeight}
                      min={0.7}
                      max={3}
                      step={0.1}
                      onChange={(lineHeight) => style({ lineHeight })}
                    />
                    <Toggle
                      label="斜体"
                      checked={l.style.italic}
                      onChange={(italic) => style({ italic })}
                    />
                  </Section>
                  <Section title="文字エフェクト">
                    <div className="effect-grid">
                      {effects.map((e) => (
                        <button key={e.id} title={e.name} onClick={() => style(e.style)}>
                          <strong
                            style={{
                              color: e.style.fill,
                              WebkitTextStroke: `1px ${e.style.stroke}`,
                              textShadow: `2px 2px 3px ${e.style.shadowColor}`,
                            }}
                          >
                            Aa
                          </strong>
                          <span>{e.name}</span>
                        </button>
                      ))}
                    </div>
                    <div className="two-col">
                      <Color
                        label="文字色"
                        value={l.style.fill}
                        onChange={(fill) => style({ fill })}
                      />
                      <Color
                        label="フチ色"
                        value={l.style.stroke}
                        onChange={(stroke) => style({ stroke })}
                      />
                    </div>
                    <Slider
                      label="フチ幅"
                      value={l.style.strokeWidth}
                      max={16}
                      onChange={(strokeWidth) => style({ strokeWidth })}
                    />
                    <Toggle
                      label="グラデーション"
                      checked={!!l.style.gradient}
                      onChange={(on) => style({ gradient: on ? '#60dbe4' : '' })}
                    />
                    {!!l.style.gradient && (
                      <Color
                        label="グラデーション終点"
                        value={l.style.gradient}
                        onChange={(gradient) => style({ gradient })}
                      />
                    )}
                    <Slider
                      label="二重フチ幅"
                      value={l.style.outerWidth}
                      max={16}
                      onChange={(outerWidth) => style({ outerWidth })}
                    />
                    {!!l.style.outerWidth && (
                      <Color
                        label="外側のフチ色"
                        value={l.style.outerStroke}
                        onChange={(outerStroke) => style({ outerStroke })}
                      />
                    )}
                    <Color
                      label="影・グロー色"
                      value={l.style.shadowColor}
                      onChange={(shadowColor) => style({ shadowColor })}
                    />
                    <Slider
                      label="影の角度"
                      value={l.style.shadowAngle}
                      max={360}
                      suffix="°"
                      onChange={(shadowAngle) => style({ shadowAngle })}
                    />
                    <Slider
                      label="影の距離"
                      value={l.style.shadowDistance}
                      max={40}
                      onChange={(shadowDistance) => style({ shadowDistance })}
                    />
                    <Slider
                      label="影のぼかし"
                      value={l.style.shadowBlur}
                      max={40}
                      onChange={(shadowBlur) => style({ shadowBlur })}
                    />
                    <Slider
                      label="グロー強度"
                      value={l.style.glow}
                      max={40}
                      onChange={(glow) => style({ glow })}
                    />
                  </Section>
                </>
              )}
              {l.type === 'decoration' && (
                <Section title="装飾の色">
                  <Color
                    label="素材色"
                    value={l.color}
                    onChange={(color) => update({ color } as Partial<Layer>)}
                  />
                </Section>
              )}
            </fieldset>
            <div className="object-actions">
              <button onClick={state.duplicate}>
                <Copy size={15} />
                複製
              </button>
              <button onClick={state.remove} disabled={l.locked}>
                <Trash2 size={15} />
                削除
              </button>
              <button
                onClick={() =>
                  commit((p) =>
                    p.layers.forEach((a) => {
                      if (selection.includes(a.id)) a.locked = !l.locked;
                    }),
                  )
                }
              >
                {l.locked ? <Unlock size={15} /> : <Lock size={15} />}{' '}
                {l.locked ? '解除' : 'ロック'}
              </button>
              <button
                onClick={() =>
                  commit((p) =>
                    p.layers.forEach((a) => {
                      if (selection.includes(a.id)) a.visible = !l.visible;
                    }),
                  )
                }
              >
                {l.visible ? <EyeOff size={15} /> : <Eye size={15} />}{' '}
                {l.visible ? '非表示' : '表示'}
              </button>
            </div>
            <div className="button-row">
              <button disabled={!multi} onClick={state.group}>
                <Group size={16} />
                グループ
              </button>
              <button disabled={!l.groupId} onClick={state.ungroup}>
                <Ungroup size={16} />
                解除
              </button>
            </div>
            <div className="button-row">
              {(['front', 'up', 'down', 'back'] as const).map((m, i) => {
                const I = [ChevronsUp, ArrowUp, ArrowDown, ChevronsDown][i];
                return (
                  <button
                    title={['最前面', '前へ', '後ろへ', '最背面'][i]}
                    aria-label={['最前面', '前へ', '後ろへ', '最背面'][i]}
                    key={m}
                    onClick={() => state.order(m)}
                  >
                    <I size={17} />
                  </button>
                );
              })}
            </div>
          </>
        )}
        <Section title="背景設定" open={!l}>
          <button className="wide" onClick={onBackground}>
            {backgrounds.find((a) => a.id === b.presetId)?.name} <span>素材を選ぶ ›</span>
          </button>
          <div className="two-col">
            <Color label="背景色" value={b.color} onChange={(color) => background({ color })} />
            <Color
              label="アクセント"
              value={b.accent}
              onChange={(accent) => background({ accent })}
            />
          </div>
          <Slider
            label="明るさ"
            value={b.brightness}
            min={0.2}
            max={2}
            step={0.05}
            onChange={(brightness) => background({ brightness })}
          />
          <Slider
            label="模様の密度"
            value={b.density}
            min={0.1}
            max={3}
            step={0.1}
            onChange={(density) => background({ density })}
          />
          <Slider
            label="グラデーション方向"
            value={b.direction}
            max={360}
            suffix="°"
            onChange={(direction) => background({ direction })}
          />
          <Toggle
            label="背景を左右反転"
            checked={b.flipped}
            onChange={(flipped) => background({ flipped })}
          />
          <Toggle
            label="背景を透明にする"
            checked={b.transparent}
            onChange={(transparent) => background({ transparent })}
          />
          {b.image && (
            <>
              <p className="hint">背景画像はキャンバスの外を切り取って表示します。</p>
              <div className="two-col">
                <NumberField
                  label="画像 X"
                  value={b.imageX}
                  onChange={(imageX) => background({ imageX })}
                />
                <NumberField
                  label="画像 Y"
                  value={b.imageY}
                  onChange={(imageY) => background({ imageY })}
                />
              </div>
              <Slider
                label="背景画像倍率"
                value={b.imageScale}
                min={0.01}
                max={10}
                step={0.01}
                onChange={(imageScale) => background({ imageScale })}
              />
              <Slider
                label="背景画像の不透明度"
                value={b.imageOpacity * 100}
                onChange={(n) => background({ imageOpacity: n / 100 })}
              />
              <button className="wide" onClick={() => background({ image: undefined })}>
                アップロード画像を外す
              </button>
            </>
          )}
        </Section>
        <Section title={`レイヤー · ${project.layers.length}`}>
          <p className="hint">Shift＋クリックで複数選択</p>
          <div className="layer-list">
            {[...project.layers].reverse().map((a) => (
              <div className={`layer-row ${selection.includes(a.id) ? 'selected' : ''}`} key={a.id}>
                <input
                  type="checkbox"
                  aria-label={`${a.name}を複数選択`}
                  checked={selection.includes(a.id)}
                  onChange={() => chooseLayer(a, true)}
                />
                <button className="layer-name" onClick={(e) => chooseLayer(a, e.shiftKey)}>
                  {a.type === 'text' ? (
                    <Type size={14} />
                  ) : a.type === 'image' ? (
                    <span>▧</span>
                  ) : (
                    <span>✦</span>
                  )}
                  <span>{a.type === 'text' ? a.text || a.name : a.name}</span>
                  {a.groupId && <Group size={12} />}
                </button>
                <button
                  title={a.visible ? '非表示にする' : '表示する'}
                  aria-label={`${a.name}の表示切替`}
                  onClick={() =>
                    commit((p) => {
                      p.layers.find((l) => l.id === a.id)!.visible = !a.visible;
                    })
                  }
                >
                  {a.visible ? <Eye size={13} /> : <EyeOff size={13} />}
                </button>
                <button
                  title={a.locked ? 'ロック解除' : 'ロック'}
                  aria-label={`${a.name}のロック切替`}
                  onClick={() =>
                    commit((p) => {
                      p.layers.find((l) => l.id === a.id)!.locked = !a.locked;
                    })
                  }
                >
                  {a.locked ? <Lock size={13} /> : <Unlock size={13} />}
                </button>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </aside>
  );
}
