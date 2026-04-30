import { Audio } from 'expo-av';

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function toBase64(bytes) {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i], b1 = bytes[i + 1] ?? 0, b2 = bytes[i + 2] ?? 0;
    out += B64[b0 >> 2];
    out += B64[((b0 & 3) << 4) | (b1 >> 4)];
    out += i + 1 < bytes.length ? B64[((b1 & 15) << 2) | (b2 >> 6)] : '=';
    out += i + 2 < bytes.length ? B64[b2 & 63] : '=';
  }
  return out;
}

function writeWavHeader(view, dataBytes, sampleRate) {
  const s4 = (off, str) => { for (let i = 0; i < 4; i++) view.setUint8(off + i, str.charCodeAt(i)); };
  s4(0, 'RIFF'); view.setUint32(4, 36 + dataBytes, true);
  s4(8, 'WAVE'); s4(12, 'fmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  s4(36, 'data'); view.setUint32(40, dataBytes, true);
}

function makeBeepWav() {
  // Short horn blast — punchy "GO!" signal, odd harmonics give brass/air character
  const sampleRate = 22050;
  const duration = 0.35;
  const numSamples = Math.floor(sampleRate * duration);
  const dataBytes = numSamples * 2;
  const buf = new Uint8Array(44 + dataBytes);
  const view = new DataView(buf.buffer);
  writeWavHeader(view, dataBytes, sampleRate);

  const freq = 280;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Snap attack (5ms), hold, smooth tail
    const env = Math.min(1, i / (sampleRate * 0.005)) * Math.min(1, (numSamples - i) / (numSamples * 0.45));
    // Odd harmonics: fundamental + 3rd + 5th + 7th = horn/buzz timbre
    const sig = (
      Math.sin(2 * Math.PI * freq * t) +
      0.45 * Math.sin(2 * Math.PI * freq * 3 * t) +
      0.22 * Math.sin(2 * Math.PI * freq * 5 * t) +
      0.10 * Math.sin(2 * Math.PI * freq * 7 * t)
    ) / 1.77;
    const saturated = Math.tanh(sig * 2.2) / Math.tanh(2.2);
    view.setInt16(44 + i * 2, Math.round(32767 * 0.88 * saturated * env), true);
  }
  return toBase64(buf);
}

function makeFanfareWav() {
  const sampleRate = 22050;
  const notes = [
    { freq: 523, dur: 0.13 }, { freq: 659, dur: 0.13 },
    { freq: 784, dur: 0.13 }, { freq: 1047, dur: 0.32 },
  ];
  const gap = Math.floor(sampleRate * 0.025);
  let totalSamples = gap;
  for (const n of notes) totalSamples += Math.floor(sampleRate * n.dur) + gap;

  const dataBytes = totalSamples * 2;
  const buf = new Uint8Array(44 + dataBytes);
  const view = new DataView(buf.buffer);
  writeWavHeader(view, dataBytes, sampleRate);

  let offset = 44 + gap * 2;
  for (const n of notes) {
    const ns = Math.floor(sampleRate * n.dur);
    for (let i = 0; i < ns; i++) {
      const t = i / sampleRate;
      const env = Math.min(1, i / (ns * 0.04)) * Math.min(1, (ns - i) / (ns * 0.18));
      view.setInt16(offset, Math.round(32767 * 0.88 * Math.sin(2 * Math.PI * n.freq * t) * env), true);
      offset += 2;
    }
    offset += gap * 2;
  }
  return toBase64(buf);
}

// Generated once, reused on every play — no file system needed
let _beepUri = null;
let _fanfareUri = null;
let _modeReady = false;

function beepUri()    { if (!_beepUri)    _beepUri    = `data:audio/wav;base64,${makeBeepWav()}`;    return _beepUri; }
function fanfareUri() { if (!_fanfareUri) _fanfareUri = `data:audio/wav;base64,${makeFanfareWav()}`; return _fanfareUri; }

async function ensureAudioMode() {
  if (_modeReady) return;
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
  });
  _modeReady = true;
}

export async function prepareBeep() {
  try {
    await ensureAudioMode();
    beepUri();
    fanfareUri();
  } catch (e) {
    console.warn('[beepSound] prepare failed:', e);
  }
}

async function playSound(uri, volume) {
  const { sound } = await Audio.Sound.createAsync(
    { uri },
    { shouldPlay: true, volume: Math.max(0, Math.min(1, volume)) },
  );
  sound.setOnPlaybackStatusUpdate(status => {
    if (status.didJustFinish) sound.unloadAsync().catch(() => {});
  });
}

export async function playBeep(volume = 1.0) {
  try {
    await ensureAudioMode();
    await playSound(beepUri(), volume);
  } catch (e) {
    console.error('[beepSound] play failed:', e);
  }
}

export async function playFanfare(volume = 1.0) {
  try {
    await ensureAudioMode();
    await playSound(fanfareUri(), volume);
  } catch (e) {
    console.error('[beepSound] fanfare failed:', e);
  }
}
