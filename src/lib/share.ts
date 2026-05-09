import type { Play } from "./types";

// Base64-url helpers
const toBase64Url = (s: string) =>
  btoa(unescape(encodeURIComponent(s)))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
const fromBase64Url = (s: string) => {
  const b = s.replaceAll("-", "+").replaceAll("_", "/");
  const pad = b.length % 4 === 0 ? "" : "=".repeat(4 - (b.length % 4));
  return decodeURIComponent(escape(atob(b + pad)));
};

export function encodePlayToUrl(play: Play): string {
  const slim = { ...play, custom: true };
  const json = JSON.stringify(slim);
  return `${window.location.origin}${window.location.pathname}#p=${toBase64Url(json)}`;
}

export function decodePlayFromHash(hash: string): Play | null {
  if (!hash) return null;
  const m = hash.match(/p=([^&]+)/);
  if (!m) return null;
  try {
    const json = fromBase64Url(m[1]);
    const obj = JSON.parse(json);
    if (!obj || !Array.isArray(obj.receivers)) return null;
    return obj as Play;
  } catch {
    return null;
  }
}

// Convert an SVG element to a PNG data URL
export async function svgToPngDataUrl(svg: SVGSVGElement, scale = 2): Promise<string> {
  const xml = new XMLSerializer().serializeToString(svg);
  const svgBlob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = (e) => rej(e);
      img.src = url;
    });
    const w = (svg.viewBox.baseVal?.width || svg.clientWidth || 800) * scale;
    const h = (svg.viewBox.baseVal?.height || svg.clientHeight || 800) * scale;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#1a2820";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
