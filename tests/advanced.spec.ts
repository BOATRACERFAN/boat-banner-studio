import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
test('30日本語フォントの実ロードと異なる描画結果', async ({ page }) => {
  test.setTimeout(150000);
  await page.goto('/');
  await expect(page.getByText('書き出し準備完了')).toBeVisible();
  const results = await page.evaluate(async () => {
    const { fonts } = await import('/src/catalog/fonts.ts' as string),
      { loadFont } = await import('/src/lib/fonts.ts' as string);
    const results = [];
    const japanese = fonts.filter((f: { category: string }) => f.category !== '英字レーシング');
    for (let i = 0; i < japanese.length; i += 3) {
      const batch = await Promise.all(
        japanese.slice(i, i + 3).map(async (f: { family: string; weight: number }) => {
          await loadFont(f.family, '松田真実 まみちゃんファイト！');
          const c = document.createElement('canvas');
          c.width = 1600;
          c.height = 100;
          const ctx = c.getContext('2d')!;
          ctx.font = `${f.weight} 48px "${f.family}"`;
          ctx.fillStyle = '#fff';
          ctx.fillText('松田真実 まみちゃんファイト！勝利へ全速前進', 10, 65);
          const bytes = ctx.getImageData(0, 0, 1600, 100).data;
          let hash = 2166136261;
          for (const b of bytes) hash = Math.imul(hash ^ b, 16777619);
          return {
            family: f.family,
            hash,
            width: ctx.measureText('松田真実').width,
            ready: document.fonts.check(`${f.weight} 48px "${f.family}"`, '松田真実'),
          };
        }),
      );
      results.push(...batch);
    }
    return results;
  });
  expect(results).toHaveLength(30);
  expect(results.every((r) => r.ready && r.width > 0)).toBe(true);
  await fs.writeFile('verification/browser-fonts.json', JSON.stringify(results, null, 2));
  expect(new Set(results.map((r) => r.hash)).size).toBe(30);
});
test('30テンプレートをレイヤーとしてロードして画像出力', async ({ page }) => {
  test.setTimeout(180000);
  await page.goto('/');
  await expect(page.getByText('書き出し準備完了')).toBeVisible();
  const count = await page.evaluate(async () => {
    const { templates } = await import('/src/catalog/templates.ts' as string);
    return templates.length;
  });
  const results = [];
  for (let i = 0; i < count; i++) {
    await page.evaluate(async (index) => {
      const { templates, createTemplate } = await import('/src/catalog/templates.ts' as string),
        { useEditor } = await import('/src/editor/store.ts' as string);
      useEditor.getState().load(createTemplate(templates[index]));
    }, i);
    await expect(page.getByText('書き出し準備完了')).toBeVisible();
    const result = await page.evaluate(async () => {
      const { useEditor } = await import('/src/editor/store.ts' as string),
        { exportImage } = await import('/src/lib/export/image.ts' as string),
        { inspectDesign } = await import('/src/lib/guides.ts' as string),
        K = await import('/node_modules/.vite/deps/konva.js' as string);
      const stage = K.default.stages.find(
          (s: { container: () => HTMLElement }) => s.container()?.isConnected,
        ),
        p = useEditor.getState().project;
      const data = await exportImage(stage, p, {
        format: 'png',
        quality: 95,
        transparent: false,
        jpegColor: '#ffffff',
      });
      return { data, warnings: inspectDesign(p, stage), layers: p.layers.length };
    });
    expect(result.layers).toBeGreaterThanOrEqual(7);
    expect(result.warnings.filter((w: string) => w.includes('テキスト枠'))).toEqual([]);
    await fs.writeFile(
      `verification/template-${i + 1}.png`,
      Buffer.from(result.data.split(',')[1], 'base64'),
    );
    results.push({ index: i + 1, layers: result.layers, warnings: result.warnings });
  }
  await fs.writeFile('verification/templates.json', JSON.stringify(results, null, 2));
});
test('ドラッグ・ハンドル変形・回転・直接入力', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('書き出し準備完了')).toBeVisible();
  const before = await page.evaluate(async () => {
    const { useEditor } = await import('/src/editor/store.ts' as string);
    return useEditor
      .getState()
      .project.layers.find((l: { binding: string }) => l.binding === 'name');
  });
  const box = await page.locator('.konvajs-content').boundingBox();
  const zoom = box!.width / 960;
  const x = box!.x + (before.x + before.width / 2) * zoom,
    y = box!.y + (before.y + before.height / 2) * zoom;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 30, y + 8, { steps: 8 });
  await page.mouse.up();
  const after = await page.evaluate(async () => {
    const { useEditor } = await import('/src/editor/store.ts' as string);
    return useEditor
      .getState()
      .project.layers.find((l: { binding: string }) => l.binding === 'name');
  });
  expect(after.x - before.x).toBeCloseTo(30 / zoom, 0);
  const handle = await page.evaluate(async () => {
    const K = await import('/node_modules/.vite/deps/konva.js' as string),
      stage = K.default.stages.find(
        (s: { container: () => HTMLElement }) => s.container()?.isConnected,
      );
    return stage.find('Transformer')[0].findOne('.bottom-right').getAbsolutePosition();
  });
  await page.mouse.move(box!.x + handle.x, box!.y + handle.y);
  await page.mouse.down();
  await page.mouse.move(box!.x + handle.x + 25, box!.y + handle.y + 10, { steps: 8 });
  await page.mouse.up();
  const transformed = await page.evaluate(async () => {
    const { useEditor } = await import('/src/editor/store.ts' as string);
    return useEditor
      .getState()
      .project.layers.find((l: { binding: string }) => l.binding === 'name');
  });
  expect(transformed.scaleX).toBeGreaterThan(1);
  await page.getByRole('button', { name: '元に戻す', exact: true }).click();
  const undo = await page.evaluate(async () => {
    const { useEditor } = await import('/src/editor/store.ts' as string);
    return useEditor
      .getState()
      .project.layers.find((l: { binding: string }) => l.binding === 'name');
  });
  expect(undo.scaleX).toBe(1);
  await page.mouse.dblclick(
    box!.x + (undo.x + undo.width / 2) * zoom,
    box!.y + (undo.y + undo.height / 2) * zoom,
  );
  await page.getByRole('textbox', { name: '文字を直接編集', exact: true }).fill('松田選手');
  await page.getByRole('button', { name: '反映する', exact: true }).click();
  expect(
    await page.evaluate(async () => {
      const { useEditor } = await import('/src/editor/store.ts' as string);
      return useEditor.getState().project.racer.name;
    }),
  ).toBe('松田選手');
  await page.getByRole('slider', { name: '回転', exact: true }).fill('15');
  expect(
    await page.evaluate(async () => {
      const { useEditor } = await import('/src/editor/store.ts' as string);
      return useEditor
        .getState()
        .project.layers.find((l: { binding: string }) => l.binding === 'name').rotation;
    }),
  ).toBe(15);
});
test('アップロード背景のトリミングと画像レイヤー、JSON往復', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('書き出し準備完了')).toBeVisible();
  const fixture = await page.evaluate(() => {
    const c = document.createElement('canvas');
    c.width = 960;
    c.height = 192;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#246b81';
    ctx.fillRect(0, 0, 960, 192);
    ctx.fillStyle = '#83efda';
    ctx.fillRect(400, 0, 120, 192);
    return c.toDataURL('image/png');
  });
  const fixtureFile = {
    name: 'fixture.png',
    mimeType: 'image/png',
    buffer: Buffer.from(fixture.split(',')[1], 'base64'),
  };
  await page.getByRole('button', { name: '背景', exact: true }).click();
  await page.locator('.upload-button input').setInputFiles(fixtureFile);
  await expect(page.getByRole('slider', { name: '背景画像倍率' })).toBeVisible();
  await page.getByRole('spinbutton', { name: '画像 X', exact: true }).fill('-40');
  await page.getByRole('button', { name: '装飾', exact: true }).click();
  await page.locator('.upload-button input').setInputFiles(fixtureFile);
  const data = await page.evaluate(async () => {
    const { useEditor } = await import('/src/editor/store.ts' as string),
      { parseProject } = await import('/src/lib/project.ts' as string);
    const p = useEditor.getState().project;
    return {
      same: JSON.stringify(parseProject(JSON.parse(JSON.stringify(p)))) === JSON.stringify(p),
      image: p.background.image,
      imageX: p.background.imageX,
      hasLayer: p.layers.some((l: { type: string }) => l.type === 'image'),
    };
  });
  expect(data.image).toContain('data:image/png');
  expect(data.imageX).toBe(-40);
  expect(data.hasLayer).toBe(true);
  expect(data.same).toBe(true);
});
