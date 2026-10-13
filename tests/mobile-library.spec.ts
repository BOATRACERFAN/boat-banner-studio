import { test, expect } from '@playwright/test';
test('モバイルで全素材タブを切り替え、選択した装飾の設定を開ける', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByText('書き出し準備完了')).toBeVisible();
  await page.getByRole('button', { name: '背景', exact: true }).click();
  await page.getByRole('button', { name: '背景 金箔の余韻', exact: true }).click();
  await page.getByRole('button', { name: 'その他', exact: true }).click();
  await page.getByRole('button', { name: '色の組み合わせ', exact: true }).click();
  await page.getByRole('button', { name: '配色 桜色', exact: true }).click();
  await page.getByRole('button', { name: '文字', exact: true }).click();
  await page.getByRole('button', { name: 'テキストを追加', exact: true }).click();
  await page.getByRole('button', { name: 'その他', exact: true }).click();
  await page.getByRole('button', { name: '保存したデザイン', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'このプロジェクトを保存', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: '飾り', exact: true }).click();
  await page.getByRole('button', { name: '装飾 王冠', exact: true }).click();
  await expect(page.getByRole('heading', { name: '王冠', exact: true })).toBeVisible();
  await expect(page.getByRole('textbox', { name: '好きな色 HEX', exact: true })).toBeVisible();
  await page.screenshot({ path: 'verification/mobile-properties.png', fullPage: true });
});
