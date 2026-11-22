// The Video studio's drawing and recording helpers (browser only).
// Everything is drawn onto one canvas, so the logo, name bar and background are part of the recorded video.
import { supabase } from "@/lib/supabase";

export const NAVY = "#0F2438";
export const ORANGE = "#F7931E";

export type Corner = "top-left" | "top-right" | "bottom-right";
export type Background = "none" | "blur" | "navy" | "image";
export type Format = "landscape" | "portrait";

export type Look = {
  name: string;
  jobTitle: string;
  extraLine: string;
  showNameBar: boolean;
  nameBarSeconds: number; // 0 = the whole video
  logo: HTMLImageElement | null;
  logoCorner: Corner;
  logoBox: boolean;
  background: Background;
  bgImage: HTMLImageElement | null;
};

export const SIZES: Record<Format, { w: number; h: number }> = {
  landscape: { w: 1280, h: 720 },
  portrait: { w: 720, h: 1280 },
};

// ---------- Talking to the server ----------

export async function api(method: "GET" | "POST", body?: object) {
  const { data } = await supabase.auth.getSession();
  const res = await fetch("/api/crm/videos", {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token ?? ""}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "Something went wrong.");
  return json;
}

// Uploads a file straight to storage. Returns its path (and public address for images).
export async function upload(kind: "video" | "gif" | "thumb" | "logo" | "background", blob: Blob, ext: string) {
  const { bucket, path, token, url } = await api("POST", { action: "upload", kind, ext });
  const { error } = await supabase.storage.from(bucket).uploadToSignedUrl(path, token, blob, { contentType: blob.type || undefined });
  if (error) throw new Error(`The upload didn't work: ${error.message}`);
  return { path: path as string, url: url as string | null };
}

// ---------- Images ----------

// Loads an image through a blob so it never "taints" the canvas (which would stop recording)
export async function loadImage(src: string | Blob): Promise<HTMLImageElement> {
  const blob = typeof src === "string" ? await (await fetch(src)).blob() : src;
  const url = URL.createObjectURL(blob);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("That image couldn't be loaded."));
    img.src = url;
  });
}

