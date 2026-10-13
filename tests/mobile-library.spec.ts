import { test, expect } from '@playwright/test';
test('モバイルで全素材タブを切り替え、選択した装飾の設定を開ける', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByText('書き出し準備完了')).toBeVisible();
  await page.getByRole('button', { name: '素材', exact: true }).click();
  const menu = page.getByRole('combobox', { name: '素材ライブラリ' });
  await expect(menu.locator('option')).toHaveCount(6);
  await menu.selectOption('backgrounds');
  await page.getByRole('button', { name: '背景 金箔の余韻', exact: true }).click();
  await menu.selectOption('palettes');
  await page.getByRole('button', { name: '配色 桜色', exact: true }).click();
  await menu.selectOption('text');
  await page.getByRole('button', { name: 'テキストを追加', exact: true }).click();
  await menu.selectOption('projects');
  await expect(
    page.getByRole('button', { name: 'このプロジェクトを保存', exact: true }),
  ).toBeVisible();
  await menu.selectOption('decorations');
  await page.getByRole('button', { name: '装飾 王冠', exact: true }).click();
  await page.getByRole('button', { name: '素材パネルを閉じる' }).click();
  await page.getByRole('button', { name: '設定', exact: true }).click();
  await expect(page.getByRole('heading', { name: '王冠', exact: true })).toBeVisible();
  await expect(page.getByRole('textbox', { name: '素材色 HEX', exact: true })).toBeVisible();
  await page.screenshot({ path: 'verification/mobile-properties.png', fullPage: true });
});
