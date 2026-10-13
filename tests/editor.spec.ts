import { test, expect } from '@playwright/test';
test('起動、全背景・全装飾のSVGデコード、デスクトップ画面', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByText('書き出し準備完了')).toBeVisible();
  await expect(page.locator('canvas').first()).toBeVisible();
  const results = await page.evaluate(async () => {
    const { backgrounds } = await import('/src/catalog/backgrounds.ts' as string),
      { decorations } = await import('/src/catalog/decorations.ts' as string),
      { backgroundSvg, decorationSvg, svgUrl } = await import('/src/editor/artwork.ts' as string),
      { useEditor } = await import('/src/editor/store.ts' as string);
    const b = useEditor.getState().project.background;
    const svgs = [
      ...backgrounds.map((a: { id: string }) => ({
        id: a.id,
        svg: backgroundSvg({ ...b, presetId: a.id }),
      })),
      ...decorations.map((a: { id: string }) => ({
        id: a.id,
        svg: decorationSvg(a.id, '#ffffff'),
      })),
    ];
    return Promise.all(
      svgs.map(async (a: { id: string; svg: string }) => {
        const img = new Image();
        img.src = svgUrl(a.svg);
        try {
          await img.decode();
          return { id: a.id, ok: true };
        } catch {
          return { id: a.id, ok: false };
        }
      }),
    );
  });
  expect(results.filter((a) => !a.ok)).toEqual([]);
  expect(results).toHaveLength(160);
  expect(errors).toEqual([]);
  await page.screenshot({ path: 'verification/desktop.png', fullPage: true });
});
test('UI操作、Undo/Redo、装飾追加・グループ・ロック', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('書き出し準備完了')).toBeVisible();
  await page.getByRole('button', { name: '背景', exact: true }).click();
  await page.getByRole('button', { name: '背景 青海波', exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () => JSON.parse(localStorage.getItem('boat-studio-autosave') || '{}').background?.presetId,
      ),
    )
    .toBe('bg-1-3');
  await page.getByRole('button', { name: '元に戻す', exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () => JSON.parse(localStorage.getItem('boat-studio-autosave') || '{}').background?.presetId,
      ),
    )
    .toBe('bg-0-0');
  await page.getByRole('button', { name: 'やり直す', exact: true }).click();
  await page.getByRole('button', { name: '装飾', exact: true }).click();
  await page.getByRole('button', { name: '装飾 王冠', exact: true }).click();
  await expect(page.getByRole('button', { name: '複製', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '複製', exact: true }).click();
  await page.keyboard.press('Control+a');
  await page.getByRole('button', { name: 'グループ', exact: true }).click();
  const groups = await page.evaluate(async () => {
    const { useEditor } = await import('/src/editor/store.ts' as string);
    return useEditor.getState().project.layers.map((l: { groupId: string }) => l.groupId);
  });
  expect(new Set(groups).size).toBe(1);
  expect(groups[0]).toBeTruthy();
  await page.getByRole('button', { name: 'ロック', exact: true }).click();
  const before = await page.evaluate(async () => {
    const { useEditor } = await import('/src/editor/store.ts' as string);
    return useEditor.getState().project.layers.map((l: { x: number }) => l.x);
  });
  await page.keyboard.press('ArrowRight');
  expect(
    await page.evaluate(async () => {
      const { useEditor } = await import('/src/editor/store.ts' as string);
      return useEditor.getState().project.layers.map((l: { x: number }) => l.x);
    }),
  ).toEqual(before);
});
test('PNG/JPEGの実寸・透過・枠の除外・ズーム独立', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('書き出し準備完了')).toBeVisible();
  const result = await page.evaluate(async () => {
    const { useEditor } = await import('/src/editor/store.ts' as string),
      { exportImage } = await import('/src/lib/export/image.ts' as string),
      K = await import('/node_modules/.vite/deps/konva.js' as string);
    const stage = K.default.stages.find(
      (s: { container: () => HTMLElement }) => s.container()?.isConnected,
    );
    const p = useEditor.getState().project;
    const base = { format: 'png', quality: 95, transparent: false, jpegColor: '#ffffff' };
    const png = await exportImage(stage, p, base);
    useEditor.getState().select([p.layers.find((l: { type: string }) => l.type === 'text').id]);
    await new Promise((r) => setTimeout(r, 100));
    const selected = await exportImage(stage, p, base);
    stage.scale({ x: 1.7, y: 1.7 });
    stage.size({ width: 1632, height: 326.4 });
    const zoomed = await exportImage(stage, p, base);
    const transparent = await exportImage(stage, p, { ...base, transparent: true });
    const jpeg = await exportImage(stage, p, {
      ...base,
      format: 'jpeg',
      transparent: true,
      jpegColor: '#ffffff',
    });
    const analyze = async (src: string) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      return {
        width: img.width,
        height: img.height,
        corner: [...ctx.getImageData(959, 0, 1, 1).data],
        pixel: [...ctx.getImageData(1, 1, 1, 1).data],
      };
    };
    return {
      sameSelection: png === selected,
      sameZoom: png === zoomed,
      png: await analyze(png),
      transparent: await analyze(transparent),
      jpeg: await analyze(jpeg),
      data: png,
    };
  });
  expect(result.sameSelection).toBe(true);
  expect(result.sameZoom).toBe(true);
  expect(result.png.corner[3]).toBe(255);
  for (const image of [result.png, result.transparent, result.jpeg]) {
    expect(image.width).toBe(960);
    expect(image.height).toBe(192);
  }
  expect(result.transparent.corner[3]).toBe(0);
  expect(result.jpeg.corner[3]).toBe(255);
  expect(result.jpeg.corner.slice(0, 3)).toEqual([255, 255, 255]);
  await page.locator('body').evaluate((_el, data) => {
    const a = document.createElement('a');
    a.download = 'test.png';
    a.href = data;
    document.body.append(a);
  }, result.data);
});
test('選手変更、保存と再編集、自動復元', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('書き出し準備完了')).toBeVisible();
  await page.getByRole('textbox', { name: '選手名', exact: true }).fill('応援テスト');
  await page.getByRole('textbox', { name: '登録番号', exact: true }).fill('1234');
  await page.getByRole('button', { name: '保存', exact: true }).click();
  await page.getByRole('dialog').getByRole('textbox').fill('受け入れテスト');
  await page.getByRole('button', { name: '保存する', exact: true }).click();
  await expect(page.getByText('プロジェクトを保存しました。')).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('boat-studio-autosave')))
    .toContain('応援テスト');
  await page.reload();
  await expect(page.getByRole('textbox', { name: '選手名', exact: true })).toHaveValue(
    '応援テスト',
  );
  await page.getByRole('button', { name: 'プロジェクト', exact: true }).click();
  await expect(page.getByRole('button', { name: '受け入れテストを読み込む' })).toBeVisible();
  await page.getByRole('textbox', { name: '選手名', exact: true }).fill('変更後');
  await page.getByRole('button', { name: '受け入れテストを読み込む' }).click();
  await expect(page.getByRole('textbox', { name: '選手名', exact: true })).toHaveValue(
    '応援テスト',
  );
});
test('モバイルの素材・設定・ダウンロード', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByText('書き出し準備完了')).toBeVisible();
  await page.screenshot({ path: 'verification/mobile.png', fullPage: true });
  await page.getByRole('button', { name: '素材', exact: true }).click();
  await page.getByRole('button', { name: 'テンプレート スイートエール' }).click();
  await page.getByRole('button', { name: '素材パネルを閉じる' }).click();
  await page.getByRole('button', { name: '設定', exact: true }).click();
  await page.getByRole('textbox', { name: '選手名', exact: true }).fill('松田真実');
  await page.getByRole('button', { name: '設定パネルを閉じる' }).click();
  await page.getByRole('button', { name: '出力', exact: true }).click();
  await expect(page.getByRole('dialog', { name: '横断幕を書き出す' })).toBeVisible();
  await page.getByRole('checkbox', { name: '選手情報と確認事項を確認しました' }).check();
  await expect(page.getByRole('button', { name: '画像をダウンロード', exact: true })).toBeEnabled();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: '画像をダウンロード', exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain('松田真実_5272');
  await download.saveAs('verification/mobile-export.png');
});
