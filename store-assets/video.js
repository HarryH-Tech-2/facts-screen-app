/**
 * Assembles the promo video (1920x1080 MP4) from rendered store assets.
 * Run `npm run store-assets` first so out/ is current, then `npm run store-video`.
 *
 * Each slide gets a blurred full-frame backdrop of itself, a slow zoom, and a
 * crossfade into the next.
 */
const { execFileSync } = require('child_process');
const path = require('path');

const OUT = path.join(__dirname, 'out');
const FPS = 30;
const FADE = 0.5;

// [file, seconds on screen]
const CLIPS = [
  ['video-title.png', 3.5],
  ['promo1.png', 4],
  ['screenshot-2.png', 4],
  ['screenshot-1.png', 3.5],
  ['promo2.png', 3.5],
  ['screenshot-3.png', 3],
  ['video-end.png', 4],
];

const args = [];
for (const [file] of CLIPS) args.push('-i', path.join(OUT, file));

const filters = [];
CLIPS.forEach(([, dur], i) => {
  const frames = Math.round(dur * FPS);
  filters.push(
    `[${i}:v]split[bg${i}][fg${i}]`,
    `[bg${i}]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,gblur=sigma=40[bgb${i}]`,
    `[fg${i}]scale=-2:1080[fgs${i}]`,
    `[bgb${i}][fgs${i}]overlay=(W-w)/2:0[comp${i}]`,
    `[comp${i}]zoompan=z='1+0.06*on/${frames}':x='(iw-iw/zoom)/2':y='(ih-ih/zoom)/2':d=${frames}:s=1920x1080:fps=${FPS}[v${i}]`
  );
});

let prev = 'v0';
let offset = CLIPS[0][1] - FADE;
CLIPS.forEach(([, dur], i) => {
  if (i === 0) return;
  const label = i === CLIPS.length - 1 ? 'vout' : `x${i}`;
  filters.push(
    `[${prev}][v${i}]xfade=transition=fade:duration=${FADE}:offset=${offset.toFixed(2)}[${label}]`
  );
  prev = label;
  offset += dur - FADE;
});

args.push(
  '-filter_complex', filters.join(';'),
  '-map', '[vout]',
  '-c:v', 'libx264',
  '-preset', 'slow',
  '-crf', '20',
  '-pix_fmt', 'yuv420p',
  '-r', String(FPS),
  '-y', path.join(OUT, 'promo-video.mp4')
);

execFileSync('ffmpeg', args, { stdio: 'inherit' });
console.log('wrote out/promo-video.mp4');
