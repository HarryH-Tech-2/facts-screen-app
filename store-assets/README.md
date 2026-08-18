# Store assets pipeline

Generates all Play Store visual assets from templates. Rerun after any UI change.

## Usage

1. Drop raw phone captures into `raw/`, named as listed in `captions.json`
   (`home-light.png`, `wallpaper-lock.png`, `home-dark.png`, `browse.png`).
   Capture via a normal on-device screenshot, or with USB debugging:
   `adb exec-out screencap -p > store-assets/raw/home-light.png`
2. Run `npm run store-assets`
3. Upload everything in `out/` to Play Console.

The store icon and feature graphic render with no input; screenshots render
only for raw captures that exist. Edit `captions.json` to change headlines or
add slides (Play allows up to 8 phone screenshots). Templates are in
`templates/` — sticker style, colors from the app palette.

Requires Google Chrome installed (rendering runs through puppeteer-core).

Listing copy (short + long description) lives in `listing.md`.
