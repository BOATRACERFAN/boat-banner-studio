import Konva from 'konva';
import type { Project } from '../../types';
import { WIDTH, HEIGHT } from '../../types';
import { ensureProjectFonts } from '../fonts';
import { loadImage } from '../images';
import { backgroundSvg, decorationSvg, svgUrl } from '../../editor/artwork';
import { download, safeName } from '../project';
export interface ExportOptions {
  format: 'png' | 'jpeg';
  quality: number;
  transparent: boolean;
  jpegColor: string;
}
export async function exportImage(
  stage: Konva.Stage,
  project: Project,
  options: ExportOptions,
): Promise<string> {
  await ensureProjectFonts(project);
  await Promise.all([
    loadImage(svgUrl(backgroundSvg(project.background))),
    ...(project.background.image ? [loadImage(project.background.image)] : []),
    ...project.layers
      .filter((l) => l.visible)
      .map((l) =>
        l.type === 'decoration'
          ? loadImage(svgUrl(decorationSvg(l.assetId, l.color)))
          : l.type === 'image'
            ? loadImage(l.src)
            : Promise.resolve(),
      ),
  ]);
  await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;left:-10000px;top:-10000px;';
  document.body.append(container);
  let clone: Konva.Stage | undefined;
  try {
    clone = stage.clone({ container, width: WIDTH, height: HEIGHT, scaleX: 1, scaleY: 1 });
    clone.find('.editor-ui').forEach((n) => n.destroy());
    clone.find('.banner-background').forEach((n) => n.visible(!options.transparent));
    clone.draw();
    const canvas = clone.toCanvas({ x: 0, y: 0, width: WIDTH, height: HEIGHT, pixelRatio: 1 });
    if (options.format === 'png') return canvas.toDataURL('image/png');
    const opaque = document.createElement('canvas');
    opaque.width = WIDTH;
    opaque.height = HEIGHT;
    const ctx = opaque.getContext('2d')!;
    ctx.fillStyle = options.jpegColor;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.drawImage(canvas, 0, 0);
    return opaque.toDataURL('image/jpeg', options.quality / 100);
  } finally {
    clone?.destroy();
    container.remove();
  }
}
export async function downloadImage(stage: Konva.Stage, p: Project, o: ExportOptions) {
  const data = await exportImage(stage, p, o);
  download(
    data,
    `${safeName(p.racer.name)}_${safeName(p.racer.number)}_960x192.${o.format === 'png' ? 'png' : 'jpg'}`,
  );
  return data;
}
