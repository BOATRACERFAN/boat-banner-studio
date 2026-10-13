import { useEffect, useState } from 'react';
const cache = new Map<string, Promise<HTMLImageElement>>();
export function loadImage(src: string) {
  if (!cache.has(src))
    cache.set(
      src,
      new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => {
          cache.delete(src);
          reject(new Error('画像を読み込めません。PNG / JPEG / WebPを使用してください。'));
        };
        img.src = src;
      }),
    );
  return cache.get(src)!;
}
export function useImage(src: string | undefined) {
  const [image, setImage] = useState<HTMLImageElement>();
  useEffect(() => {
    let active = true;
    setImage(undefined);
    if (src)
      loadImage(src)
        .then((img) => {
          if (active) setImage(img);
        })
        .catch(() => {});
    return () => {
      active = false;
    };
  }, [src]);
  return image;
}
export async function readRaster(file: File) {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type))
    throw new Error('PNG / JPEG / WebP画像を選択してください。');
  if (file.size > 8_000_000) throw new Error('画像は8MB以内にしてください。');
  const raw = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
  const img = await loadImage(raw);
  if (img.width * img.height > 40_000_000) throw new Error('画像の画素数が大きすぎます。');
  const canvas = document.createElement('canvas');
  const scale = Math.min(1, 1920 / img.width, 1920 / img.height);
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/png');
}
