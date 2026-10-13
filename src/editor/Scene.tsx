import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Stage,
  Layer as KLayer,
  Group,
  Image as KImage,
  Text,
  Transformer,
  Rect,
  Line,
} from 'react-konva';
import Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { Layer, Project, TextLayer } from '../types';
import { WIDTH, HEIGHT } from '../types';
import { backgroundSvg, decorationSvg, svgUrl } from './artwork';
import { useImage } from '../lib/images';
import { fontWeight } from '../lib/fonts';
import { useEditor } from './store';
function StyledText({ layer: l }: { layer: TextLayer }) {
  const s = l.style,
    rad = (s.shadowAngle * Math.PI) / 180,
    dx = Math.cos(rad) * s.shadowDistance,
    dy = Math.sin(rad) * s.shadowDistance;
  const common = {
    text: l.text,
    width: l.width,
    height: l.height,
    fontFamily: `${l.fontFamily}, Noto Sans JP`,
    fontSize: l.fontSize,
    fontStyle: `${s.italic ? 'italic ' : ''}${fontWeight(l.fontFamily)}`,
    lineHeight: s.lineHeight,
    letterSpacing: s.letterSpacing,
    align: l.align,
    verticalAlign: 'middle',
    wrap: 'none',
    ellipsis: false,
    padding: Math.max(s.outerWidth + s.strokeWidth, 2),
    listening: false,
  };
  const fill = s.gradient
    ? {
        fillLinearGradientStartPoint: { x: 0, y: 0 },
        fillLinearGradientEndPoint: { x: 0, y: l.height },
        fillLinearGradientColorStops:
          s.effect === 'metal'
            ? [0, s.fill, 0.35, s.gradient, 0.47, s.fill, 0.6, s.gradient, 1, s.fill]
            : [0, s.fill, 1, s.gradient],
      }
    : { fill: s.fill };
  return (
    <>
      {(s.effect === 'long' || s.effect === 'extrude') &&
        Array.from({ length: Math.ceil(s.shadowDistance) }, (_, i) => (
          <Text
            key={i}
            {...common}
            x={dx * (1 - i / Math.max(1, s.shadowDistance))}
            y={dy * (1 - i / Math.max(1, s.shadowDistance))}
            fill={s.shadowColor}
            stroke={s.shadowColor}
            strokeWidth={s.strokeWidth}
          />
        ))}
      {s.effect === 'emboss' && (
        <Text
          {...common}
          x={-1}
          y={-1}
          fill="#ffffff"
          stroke="#ffffff"
          strokeWidth={s.strokeWidth + 1}
        />
      )}
      {!!s.outerWidth && (
        <Text
          {...common}
          fill={s.fill}
          stroke={s.outerStroke}
          strokeWidth={(s.strokeWidth + s.outerWidth) * 2}
          fillAfterStrokeEnabled
        />
      )}
      <Text
        {...common}
        {...fill}
        stroke={s.stroke}
        strokeWidth={s.strokeWidth * 2}
        fillAfterStrokeEnabled
        shadowColor={s.shadowColor}
        shadowOffsetX={dx}
        shadowOffsetY={dy}
        shadowBlur={Math.max(s.shadowBlur, s.glow)}
        shadowOpacity={1}
        shadowForStrokeEnabled={false}
      />
    </>
  );
}
function ObjectNode({
  layer: l,
  select,
  edit,
  onGuides,
  onDragEnd,
  revision,
}: {
  layer: Layer;
  select: (id: string, e: KonvaEventObject<MouseEvent | TouchEvent>) => void;
  edit: (l: TextLayer) => void;
  onGuides: (x: boolean, y: boolean) => void;
  onDragEnd: () => void;
  revision: number;
}) {
  const src = useMemo(
    () =>
      l.type === 'decoration'
        ? svgUrl(decorationSvg(l.assetId, l.color))
        : l.type === 'image'
          ? l.src
          : undefined,
    [l],
  );
  const image = useImage(src);
  const start = useRef<{ x: number; y: number; selected: Layer[] }>({ x: 0, y: 0, selected: [] });
  return (
    <Group
      id={l.id}
      name="banner-object"
      x={l.x}
      y={l.y}
      width={l.width}
      height={l.height}
      scaleX={l.scaleX}
      scaleY={l.scaleY}
      rotation={l.rotation}
      opacity={l.opacity}
      visible={l.visible}
      draggable={!l.locked}
      onClick={(e) => {
        e.cancelBubble = true;
        select(l.id, e);
      }}
      onTap={(e) => {
        e.cancelBubble = true;
        select(l.id, e);
      }}
      onDblClick={() => l.type === 'text' && !l.locked && edit(l)}
      onDblTap={() => l.type === 'text' && !l.locked && edit(l)}
      onDragStart={(e) => {
        const state = useEditor.getState();
        if (!state.selection.includes(l.id)) select(l.id, e);
        const ids = useEditor.getState().selection;
        start.current = {
          x: l.x,
          y: l.y,
          selected: state.project.layers.filter((a) => ids.includes(a.id) && !a.locked),
        };
      }}
      onDragMove={(e) => {
        const node = e.target;
        let x = node.x(),
          y = node.y();
        const w = l.width * l.scaleX,
          h = l.height * l.scaleY;
        const snapX = Math.abs(x + w / 2 - WIDTH / 2) < 5,
          snapY = Math.abs(y + h / 2 - HEIGHT / 2) < 5;
        if (snapX) x = (WIDTH - w) / 2;
        if (snapY) y = (HEIGHT - h) / 2;
        node.position({ x, y });
        onGuides(snapX, snapY);
        for (const other of start.current.selected) {
          if (other.id === l.id) continue;
          node
            .getStage()
            ?.findOne(`#${other.id}`)
            ?.position({ x: other.x + x - start.current.x, y: other.y + y - start.current.y });
        }
      }}
      onDragEnd={(e) => {
        const dx = e.target.x() - start.current.x,
          dy = e.target.y() - start.current.y;
        useEditor.getState().commit((p) => {
          for (const original of start.current.selected) {
            const target = p.layers.find((a) => a.id === original.id);
            if (target) {
              target.x = original.x + dx;
              target.y = original.y + dy;
            }
          }
        });
        onDragEnd();
      }}
    >
      <Rect width={l.width} height={l.height} fill="rgba(0,0,0,0)" />
      <Group scaleX={l.flipped ? -1 : 1} x={l.flipped ? l.width : 0}>
        {l.type === 'text' ? (
          <StyledText key={revision} layer={l} />
        ) : (
          image && <KImage image={image} width={l.width} height={l.height} listening={false} />
        )}
      </Group>
    </Group>
  );
}
export function BannerScene({
  project,
  zoom,
  stageRef,
  guides,
  revision,
  onEdit,
  touch = false,
  pan = false,
  onSelect,
}: {
  project: Project;
  zoom: number;
  stageRef: React.RefObject<Konva.Stage | null>;
  guides: boolean;
  revision: number;
  onEdit: (l: TextLayer) => void;
  touch?: boolean;
  pan?: boolean;
  onSelect?: () => void;
}) {
  const bgsrc = useMemo(() => svgUrl(backgroundSvg(project.background)), [project.background]),
    bg = useImage(bgsrc),
    upload = useImage(project.background.image),
    transformer = useRef<Konva.Transformer>(null);
  const selection = useEditor((s) => s.selection),
    selectIds = useEditor((s) => s.select);
  const [snap, setSnap] = useState([false, false]);
  useEffect(() => {
    if (!stageRef.current) return;
    transformer.current?.nodes(
      selection
        .map((id) => stageRef.current!.findOne(`#${id}`))
        .filter(
          (n): n is Konva.Node => !!n && !project.layers.find((l) => l.id === n.id())?.locked,
        ),
    );
    transformer.current?.getLayer()?.batchDraw();
  }, [selection, project.layers, zoom, stageRef]);
  useEffect(() => {
    stageRef.current?.batchDraw();
  }, [revision, stageRef]);
  const select = (id: string, e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    const l = project.layers.find((l) => l.id === id)!;
    const ids = l.groupId
      ? project.layers.filter((a) => a.groupId === l.groupId).map((a) => a.id)
      : [id];
    const multi = 'shiftKey' in e.evt && e.evt.shiftKey;
    selectIds(
      multi
        ? selection.includes(id)
          ? selection.filter((i) => !ids.includes(i))
          : [...new Set([...selection, ...ids])]
        : ids,
    );
    onSelect?.();
  };
  const bgState = project.background;
  return (
    <Stage
      width={WIDTH * zoom}
      height={HEIGHT * zoom}
      scaleX={zoom}
      scaleY={zoom}
      ref={stageRef}
      listening={!pan}
      preventDefault={!pan}
      onMouseDown={(e) => {
        if (e.target === e.target.getStage()) selectIds([]);
      }}
      onTouchStart={(e) => {
        if (e.target === e.target.getStage()) selectIds([]);
      }}
    >
      <KLayer>
        <Group
          name="banner-background"
          listening={false}
          clipX={0}
          clipY={0}
          clipWidth={WIDTH}
          clipHeight={HEIGHT}
          visible={!bgState.transparent}
        >
          {bg && <KImage image={bg} width={WIDTH} height={HEIGHT} />}
          {upload && (
            <KImage
              image={upload}
              x={bgState.imageX}
              y={bgState.imageY}
              width={upload.width * bgState.imageScale}
              height={upload.height * bgState.imageScale}
              opacity={bgState.imageOpacity}
            />
          )}
        </Group>
        {project.layers.map((l) => (
          <ObjectNode
            key={l.id}
            layer={l}
            revision={revision}
            select={select}
            edit={onEdit}
            onGuides={(x, y) => setSnap([x, y])}
            onDragEnd={() => setSnap([false, false])}
          />
        ))}
      </KLayer>
      <KLayer name="editor-ui" listening={false}>
        {guides && (
          <Rect
            x={12}
            y={12}
            width={936}
            height={168}
            stroke="#ffffff"
            opacity={0.45}
            strokeWidth={1 / zoom}
            dash={[5 / zoom, 5 / zoom]}
          />
        )}
        {snap[0] && <Line points={[480, 0, 480, 192]} stroke="#32dbce" strokeWidth={1 / zoom} />}
        {snap[1] && <Line points={[0, 96, 960, 96]} stroke="#32dbce" strokeWidth={1 / zoom} />}
      </KLayer>
      <KLayer name="editor-ui">
        <Transformer
          ref={transformer}
          onTransformEnd={() => {
            const nodes = transformer.current?.nodes() || [];
            useEditor.getState().commit((p) => {
              for (const n of nodes) {
                const l = p.layers.find((l) => l.id === n.id());
                if (l && !l.locked) {
                  l.x = n.x();
                  l.y = n.y();
                  l.scaleX = Math.max(0.01, n.scaleX());
                  l.scaleY = Math.max(0.01, n.scaleY());
                  l.rotation = n.rotation();
                }
              }
            });
          }}
          rotateEnabled
          flipEnabled={false}
          borderStroke="#39dcd0"
          anchorStroke="#39dcd0"
          anchorFill="#132529"
          anchorSize={touch ? 22 : 9}
          anchorCornerRadius={touch ? 11 : 0}
          rotateAnchorOffset={touch ? 28 : 50}
          enabledAnchors={
            touch ? ['top-left', 'top-right', 'bottom-left', 'bottom-right'] : undefined
          }
          padding={3}
          boundBoxFunc={(old, b) => (Math.abs(b.width) < 10 || Math.abs(b.height) < 10 ? old : b)}
        />
      </KLayer>
    </Stage>
  );
}
