import { test, expect, devices, webkit } from '@playwright/test';

test('スマホの文字編集・書体・配色・拡大プレビュー', async ({ browser }) => {
  const context = await browser.newContext({ ...devices['iPhone 13'] });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  try {
    await page.goto('http://127.0.0.1:5191');
    await expect(page.getByText('書き出し準備完了')).toBeVisible();
    expect((await page.locator('.konvajs-content').boundingBox())!.height).toBeGreaterThan(130);
    await page.screenshot({ path: 'verification/mobile-redesign.png' });
    await page.getByRole('button', { name: '選手名 松田真実', exact: true }).tap();
    const input = page.getByRole('textbox', { name: '選択文字の内容' });
    await expect(input).toHaveValue('松田真実');
    expect(
      await input.evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
    ).toBeGreaterThanOrEqual(16);
    await input.fill('松田選手');
    await page.getByRole('slider', { name: '文字の大きさ', exact: true }).fill('60');
    await page.getByRole('button', { name: '色 #ffdc5e', exact: true }).tap();
    await expect
      .poll(() =>
        page.evaluate(() => {
          const project = JSON.parse(localStorage.getItem('boat-studio-autosave') || '{}');
          const l = project.layers?.find((l: { binding: string }) => l.binding === 'name');
          return [project.racer?.name, l?.fontSize, l?.style.fill];
        }),
      )
      .toEqual(['松田選手', 60, '#ffdc5e']);
    await page.screenshot({ path: 'verification/mobile-text-edit.png' });
    await page.getByRole('button', { name: /書体を変える/ }).tap();
    await page.getByRole('button', { name: /Noto Serif JP/ }).tap();
    await page.getByRole('button', { name: '選んだ文字・飾りに戻る' }).tap();
    await expect(page.getByRole('button', { name: /Noto Serif JP.*書体を変える/ })).toBeVisible();
    await page.getByRole('button', { name: '飾り', exact: true }).tap();
    await page.getByRole('button', { name: '装飾 王冠', exact: true }).tap();
    await expect(page.getByRole('heading', { name: '王冠', exact: true })).toBeVisible();
    await page.getByRole('slider', { name: '飾りの大きさ' }).fill('150');
    const preview = await page.locator('.konvajs-content').boundingBox();
    const sheet = await page.getByRole('region', { name: '編集パネル' }).boundingBox();
    expect(preview!.y + preview!.height).toBeLessThan(sheet!.y);
    await page.getByRole('button', { name: '元に戻す', exact: true }).tap();
    expect(errors).toEqual([]);
  } finally {
    await context.close();
  }
});

test('小型スマホ・横向き・PCへの切替で編集と操作領域を保つ', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 320, height: 568 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  try {
    await page.goto('http://127.0.0.1:5191');
    await expect(page.getByText('書き出し準備完了')).toBeVisible();
    for (const size of [
      { width: 320, height: 568 },
      { width: 844, height: 390 },
    ]) {
      await page.setViewportSize(size);
      await expect
        .poll(() => page.locator('.mobile-sheet').evaluate((el) => el.clientHeight))
        .toBeGreaterThan(130);
      const box = await page.getByRole('navigation', { name: '編集メニュー' }).boundingBox();
      expect(box!.y + box!.height).toBeLessThanOrEqual(size.height + 1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        size.width,
      );
      for (const button of await page.locator('.mobile-tabbar button').all())
        expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      await page.screenshot({ path: `verification/mobile-${size.width}.png` });
    }
    await page.getByRole('button', { name: '選手名 松田真実', exact: true }).tap();
    await page.getByRole('textbox', { name: '選択文字の内容' }).fill('横向きテスト');
    await page.setViewportSize({ width: 1440, height: 960 });
    await expect(page.locator('.editor-layout')).toBeVisible();
    await expect(page.getByRole('textbox', { name: '選択文字の内容' })).toHaveValue('横向きテスト');
    await expect
      .poll(async () => (await page.locator('.konvajs-content').boundingBox())!.width)
      .toBeLessThan(800);
  } finally {
    await context.close();
  }
});

