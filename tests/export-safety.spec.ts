import { test, expect } from '@playwright/test';
test('フォント通信失敗時は出力を止め、再試行で復帰する', async ({ page }) => {
  await page.route('https://fonts.googleapis.com/**', (route) => route.abort());
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'フォント再試行', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'ダウンロード', exact: true }).click();
  await page.getByRole('checkbox', { name: '選手情報と確認事項を確認しました' }).check();
  await expect(
    page.getByRole('button', { name: '画像をダウンロード', exact: true }),
  ).toBeDisabled();
  await page.getByRole('button', { name: '閉じる', exact: true }).click();
  await page.unroute('https://fonts.googleapis.com/**');
  await page.getByRole('button', { name: 'フォント再試行', exact: true }).click();
  await expect(page.getByText('書き出し準備完了')).toBeVisible();
});
test('全17文字エフェクトをPNGへ描画し、影とフチの変化を確認する', async ({ page }) => {
  test.setTimeout(120000);
  await page.goto('/');
  await expect(page.getByText('書き出し準備完了')).toBeVisible();
  const hashes = [];
  for (let i = 0; i < 17; i++) {
    await page.evaluate(async (index) => {
      const { useEditor } = await import('/src/editor/store.ts' as string),
        { effects } = await import('/src/catalog/effects.ts' as string);
      useEditor
        .getState()
        .commit((p: { layers: Array<{ type: string; binding: string; style: unknown }> }) => {
          p.layers.find((l) => l.type === 'text' && l.binding === 'name')!.style = {
            ...effects[index].style,
          };
        });
    }, i);
    const hash = await page.evaluate(async () => {
      const { useEditor } = await import('/src/editor/store.ts' as string),
        { exportImage } = await import('/src/lib/export/image.ts' as string),
        K = await import('/node_modules/.vite/deps/konva.js' as string);
      const stage = K.default.stages.find(
        (s: { container: () => HTMLElement }) => s.container()?.isConnected,
      );
      return exportImage(stage, useEditor.getState().project, {
        format: 'png',
        quality: 95,
        transparent: false,
        jpegColor: '#fff',
      });
    });
    hashes.push(hash);
  }
  expect(new Set(hashes).size).toBe(17);
});
test('タッチで文字を選択し、ドラッグで移動する', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  try {
    await page.goto('http://127.0.0.1:5191');
    await expect(page.getByText('書き出し準備完了')).toBeVisible();
    const before = await page.evaluate(async () => {
      const { useEditor } = await import('/src/editor/store.ts' as string);
      return useEditor
        .getState()
        .project.layers.find((l: { binding: string }) => l.binding === 'name');
    });
    const box = await page.locator('.konvajs-content').boundingBox(),
      zoom = box!.width / 960;
    const x = box!.x + (before.x + before.width / 2) * zoom,
      y = box!.y + (before.y + before.height / 2) * zoom;
    await page.touchscreen.tap(x, y);
    expect(
      await page.evaluate(async () => {
        const { useEditor } = await import('/src/editor/store.ts' as string);
        return useEditor.getState().selection.length;
      }),
    ).toBe(1);
    const cdp = await context.newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    for (let i = 1; i <= 8; i++)
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: x + i * 3, y: y + 6 }],
      });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    const after = await page.evaluate(async () => {
      const { useEditor } = await import('/src/editor/store.ts' as string);
      return useEditor
        .getState()
        .project.layers.find((l: { binding: string }) => l.binding === 'name');
    });
    expect(after.x).toBeGreaterThan(before.x + 20);
    await page.screenshot({ path: 'verification/mobile-touch.png', fullPage: true });
  } finally {
    await context.close();
  }
});
