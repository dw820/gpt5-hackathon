"use client";

import { useState, useTransition } from "react";

export default function StudioPage() {
  const [prompt, setPrompt] = useState("");
  const [html, setHtml] = useState<string>("");
  const [slug, setSlug] = useState("");
  const [isPending, startTransition] = useTransition();
  const [imageDataUrl, setImageDataUrl] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  async function onFileChange(file?: File | null) {
    if (!file) {
      setImageDataUrl("");
      return;
    }
    const reader = new FileReader();
    const done = new Promise<string>((resolve) => {
      reader.onload = () => resolve(String(reader.result || ""));
    });
    reader.readAsDataURL(file);
    const dataUrl = await done;
    setImageDataUrl(dataUrl);
    console.log("[studio] image selected", {
      sizeBytes: dataUrl.length,
      mime: dataUrl.slice(5, dataUrl.indexOf(";")),
    });
  }

  async function generate() {
    if (!prompt.trim()) return;
    setError(null);
    setStatus("Generating...");
    const startedAt = Date.now();
    console.log("[studio] generate start", {
      promptLength: prompt.length,
      hasImage: Boolean(imageDataUrl),
    });
    startTransition(async () => {
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            imageDataUrl: imageDataUrl || undefined,
          }),
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(
            `Request failed: ${res.status} ${res.statusText} - ${text}`
          );
        }
        const data = await res.json();
        setHtml(data.html ?? "");
        const durationMs = Date.now() - startedAt;
        console.log("[studio] generate success", {
          durationMs,
          htmlLength: (data.html ?? "").length,
        });
        setStatus("Generation complete");
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[studio] generate error", { message });
        setError(message);
        setStatus("");
      }
    });
  }

  async function save() {
    if (!html || !slug.trim()) return;
    setError(null);
    setStatus("Saving...");
    setIsSaving(true);
    const startedAt = Date.now();
    console.log("[studio] save start", {
      slugLength: slug.length,
      htmlLength: html.length,
    });
    try {
      const res = await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html, slug }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(
          `Request failed: ${res.status} ${res.statusText} - ${text}`
        );
      }
      const data = await res.json();
      const durationMs = Date.now() - startedAt;
      console.log("[studio] save success", { durationMs, url: data.url });
      if (data.url) {
        window.location.href = data.url as string;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[studio] save error", { message });
      setError(message);
      setStatus("");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h1 className="text-2xl font-semibold mb-4">Game Generator</h1>
        <textarea
          className="w-full h-40 p-3 border rounded mb-3"
          placeholder="Describe the game you want to generate..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <div className="flex gap-2">
          <button
            onClick={generate}
            disabled={isPending || isSaving}
            className="px-4 py-2 bg-black text-white rounded disabled:opacity-50"
          >
            <span className="inline-flex items-center gap-2">
              {isPending && (
                <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              )}
              {isPending ? "Generating..." : "Generate"}
            </span>
          </button>
          <label className="px-3 py-2 border rounded cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => onFileChange(e.target.files?.[0])}
              className="hidden"
            />
            {imageDataUrl ? "Image selected" : "Attach image"}
          </label>
          <input
            className="border rounded px-2"
            placeholder="slug (e.g. login-page)"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
          <button
            onClick={save}
            disabled={!html || !slug || isPending || isSaving}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            <span className="inline-flex items-center gap-2">
              {isSaving && (
                <span className="inline-block w-4 h-4 border-2 border-black/40 border-t-black rounded-full animate-spin" />
              )}
              {isSaving ? "Saving..." : "Save & Open"}
            </span>
          </button>
        </div>
        {(status || error) && (
          <div className="mt-3 text-sm">
            {status && <div className="text-gray-600">{status}</div>}
            {error && <div className="text-red-600">{error}</div>}
          </div>
        )}
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-2">Live Preview</h2>
        <div className="relative border rounded min-h-40">
          {html ? (
            <iframe
              title="preview"
              className="w-full h-[70vh]"
              srcDoc={html}
              sandbox="allow-scripts allow-forms allow-popups allow-same-origin"
            />
          ) : (
            <div className="p-4 text-gray-500">No preview yet</div>
          )}
          {isPending && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center rounded">
              <div className="flex items-center gap-3 text-gray-800">
                <span className="inline-block w-6 h-6 border-2 border-gray-400 border-t-black rounded-full animate-spin" />
                Generating preview...
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