// Draws a source to fill the area, cropping the edges (like CSS object-fit: cover)
export function drawCover(ctx: CanvasRenderingContext2D, src: CanvasImageSource, sw: number, sh: number, w: number, h: number) {
  if (!sw || !sh) return;
  const scale = Math.max(w / sw, h / sh);
  const cw = w / scale;
  const ch = h / scale;
  ctx.drawImage(src, (sw - cw) / 2, (sh - ch) / 2, cw, ch, 0, 0, w, h);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// ---------- Background removal (MediaPipe, loaded from a CDN only when needed) ----------

const MP_VERSION = "0.10.14";
const MP_BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VERSION}`;
const MP_MODEL = "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite";

// A real browser import that the bundler leaves alone
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const importUrl = new Function("u", "return import(u)") as (u: string) => Promise<any>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let segmenterPromise: Promise<any> | null = null;
export function getSegmenter() {
  if (!segmenterPromise) {
    segmenterPromise = (async () => {
      const mod = await importUrl(`${MP_BASE}/vision_bundle.mjs`).catch(() => importUrl(`${MP_BASE}/+esm`));
      const files = await mod.FilesetResolver.forVisionTasks(`${MP_BASE}/wasm`);
      const make = (delegate: "GPU" | "CPU") =>
        mod.ImageSegmenter.createFromOptions(files, {
          baseOptions: { modelAssetPath: MP_MODEL, delegate },
          runningMode: "VIDEO",
          outputCategoryMask: false,
          outputConfidenceMasks: true,
        });
      return make("GPU").catch(() => make("CPU"));
    })();
    segmenterPromise.catch(() => (segmenterPromise = null));
  }
  return segmenterPromise;
}

// ---------- The compositor ----------

export class Compositor {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  private frame = document.createElement("canvas");
  private person = document.createElement("canvas");
  private mask = document.createElement("canvas");
  private tiny = document.createElement("canvas");
  private maskData: ImageData | null = null;
  private lastTs = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  segmenter: any = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
  }

  setSize(w: number, h: number) {
    for (const c of [this.canvas, this.frame, this.person]) {
      c.width = w;
      c.height = h;
    }
    this.tiny.width = Math.max(16, Math.round(w / 14));
    this.tiny.height = Math.max(16, Math.round(h / 14));
  }

  // Draws one frame. `elapsed` is seconds into the recording (or null when not recording).
  draw(source: HTMLVideoElement, look: Look, elapsed: number | null) {
    const { width: W, height: H } = this.canvas;
    const ctx = this.ctx;
    const fctx = this.frame.getContext("2d")!;
    if (source.readyState < 2) {
      ctx.fillStyle = NAVY;
      ctx.fillRect(0, 0, W, H);
      return;
    }
    drawCover(fctx, source, source.videoWidth, source.videoHeight, W, H);

    const wantsBg = look.background !== "none" && this.segmenter;
    if (!wantsBg) {
      ctx.drawImage(this.frame, 0, 0);
    } else {
      // Work out where the person is
      let ok = false;
      try {
        const ts = Math.max(performance.now(), this.lastTs + 1);
        this.lastTs = ts;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.segmenter.segmentForVideo(this.frame, ts, (result: any) => {
          const m = result?.confidenceMasks?.[0];
          if (!m) return;
          const data: Float32Array = m.getAsFloat32Array();
          if (this.mask.width !== m.width || this.mask.height !== m.height || !this.maskData) {
            this.mask.width = m.width;
            this.mask.height = m.height;
            this.maskData = new ImageData(m.width, m.height);
          }
          const px = this.maskData.data;
          for (let i = 0; i < data.length; i++) {
            // Sharpen the edge a little so hair and shoulders stay solid
            const a = Math.min(1, Math.max(0, (data[i] - 0.25) / 0.5));
            px[i * 4 + 3] = a * 255;
          }
          this.mask.getContext("2d")!.putImageData(this.maskData, 0, 0);
          ok = true;
        });
      } catch {
        ok = false;
      }

      // The background
      if (look.background === "blur") {
        const t = this.tiny.getContext("2d")!;
        t.imageSmoothingQuality = "high";
        t.drawImage(this.frame, 0, 0, this.tiny.width, this.tiny.height);
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(this.tiny, 0, 0, W, H);
      } else if (look.background === "image" && look.bgImage) {
        drawCover(ctx, look.bgImage, look.bgImage.naturalWidth, look.bgImage.naturalHeight, W, H);
      } else {
        const g = ctx.createLinearGradient(0, 0, W, H);
        g.addColorStop(0, "#1F3447");
        g.addColorStop(0.75, NAVY);
        g.addColorStop(1, "#3a2a1a");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "rgba(247,147,30,0.12)";
        ctx.beginPath();
        ctx.arc(W * 0.85, H * 0.2, Math.min(W, H) * 0.35, 0, Math.PI * 2);
        ctx.fill();
      }

      // The person on top
      if (ok || this.mask.width > 0) {
        const pctx = this.person.getContext("2d")!;
        pctx.globalCompositeOperation = "source-over";
        pctx.clearRect(0, 0, W, H);
        pctx.drawImage(this.frame, 0, 0);
        pctx.globalCompositeOperation = "destination-in";
        pctx.imageSmoothingQuality = "high";
        pctx.drawImage(this.mask, 0, 0, W, H);
        pctx.globalCompositeOperation = "source-over";
        ctx.drawImage(this.person, 0, 0);
      } else {
        ctx.drawImage(this.frame, 0, 0);
      }
    }

    this.drawOverlays(look, elapsed);
  }

  private drawOverlays(look: Look, elapsed: number | null) {
    const { width: W, height: H } = this.canvas;
    const ctx = this.ctx;
    const unit = Math.min(W, H);
    const margin = unit * 0.045;

    // Logo in the corner
    if (look.logo) {
      const maxW = W * (W > H ? 0.17 : 0.3);
      const maxH = unit * 0.12;
      const s = Math.min(maxW / look.logo.naturalWidth, maxH / look.logo.naturalHeight);
      const lw = look.logo.naturalWidth * s;
      const lh = look.logo.naturalHeight * s;
      const pad = look.logoBox ? unit * 0.018 : 0;
      const x = look.logoCorner === "top-left" ? margin : W - margin - lw - pad * 2;
      const y = look.logoCorner === "bottom-right" ? H - margin - lh - pad * 2 : margin;
      if (look.logoBox) {
        ctx.fillStyle = "rgba(255,255,255,0.92)";
        roundRect(ctx, x, y, lw + pad * 2, lh + pad * 2, unit * 0.015);
        ctx.fill();
      }
      ctx.drawImage(look.logo, x + pad, y + pad, lw, lh);
    }

    // Name bar at the bottom
    if (look.showNameBar && (look.name || look.jobTitle)) {
      let alpha = 1;
      if (elapsed != null && look.nameBarSeconds > 0) {
        const fadeIn = Math.min(1, elapsed / 0.6);
        const fadeOut = Math.min(1, Math.max(0, (look.nameBarSeconds - elapsed) / 0.6));
        alpha = Math.min(fadeIn, fadeOut);
      }
      if (alpha > 0) {
        ctx.save();
        ctx.globalAlpha = alpha;
        const nameSize = Math.round(unit * 0.05);
        const subSize = Math.round(unit * 0.032);
        const font = "Arial, Helvetica, sans-serif";
        const lines: { text: string; size: number; bold: boolean; color: string }[] = [];
        if (look.name) lines.push({ text: look.name, size: nameSize, bold: true, color: "#ffffff" });
        if (look.jobTitle) lines.push({ text: look.jobTitle, size: subSize, bold: false, color: "#E2E8F0" });
        if (look.extraLine) lines.push({ text: look.extraLine, size: subSize, bold: true, color: ORANGE });
        let textW = 0;
        for (const l of lines) {
          ctx.font = `${l.bold ? "bold " : ""}${l.size}px ${font}`;
          textW = Math.max(textW, ctx.measureText(l.text).width);
        }
        const padX = unit * 0.035;
        const padY = unit * 0.025;
        const gap = unit * 0.01;
        const boxH = padY * 2 + lines.reduce((a, l) => a + l.size, 0) + gap * (lines.length - 1);
        const bar = unit * 0.012;
        const boxW = Math.min(W - margin * 2, textW + padX * 2 + bar);
        const x = margin;
        const y = H - margin - boxH;
        ctx.fillStyle = "rgba(15,36,56,0.9)";
        roundRect(ctx, x, y, boxW, boxH, unit * 0.015);
        ctx.fill();
        ctx.fillStyle = ORANGE;
        roundRect(ctx, x, y, bar * 1.6, boxH, unit * 0.01);
        ctx.fill();
        ctx.fillRect(x + bar * 0.8, y, bar * 0.8, boxH);
        let ty = y + padY;
        ctx.textBaseline = "top";
        for (const l of lines) {
          ctx.font = `${l.bold ? "bold " : ""}${l.size}px ${font}`;
          ctx.fillStyle = l.color;
          ctx.fillText(l.text, x + bar + padX, ty, boxW - bar - padX * 2);
          ty += l.size + gap;
        }
        ctx.restore();
      }
    }
  }
}

// ---------- Recording ----------

export function pickMime() {
  const options = [
    "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
    "video/mp4;codecs=avc1,mp4a.40.2",
    "video/mp4",
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  return options.find((m) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m)) || "";
}

export const extFor = (mime: string) => (mime.includes("mp4") ? "mp4" : "webm");

// ---------- Thumbnail and GIF for emails ----------

export function drawPlayButton(ctx: CanvasRenderingContext2D, w: number, h: number, label?: string) {
  const r = Math.min(w, h) * 0.13;
  const cx = w / 2;
  const cy = h / 2;
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.fillRect(0, 0, w, h);
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = r * 0.4;
  ctx.fillStyle = ORANGE;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.32, cy - r * 0.45);
  ctx.lineTo(cx + r * 0.5, cy);
  ctx.lineTo(cx - r * 0.32, cy + r * 0.45);
  ctx.closePath();
  ctx.fill();
  if (label) {
    const size = Math.round(Math.min(w, h) * 0.06);
    ctx.font = `bold ${size}px Arial, Helvetica, sans-serif`;
    const tw = ctx.measureText(label).width;
    const pw = tw + size * 1.2;
    const ph = size * 1.7;
    const x = w - pw - size * 0.6;
    const y = h - ph - size * 0.6;
    ctx.fillStyle = "rgba(15,36,56,0.88)";
    roundRect(ctx, x, y, pw, ph, ph / 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x + size * 0.6, y + ph / 2);
  }
  ctx.restore();
}

export function canvasBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't make the image."))), type, quality));
}

// A JPEG thumbnail with the play button, from a captured frame
export async function makeThumbnail(frame: HTMLCanvasElement, label: string) {
  const c = document.createElement("canvas");
  c.width = frame.width;
  c.height = frame.height;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(frame, 0, 0);
  drawPlayButton(ctx, c.width, c.height, label);
  return canvasBlob(c, "image/jpeg", 0.86);
}

// A short looping GIF with the play button on every frame (so Outlook, which shows only the first frame, still gets it)
export async function makeGif(frames: ImageData[], label: string, delayMs: number): Promise<Blob | null> {
  if (!frames.length) return null;
  const { GIFEncoder, quantize, applyPalette } = await importUrl("https://cdn.jsdelivr.net/npm/gifenc@1.0.3/+esm");
  const w = frames[0].width;
  const h = frames[0].height;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  const gif = GIFEncoder();
  let palette: number[][] | null = null;
  for (const f of frames) {
    ctx.putImageData(f, 0, 0);
    drawPlayButton(ctx, w, h, label);
    const data = ctx.getImageData(0, 0, w, h).data;
    if (!palette) palette = quantize(data, 256);
    const index = applyPalette(data, palette);
    gif.writeFrame(index, w, h, { palette, delay: delayMs });
  }
  gif.finish();
  return new Blob([gif.bytes()], { type: "image/gif" });
}

export function formatTime(seconds: number) {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

// The bit you paste into an email: the GIF, linked to the video, with a text link under it
export function emailSnippet(link: string, gifUrl: string | null, thumbUrl: string | null, title: string, duration: string) {
  const img = gifUrl || thumbUrl;
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  const html = `${
    img ? `<a href="${link}" style="text-decoration:none"><img src="${img}" alt="Play video: ${esc(title)}" width="400" style="display:block;width:400px;max-width:100%;border:0;border-radius:8px"></a>` : ""
  }<div style="margin-top:6px;font-family:Arial,Helvetica,sans-serif;font-size:14px"><a href="${link}" style="color:#F7931E;font-weight:bold;text-decoration:none">&#9654; Watch the video (${duration})</a></div>`;
  return { html, text: `Watch the video (${duration}): ${link}` };
}

export async function copyRich(html: string, text: string) {
  try {
    await navigator.clipboard.write([
      new ClipboardItem({ "text/html": new Blob([html], { type: "text/html" }), "text/plain": new Blob([text], { type: "text/plain" }) }),
    ]);
    return true;
  } catch {
    await navigator.clipboard.writeText(text);
    return false;
  }
}
