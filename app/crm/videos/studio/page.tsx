"use client";

// Video studio: record yourself (or brand a video you've already filmed) with your logo and name on it,
// a script only you can see, a 3 second countdown and background effects.
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Compositor,
  ORANGE,
  SIZES,
  api,
  copyRich,
  emailSnippet,
  extFor,
  formatTime,
  getSegmenter,
  loadImage,
  makeGif,
  makeThumbnail,
  pickMime,
  upload,
  type Background,
  type Corner,
  type Format,
  type Look,
} from "../engine";

const MAX_SECONDS = 180;
const GIF_START = 0.5;
const GIF_END = 3.5;
const GIF_FPS = 8;
const GIF_WIDTH = 400;

type Stage = "setup" | "countdown" | "recording" | "processing" | "review" | "saving" | "saved";
type Take = { blob: Blob; url: string; mime: string; seconds: number; gif: Blob | null; gifUrl: string | null; thumb: Blob; thumbUrl: string };
type Saved = { link: string; gif_url: string | null; thumb_url: string | null; id: string };

export default function StudioPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const camRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLVideoElement>(null);
  const scriptBoxRef = useRef<HTMLDivElement>(null);
  const comp = useRef<Compositor | null>(null);

  // What the video looks like
  const [name, setName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [extraLine, setExtraLine] = useState("");
  const [showNameBar, setShowNameBar] = useState(true);
  const [nameBarSeconds, setNameBarSeconds] = useState(0);
  const [logo, setLogo] = useState<HTMLImageElement | null>(null);
  const [logoPath, setLogoPath] = useState<string | null>(null);
  const [logoCorner, setLogoCorner] = useState<Corner>("top-right");
  const [logoBox, setLogoBox] = useState(false);
  const [background, setBackground] = useState<Background>("none");
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [bgPath, setBgPath] = useState<string | null>(null);
  const [bgStatus, setBgStatus] = useState<"off" | "loading" | "ready">("off");
  const [format, setFormat] = useState<Format>("landscape");

  // Script
  const [script, setScript] = useState("");
  const [speed, setSpeed] = useState(2);
  const [scrolling, setScrolling] = useState(true);

  // Source: your camera, or a video file
  const [source, setSource] = useState<"camera" | "file">("camera");
  const [cams, setCams] = useState<MediaDeviceInfo[]>([]);
  const [mics, setMics] = useState<MediaDeviceInfo[]>([]);
  const [camId, setCamId] = useState("");
  const [micId, setMicId] = useState("");
  const [fileName, setFileName] = useState("");
  const camStream = useRef<MediaStream | null>(null);
  const fileAudio = useRef<{ ctx: AudioContext; dest: MediaStreamAudioDestinationNode } | null>(null);

  // Recording
  const [stage, setStage] = useState<Stage>("setup");
  const [count, setCount] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [take, setTake] = useState<Take | null>(null);
  const [title, setTitle] = useState("");
  const [saved, setSaved] = useState<Saved | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const startAt = useRef<number | null>(null);
  const gifFrames = useRef<ImageData[]>([]);
  const lastGifAt = useRef(-1);
  const thumbCanvas = useRef<HTMLCanvasElement | null>(null);
  const stageRef = useRef<Stage>("setup");
  stageRef.current = stage;

  const look = useRef<Look>({
    name: "",
    jobTitle: "",
    extraLine: "",
    showNameBar: true,
    nameBarSeconds: 0,
    logo: null,
    logoCorner: "top-right",
    logoBox: false,
    background: "none",
    bgImage: null,
  });
  look.current = { name, jobTitle, extraLine, showNameBar, nameBarSeconds, logo, logoCorner, logoBox, background, bgImage };

  // ---------- Load your saved settings ----------
  useEffect(() => {
    (async () => {
      try {
        const j = await api("GET");
        const p = j.profile;
        if (p) {
          setName(p.name || "");
          setJobTitle(p.job_title || "");
          setExtraLine(p.extra_line || "");
          setLogoCorner(p.logo_corner || "top-right");
          setLogoBox(!!p.logo_box);
          setScript(p.script || "");
          if (p.logo_url) {
            setLogoPath(p.logo_path);
            loadImage(p.logo_url).then(setLogo).catch(() => {});
          }
          if (p.background_url) {
            setBgPath(p.background_path);
            loadImage(p.background_url).then(setBgImage).catch(() => {});
          }
        } else {
          setName("Darren Rowell");
          setExtraLine("reachnetworkrec.com");
        }
      } catch (e) {
        setError((e as Error).message);
      }
      setLoaded(true);
    })();
  }, []);

  // Save settings a second after you stop changing them
  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => {
      api("POST", { action: "profile", name, job_title: jobTitle, extra_line: extraLine, logo_path: logoPath, logo_corner: logoCorner, logo_box: logoBox, background_path: bgPath, script }).catch(() => {});
    }, 1000);
    return () => clearTimeout(t);
  }, [loaded, name, jobTitle, extraLine, logoPath, logoCorner, logoBox, bgPath, script]);

  // ---------- Camera ----------
  const startCamera = useCallback(async () => {
    camStream.current?.getTracks().forEach((t) => t.stop());
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: camId ? { exact: camId } : undefined, width: { ideal: 1920 }, height: { ideal: 1080 }, facingMode: "user" },
        audio: { deviceId: micId ? { exact: micId } : undefined, echoCancellation: true, noiseSuppression: true },
      });
      camStream.current = stream;
      if (camRef.current) {
        camRef.current.srcObject = stream;
        await camRef.current.play().catch(() => {});
      }
      const devices = await navigator.mediaDevices.enumerateDevices();
      setCams(devices.filter((d) => d.kind === "videoinput"));
      setMics(devices.filter((d) => d.kind === "audioinput"));
      setError(null);
    } catch (e) {
      const msg = (e as Error).name === "NotAllowedError" ? "Allow the camera and microphone in your browser (the icon in the address bar), then try again." : (e as Error).message;
      setError(`Couldn't start the camera. ${msg}`);
    }
  }, [camId, micId]);

  useEffect(() => {
    if (source === "camera") startCamera();
    return () => {
      if (source === "camera") camStream.current?.getTracks().forEach((t) => t.stop());
    };
  }, [source, startCamera]);

  // ---------- Background effects ----------
  useEffect(() => {
    if (background === "none") return;
    if (comp.current?.segmenter) {
      setBgStatus("ready");
      return;
    }
    setBgStatus("loading");
    getSegmenter()
      .then((seg) => {
        if (comp.current) comp.current.segmenter = seg;
        setBgStatus("ready");
      })
      .catch(() => {
        setBgStatus("off");
        setBackground("none");
        setError("Background effects couldn't load on this browser. Try Google Chrome.");
      });
  }, [background]);

  // ---------- The drawing loop ----------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!comp.current) comp.current = new Compositor(canvas);
    const { w, h } = SIZES[format];
    comp.current.setSize(w, h);
    const gifW = format === "landscape" ? GIF_WIDTH : Math.round(GIF_WIDTH * 0.6);
    const gifH = Math.round((gifW * h) / w);
    const gifCanvas = document.createElement("canvas");
    gifCanvas.width = gifW;
    gifCanvas.height = gifH;
    const gctx = gifCanvas.getContext("2d", { willReadFrequently: true })!;

    let raf = 0;
    const loop = () => {
      const src = source === "file" ? fileRef.current : camRef.current;
      const rec = stageRef.current === "recording" && startAt.current != null;
      const t = rec ? (performance.now() - startAt.current!) / 1000 : null;
      if (src) comp.current!.draw(src, look.current, t);

      if (rec && t != null) {
        // Frames for the email GIF, and one for the thumbnail
        if (t >= GIF_START && t <= GIF_END && t - lastGifAt.current >= 1 / GIF_FPS) {
          lastGifAt.current = t;
          gctx.drawImage(canvas, 0, 0, gifW, gifH);
          gifFrames.current.push(gctx.getImageData(0, 0, gifW, gifH));
        }
        if (!thumbCanvas.current && t >= 1.2) {
          const c = document.createElement("canvas");
          c.width = canvas.width;
          c.height = canvas.height;
          c.getContext("2d")!.drawImage(canvas, 0, 0);
          thumbCanvas.current = c;
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [format, source]);

  // Timer while recording, with a hard stop at 3 minutes
  useEffect(() => {
    if (stage !== "recording") return;
    const t = setInterval(() => {
      const s = startAt.current ? (performance.now() - startAt.current) / 1000 : 0;
      setElapsed(s);
      if (s >= MAX_SECONDS) stopRecording();
    }, 250);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  // The script scrolls on its own while you record
  useEffect(() => {
    if (stage !== "recording" || !scrolling || !speed) return;
    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const box = scriptBoxRef.current;
      if (box) box.scrollTop += ((now - last) / 1000) * speed * 14;
      last = now;
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [stage, scrolling, speed]);

  // ---------- Recording ----------
  function audioTracks(): MediaStreamTrack[] {
    if (source === "camera") return camStream.current?.getAudioTracks() ?? [];
    return fileAudio.current?.dest.stream.getAudioTracks() ?? [];
  }

  function beginRecording() {
    const canvas = canvasRef.current!;
    const mime = pickMime();
    if (!mime) return setError("This browser can't record video. Use Google Chrome, Edge or Safari.");
    const stream = new MediaStream([...canvas.captureStream(30).getVideoTracks(), ...audioTracks()]);
    const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 2_000_000, audioBitsPerSecond: 128_000 });
    chunks.current = [];
    gifFrames.current = [];
    lastGifAt.current = -1;
    thumbCanvas.current = null;
    rec.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
    rec.onstop = () => finish(mime);
    recorder.current = rec;
    if (scriptBoxRef.current) scriptBoxRef.current.scrollTop = 0;
    startAt.current = performance.now();
    setElapsed(0);
    rec.start(1000);
    setStage("recording");
  }

  function startCountdown() {
    setError(null);
    if (source === "file") {
      const v = fileRef.current;
      if (!v || !fileName) return setError("Choose a video file first.");
      if (!fileAudio.current) {
        const ctx = new AudioContext();
        const node = ctx.createMediaElementSource(v);
        const dest = ctx.createMediaStreamDestination();
        node.connect(dest);
        node.connect(ctx.destination);
        fileAudio.current = { ctx, dest };
      }
      fileAudio.current.ctx.resume();
      v.currentTime = 0;
      v.onended = () => stopRecording();
      v.play().then(beginRecording).catch((e) => setError(e.message));
      return;
    }
    if (!camStream.current) return setError("The camera isn't on yet.");
    setStage("countdown");
    setCount(3);
    let n = 3;
    const t = setInterval(() => {
      n -= 1;
      if (n <= 0) {
        clearInterval(t);
        beginRecording();
      } else setCount(n);
    }, 1000);
  }

  function stopRecording() {
    if (recorder.current && recorder.current.state !== "inactive") {
      recorder.current.stop();
      if (source === "file") fileRef.current?.pause();
      setStage("processing");
    }
  }

  async function finish(mime: string) {
    const seconds = startAt.current ? (performance.now() - startAt.current) / 1000 : 0;
    startAt.current = null;
    const blob = new Blob(chunks.current, { type: mime.split(";")[0] });
    const label = formatTime(seconds);
    try {
      const frame = thumbCanvas.current || canvasRef.current!;
      const thumb = await makeThumbnail(frame, label);
      let gif: Blob | null = null;
      try {
        gif = await makeGif(gifFrames.current, label, Math.round(1000 / GIF_FPS));
      } catch {
        gif = null; // the still thumbnail is used instead
      }
      setTake({
        blob,
        url: URL.createObjectURL(blob),
        mime: blob.type,
        seconds,
        gif,
        gifUrl: gif ? URL.createObjectURL(gif) : null,
        thumb,
        thumbUrl: URL.createObjectURL(thumb),
      });
      if (!title) setTitle(name ? `A quick hello from ${name.split(" ")[0]}` : "A quick hello");
      setStage("review");
    } catch (e) {
      setError((e as Error).message);
      setStage("setup");
    }
  }

  function retake() {
    setTake(null);
    setSaved(null);
    setStage("setup");
  }

  async function save() {
    if (!take) return;
    setStage("saving");
    setError(null);
    try {
      if (take.blob.size > 50 * 1024 * 1024) throw new Error("This video is over 50MB. Record a shorter one, or download it instead.");
      const [video, gif, thumb] = await Promise.all([
        upload("video", take.blob, extFor(take.mime)),
        take.gif ? upload("gif", take.gif, "gif") : Promise.resolve(null),
        upload("thumb", take.thumb, "jpg"),
      ]);
      const j = await api("POST", {
        action: "save",
        title,
        video_path: video.path,
        gif_path: gif?.path ?? null,
        thumb_path: thumb.path,
        mime: take.mime,
        duration_seconds: take.seconds,
      });
      setSaved(j.video);
      setStage("saved");
    } catch (e) {
      setError((e as Error).message);
      setStage("review");
    }
  }

  function download(blob: Blob, filename: string) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  }

  async function copyForEmail() {
    if (!saved || !take) return;
    const { html, text } = emailSnippet(saved.link, saved.gif_url, saved.thumb_url, title, formatTime(take.seconds));
    const rich = await copyRich(html, text);
    flash(rich ? "email" : "email-text");
  }

  function flash(label: string) {
    setCopied(label);
    setTimeout(() => setCopied(null), 2500);
  }

  // ---------- Uploading a logo or background ----------
  async function pickImage(file: File, kind: "logo" | "background") {
    setError(null);
    if (!file.type.startsWith("image/")) return setError("Choose an image file (PNG or JPG).");
    if (file.size > 8 * 1024 * 1024) return setError("That image is too big. Keep it under 8MB.");
    try {
      const img = await loadImage(file);
      const ext = (file.name.split(".").pop() || "png").toLowerCase();
      const up = await upload(kind, file, ext);
      if (kind === "logo") {
        setLogo(img);
        setLogoPath(up.path);
      } else {
        setBgImage(img);
        setBgPath(up.path);
        setBackground("image");
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function pickFile(file: File) {
    if (!file.type.startsWith("video/")) return setError("Choose a video file.");
    const v = fileRef.current;
    if (!v) return;
    v.src = URL.createObjectURL(file);
    v.load();
    setFileName(file.name);
    setError(null);
  }

  const busy = stage === "countdown" || stage === "recording" || stage === "processing";
  const field = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#F7931E] focus:outline-none";
  const label = "mb-1 block text-xs font-semibold text-slate-500";
  const chip = (active: boolean) => `rounded-lg border px-3 py-1.5 text-sm ${active ? "border-[#F7931E] bg-orange-50 font-semibold text-[#1F3447]" : "border-slate-200 text-slate-600"}`;
  const showRecorder = stage !== "review" && stage !== "saving" && stage !== "saved";

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <Link href="/crm/videos" className="text-sm text-slate-500 hover:underline">
            ← Your videos
          </Link>
          <h1 className="text-2xl font-bold text-[#1F3447]">Video studio</h1>
        </div>
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {/* Hidden sources that feed the canvas */}
      <video ref={camRef} muted playsInline autoPlay className="pointer-events-none absolute h-px w-px opacity-0" />
      <video ref={fileRef} playsInline preload="auto" className="pointer-events-none absolute h-px w-px opacity-0" />

      <div className={showRecorder ? "grid gap-5 lg:grid-cols-[1fr_320px]" : "hidden"}>
        {/* ---------- Camera and script ---------- */}
        <div>
          <div className="relative overflow-hidden rounded-2xl bg-[#0F2438] shadow-sm">
            <canvas ref={canvasRef} className={`mx-auto block ${format === "landscape" ? "aspect-video w-full" : "aspect-[9/16] max-h-[70vh]"}`} />
            {stage === "countdown" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <span key={count} className="text-[9rem] font-extrabold text-white drop-shadow-lg">
                  {count}
                </span>
              </div>
            )}
            {stage === "recording" && (
              <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-sm font-semibold text-white">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
                {formatTime(elapsed)} / {formatTime(MAX_SECONDS)}
              </div>
            )}
            {stage === "processing" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-lg font-semibold text-white">Finishing your video…</div>
            )}
            {bgStatus === "loading" && background !== "none" && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs text-white">Loading background effects…</div>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            {stage === "recording" ? (
              <button onClick={stopRecording} className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white shadow">
                ■ Stop
              </button>
            ) : (
              <button
                onClick={startCountdown}
                disabled={busy || (source === "file" && !fileName)}
                className="rounded-full px-6 py-3 font-semibold text-white shadow disabled:opacity-50"
                style={{ background: ORANGE }}
              >
                {source === "file" ? "● Add my branding" : "● Record"}
              </button>
            )}
            <p className="text-xs text-slate-500">
              {source === "file" ? "Your video plays through once with your logo and name added. Keep this tab open." : "3 second countdown, then you're recording. Up to 3 minutes."}
            </p>
          </div>

          {/* Script: only you see this, it isn't recorded */}
          <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-bold text-slate-800">
                Your script <span className="font-normal text-slate-400">(only you can see this)</span>
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                Scroll speed
                <input type="range" min={0} max={6} step={0.5} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} />
                {stage === "recording" && (
                  <button onClick={() => setScrolling(!scrolling)} className="rounded border border-slate-200 px-2 py-0.5">
                    {scrolling ? "Pause" : "Scroll"}
                  </button>
                )}
              </div>
            </div>
            {stage === "recording" || stage === "countdown" ? (
              <div ref={scriptBoxRef} onClick={() => setScrolling(!scrolling)} className="mt-2 h-48 overflow-y-auto rounded-lg bg-[#0F2438] px-5 py-4">
                <p className="whitespace-pre-wrap text-2xl font-semibold leading-relaxed text-white">{script || "No script. Just talk naturally!"}</p>
                <div className="h-40" />
              </div>
            ) : (
              <textarea
                className={`${field} mt-2 text-base leading-relaxed`}
                rows={7}
                placeholder={"Write what you want to say. It scrolls up while you record.\n\ne.g. Hi, I'm Darren from Reach Network Recruitment. I've got a brilliant Class 1 driver available near you…"}
                value={script}
                onChange={(e) => setScript(e.target.value)}
              />
            )}
          </div>
        </div>

        {/* ---------- Settings ---------- */}
        <aside className={`space-y-4 ${busy ? "pointer-events-none opacity-60" : ""}`}>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="mb-2 text-sm font-bold text-slate-800">Record from</p>
            <div className="flex gap-2">
              <button className={chip(source === "camera")} onClick={() => setSource("camera")}>
                My camera
              </button>
              <button
                className={chip(source === "file")}
                onClick={() => {
                  camStream.current?.getTracks().forEach((t) => t.stop());
                  camStream.current = null;
                  setSource("file");
                }}
              >
                A video I&apos;ve filmed
              </button>
            </div>
            {source === "camera" ? (
              <div className="mt-3 space-y-2">
                {cams.length > 1 && (
                  <select className={field} value={camId} onChange={(e) => setCamId(e.target.value)}>
                    <option value="">Default camera</option>
                    {cams.map((c, i) => (
                      <option key={c.deviceId} value={c.deviceId}>
                        {c.label || `Camera ${i + 1}`}
                      </option>
                    ))}
                  </select>
                )}
                {mics.length > 1 && (
                  <select className={field} value={micId} onChange={(e) => setMicId(e.target.value)}>
                    <option value="">Default microphone</option>
                    {mics.map((m, i) => (
                      <option key={m.deviceId} value={m.deviceId}>
                        {m.label || `Microphone ${i + 1}`}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ) : (
              <label className="mt-3 flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-slate-200 px-3 py-4 text-sm font-semibold text-slate-600 hover:border-[#F7931E]">
                {fileName || "Choose a video file"}
                <input type="file" accept="video/*" className="hidden" onChange={(e) => e.target.files?.[0] && pickFile(e.target.files[0])} />
              </label>
            )}
            <div className="mt-3 flex gap-2">
              <button className={chip(format === "landscape")} onClick={() => setFormat("landscape")}>
                Landscape
              </button>
              <button className={chip(format === "portrait")} onClick={() => setFormat("portrait")}>
                Portrait
              </button>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="mb-2 text-sm font-bold text-slate-800">Name bar</p>
            <div className="space-y-2">
              <input className={field} placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
              <input className={field} placeholder="Job title, e.g. Director" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
              <input className={field} placeholder="Extra line, e.g. reachnetworkrec.com" value={extraLine} onChange={(e) => setExtraLine(e.target.value)} />
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={showNameBar} onChange={(e) => setShowNameBar(e.target.checked)} />
                Show the name bar
              </label>
              {showNameBar && (
                <select className={field} value={nameBarSeconds} onChange={(e) => setNameBarSeconds(Number(e.target.value))}>
                  <option value={0}>For the whole video</option>
                  <option value={8}>For the first 8 seconds</option>
                  <option value={15}>For the first 15 seconds</option>
                </select>
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="mb-2 text-sm font-bold text-slate-800">Logo</p>
            <label className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-slate-200 px-3 py-3 text-sm font-semibold text-slate-600 hover:border-[#F7931E]">
              {logo ? "Change logo" : "Upload your logo"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && pickImage(e.target.files[0], "logo")} />
            </label>
            {logo && (
              <div className="mt-2 space-y-2">
                <div className="flex flex-wrap gap-2">
                  {(["top-left", "top-right", "bottom-right"] as Corner[]).map((c) => (
                    <button key={c} className={chip(logoCorner === c)} onClick={() => setLogoCorner(c)}>
                      {c === "top-left" ? "Top left" : c === "top-right" ? "Top right" : "Bottom right"}
                    </button>
                  ))}
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={logoBox} onChange={(e) => setLogoBox(e.target.checked)} />
                  White box behind it (for dark logos)
                </label>
                <button
                  onClick={() => {
                    setLogo(null);
                    setLogoPath(null);
                  }}
                  className="text-xs text-slate-400 hover:text-red-600"
                >
                  Remove logo
                </button>
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="mb-2 text-sm font-bold text-slate-800">Background</p>
            <div className="flex flex-wrap gap-2">
              <button className={chip(background === "none")} onClick={() => setBackground("none")}>
                As it is
              </button>
              <button className={chip(background === "blur")} onClick={() => setBackground("blur")}>
                Blur
              </button>
              <button className={chip(background === "navy")} onClick={() => setBackground("navy")}>
                Reach navy
              </button>
              {bgImage && (
                <button className={chip(background === "image")} onClick={() => setBackground("image")}>
                  My image
                </button>
              )}
            </div>
            <label className="mt-2 flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-slate-200 px-3 py-3 text-sm font-semibold text-slate-600 hover:border-[#F7931E]">
              {bgImage ? "Change background image" : "Upload a background image"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && pickImage(e.target.files[0], "background")} />
            </label>
            <p className="mt-2 text-xs text-slate-400">Works best in Google Chrome with good light in front of you.</p>
          </div>
        </aside>
      </div>

      {/* ---------- Review: how it will look ---------- */}
      {take && (stage === "review" || stage === "saving" || stage === "saved") && (
        <div className="grid gap-5 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-bold text-slate-800">Their video page</p>
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="flex items-center gap-2 bg-[#0F2438] px-4 py-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-md text-sm font-extrabold text-white" style={{ background: ORANGE }}>
                  R
                </span>
                <span className="text-sm font-bold text-white">Reach Network Recruitment</span>
              </div>
              <video src={take.url} controls playsInline className="max-h-[60vh] w-full bg-black" />
              <div className="px-4 py-3">
                <p className="text-lg font-extrabold text-[#0F2438]">{title || "Your video"}</p>
                <p className="text-sm text-slate-500">
                  {name}
                  {jobTitle ? `, ${jobTitle}` : ""}
                </p>
                <div className="mt-2 flex gap-2">
                  <span className="rounded-md px-3 py-1.5 text-xs font-semibold text-white" style={{ background: ORANGE }}>
                    Reply to {name.split(" ")[0] || "us"}
                  </span>
                  <span className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-[#0F2438]">Tell us what staff you need</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-bold text-slate-800">How it looks in an email</p>
              <div className="rounded-2xl bg-white p-4 font-[Arial] text-[14px] text-slate-800 shadow-sm">
                <p>Hi Sarah,</p>
                <p className="mt-2">I&apos;ve recorded a quick video for you:</p>
                <img src={take.gifUrl || take.thumbUrl} alt="Video preview" className="mt-3 w-full max-w-[400px] rounded-lg" />
                <p className="mt-1.5 font-bold" style={{ color: ORANGE }}>
                  ▶ Watch the video ({formatTime(take.seconds)})
                </p>
                <p className="mt-3">Kind regards,</p>
                <p>{name}</p>
              </div>
              {!take.gif && <p className="mt-1 text-xs text-slate-400">The moving preview couldn&apos;t be made on this browser, so a still picture is used.</p>}
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm">
              {stage !== "saved" ? (
                <>
                  <label className={label}>Video title (shown on the page)</label>
                  <input className={field} value={title} onChange={(e) => setTitle(e.target.value)} />
                  <button
                    onClick={save}
                    disabled={stage === "saving"}
                    className="mt-3 w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                    style={{ background: ORANGE }}
                  >
                    {stage === "saving" ? "Saving…" : "Save and get the link"}
                  </button>
                  <div className="mt-2 flex gap-2">
                    <button onClick={() => download(take.blob, `${title || "video"}.${extFor(take.mime)}`)} className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                      Download video
                    </button>
                    <button onClick={retake} disabled={stage === "saving"} className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                      Record again
                    </button>
                  </div>
                </>
              ) : (
                saved && (
                  <>
                    <p className="rounded-lg bg-green-50 p-2.5 text-sm text-green-800">Saved. You&apos;ll get an email when someone opens it.</p>
                    <button onClick={copyForEmail} className="mt-3 w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white" style={{ background: ORANGE }}>
                      {copied === "email" ? "Copied! Paste it into your email" : copied === "email-text" ? "Copied the link (this browser can't copy the picture)" : "Copy for an email (picture + play button)"}
                    </button>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(saved.link);
                          flash("link");
                        }}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      >
                        {copied === "link" ? "Copied" : "Copy link only"}
                      </button>
                      <a href={`${saved.link}?preview=1`} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-slate-200 px-3 py-2 text-center text-sm">
                        Open the page
                      </a>
                      <button onClick={() => download(take.blob, `${title || "video"}.${extFor(take.mime)}`)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                        Download video
                      </button>
                      <button
                        onClick={() => take.gif && download(take.gif, `${title || "video"}.gif`)}
                        disabled={!take.gif}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-40"
                      >
                        Download GIF
                      </button>
                    </div>
                    <p className="mt-3 text-xs text-slate-500">
                      The link also shows the thumbnail when you paste it into WhatsApp or LinkedIn. To put it on a spec, choose it under &ldquo;Your video&rdquo; when you send one.
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button onClick={retake} className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                        Record another
                      </button>
                      <Link href="/crm/videos" className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-center text-sm">
                        All videos
                      </Link>
                    </div>
                  </>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
