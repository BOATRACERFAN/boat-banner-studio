// Verify first-party Google Fonts CSS and SIL license records. No font binaries are bundled.
import fs from 'node:fs/promises';
import ts from 'typescript';
const source = await fs.readFile(new URL('../src/catalog/fonts.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { fonts } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`
);
if (fonts.length !== 32) throw new Error('Expected 30 Japanese + 2 Latin fonts.');
const results = [];
for (let i = 0; i < fonts.length; i += 4) {
  const batch = await Promise.all(
    fonts.slice(i, i + 4).map(async (f) => {
      const dir = (
          f.family === 'M PLUS Rounded 1c' ? 'roundedmplus1c' : f.family.toLowerCase()
        ).replace(/[^a-z0-9]/g, ''),
        licenseUrl = `https://raw.githubusercontent.com/google/fonts/main/ofl/${dir}/OFL.txt`,
        cssUrl = `https://fonts.googleapis.com/css2?family=${f.family.replace(/ /g, '+')}:wght@${f.weight}&display=swap`;
      try {
        const [cssResponse, licenseResponse] = await Promise.all([
          fetch(cssUrl, {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
            },
          }),
          fetch(licenseUrl),
        ]);
        const [css, license] = await Promise.all([cssResponse.text(), licenseResponse.text()]);
        const japanese = f.category !== '英字レーシング';
        const ranges = [...css.matchAll(/unicode-range:\s*([^;]+)/g)]
          .flatMap((m) => m[1].split(','))
          .map((v) => v.trim().replace(/^U\+/i, ''));
        const coverage = [0x677e, 0x7530, 0x771f, 0x5b9f].every((code) =>
          ranges.some((v) => {
            if (v.includes('?'))
              return new RegExp(`^${v.replace(/\?/g, '.')}$`, 'i').test(code.toString(16));
            const [a, b = a] = v.split('-');
            return code >= parseInt(a, 16) && code <= parseInt(b, 16);
          }),
        );
        return {
          ...f,
          licenseUrl,
          cssUrl,
          cssOK: cssResponse.ok && css.includes('@font-face'),
          licenseOK: licenseResponse.ok && license.includes('SIL OPEN FONT LICENSE'),
          japaneseCoverage: japanese ? coverage : null,
          license: 'SIL Open Font License 1.1',
          checkedAt: new Date().toISOString(),
        };
      } catch (e) {
        return { ...f, error: e.message };
      }
    }),
  );
  results.push(...batch);
  for (const r of batch)
    console.log(`${r.family}: CSS=${r.cssOK}, OFL=${r.licenseOK}, JP=${r.japaneseCoverage}`);
}
await fs.writeFile(
  new URL('../FONT_VERIFICATION.json', import.meta.url),
  JSON.stringify(results, null, 2),
);
if (results.some((r) => !r.cssOK || !r.licenseOK || r.japaneseCoverage === false))
  process.exitCode = 1;