test('指で表示位置を動かしても要素は動かず、全体表示でもPNGは同一', async ({ browser }) => {
  const context = await browser.newContext({ ...devices['iPhone 13'] });
  const page = await context.newPage();
  try {
    await page.goto('http://127.0.0.1:5191');
    await expect(page.getByText('書き出し準備完了')).toBeVisible();
    const before = await page.evaluate(async () => {
      const { useEditor } = await import('/src/editor/store.ts' as string);
      return JSON.stringify(useEditor.getState().project);
    });
    await page.getByRole('button', { name: '文字・飾りを動かす', exact: true }).tap();
    const viewport = page.locator('.mobile-canvas-scroll');
    const previousLeft = await viewport.evaluate((el) => el.scrollLeft);
    const box = await viewport.boundingBox();
    const cdp = await context.newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: 280, y: box!.y + 70 }],
    });
    for (let i = 1; i <= 10; i++)
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: 280 - i * 12, y: box!.y + 70 }],
      });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect
      .poll(() => viewport.evaluate((el) => el.scrollLeft))
      .toBeGreaterThan(previousLeft + 30);
    expect(
      await page.evaluate(async () => {
        const { useEditor } = await import('/src/editor/store.ts' as string);
        return JSON.stringify(useEditor.getState().project);
      }),
    ).toBe(before);
    const image = async () =>
      page.evaluate(async () => {
        const { useEditor } = await import('/src/editor/store.ts' as string);
        const { exportImage } = await import('/src/lib/export/image.ts' as string);
        const K = await import('/node_modules/.vite/deps/konva.js' as string);
        const stage = K.default.stages.find(
          (s: { container: () => HTMLElement }) => s.container()?.isConnected,
        );
        return exportImage(stage, useEditor.getState().project, {
          format: 'png',
          quality: 95,
          transparent: false,
          jpegColor: '#ffffff',
        });
      });
    const expanded = await image();
    await page.getByRole('button', { name: '全体', exact: true }).tap();
    await expect(page.getByRole('button', { name: '全体', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect
      .poll(async () => (await page.locator('.konvajs-content').boundingBox())!.width)
      .toBeLessThanOrEqual(390);
    expect(await image()).toBe(expanded);
    expect(
      await page.evaluate(async (data) => {
        const img = new Image();
        img.src = data;
        await img.decode();
        return [img.width, img.height];
      }, expanded),
    ).toEqual([960, 192]);
  } finally {
    await context.close();
  }
});

test('WebKitのiPhone表示で文字編集とPNGダウンロード', async () => {
  const browser = await webkit.launch();
  const context = await browser.newContext({ ...devices['iPhone 13'] });
  const page = await context.newPage();
  try {
    await page.goto('http://127.0.0.1:5191');
    await expect(page.getByText('書き出し準備完了')).toBeVisible();
    await page.getByRole('button', { name: '選手名 松田真実', exact: true }).tap();
    await page.getByRole('textbox', { name: '選択文字の内容' }).fill('松田選手');
    await page.getByRole('button', { name: 'ダウンロード', exact: true }).tap();
    await page.getByRole('checkbox', { name: '選手情報と確認事項を確認しました' }).check();
    await expect(
      page.getByRole('button', { name: '画像をダウンロード', exact: true }),
    ).toBeEnabled();
    const promise = page.waitForEvent('download');
    await page.getByRole('button', { name: '画像をダウンロード', exact: true }).tap();
    const download = await promise;
    expect(download.suggestedFilename()).toBe('松田選手_5272_960x192.png');
    await download.saveAs('verification/mobile-webkit-export.png');
    await page.getByRole('button', { name: '閉じる', exact: true }).tap();
    await page.screenshot({ path: 'verification/mobile-webkit.png' });
  } finally {
    await browser.close();
  }
});
