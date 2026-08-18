/**
 * Renders Play Store visual assets from HTML templates using the locally
 * installed Chrome. Usage:  npm run store-assets
 *
 * Always produces:
 *   out/icon-512.png       (512x512 store icon)
 *   out/feature-1024x500.png
 *
 * For each entry in captions.json whose raw capture exists in raw/, produces
 * a framed, captioned 1080x1920 screenshot in out/.
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'out');
const RAW = path.join(ROOT, 'raw');

function fileUrl(p) {
  return 'file:///' + p.replace(/\\/g, '/');
}

async function render(page, url, width, height, outFile) {
  await page.setViewport({ width, height });
  await page.goto(url, { waitUntil: 'networkidle0' });
  if (url.includes('screenshot.html')) {
    // The template resizes the device frame once the capture loads.
    await page.waitForFunction('window.__ready === true');
  }
  await page.screenshot({ path: outFile });
  console.log('wrote', path.relative(ROOT, outFile));
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(RAW, { recursive: true });

  const browser = await puppeteer.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage();

  await render(
    page,
    fileUrl(path.join(ROOT, 'templates', 'icon.html')),
    512,
    512,
    path.join(OUT, 'icon-512.png')
  );

  await render(
    page,
    fileUrl(path.join(ROOT, 'templates', 'feature.html')),
    1024,
    500,
    path.join(OUT, 'feature-1024x500.png')
  );

  const captions = JSON.parse(fs.readFileSync(path.join(ROOT, 'captions.json'), 'utf8'));
  for (const [i, entry] of captions.entries()) {
    const rawFile = path.join(RAW, entry.file);
    if (!fs.existsSync(rawFile)) {
      console.log(`skip  screenshot-${i + 1} (missing raw/${entry.file})`);
      continue;
    }
    const url =
      fileUrl(path.join(ROOT, 'templates', 'screenshot.html')) +
      `?img=${encodeURIComponent(fileUrl(rawFile))}&title=${encodeURIComponent(entry.title)}`;
    await render(page, url, 1080, 1920, path.join(OUT, `screenshot-${i + 1}.png`));
  }

  await browser.close();
})();
