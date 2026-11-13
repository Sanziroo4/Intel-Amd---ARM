import { spawnSync } from 'node:child_process';
import { stat, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const source = process.argv[2];
if (!source) throw new Error('Usage: npm run video:prepare -- /absolute/path/to/original.mp4');
const input = resolve(source), target = resolve('assets/intel-and-amd.mp4');
if (input === target) throw new Error('Keep the original outside assets; input and output must differ.');
try { await stat(target); throw new Error('Output already exists. Preserve it elsewhere before replacing it.'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
function run(program, args) {
  const result = spawnSync(program, args, { encoding: 'utf8' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr || `${program} failed`);
  return result.stdout;
}
const original = JSON.parse(run('ffprobe', ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', input]));
if (!original.streams.some((stream) => stream.codec_type === 'video')) throw new Error('Input contains no video stream.');
run('ffmpeg', ['-nostdin', '-n', '-i', input, '-map', '0:v:0', '-map', '0:a:0?', '-vf', 'scale=w=min(1280\\,iw):h=-2', '-c:v', 'libx264', '-crf', '28', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', target]);
const output = JSON.parse(run('ffprobe', ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', target]));
const size = (await stat(target)).size;
const duration = Number(output.format.duration);
if (!Number.isFinite(duration) || duration <= 0) throw new Error('Output duration is invalid.');
if (size > 90 * 1024 * 1024) throw new Error('Web copy exceeds the conservative 90 MiB repository budget. Re-encode at a lower bitrate before adding a manifest.');
await writeFile('assets/media.json', JSON.stringify({ src: './assets/intel-and-amd.mp4', label: 'MP4 · авторлық видео', durationSeconds: duration, bytes: size }, null, 2) + '\n');
console.log(`Web video: ${(size / 1024 / 1024).toFixed(2)} MiB; actual duration: ${duration.toFixed(3)} seconds. Original preserved: ${input}`);
