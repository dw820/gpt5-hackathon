"use client";

import { useState, useTransition } from "react";
import { generateRandomSlug } from "@/lib/utils";

export default function StudioPage() {
  const [prompt, setPrompt] = useState("");
  const [slug, setSlug] = useState("");
  const [isPending, startTransition] = useTransition();
  const [imageDataUrl, setImageDataUrl] = useState<string>("");
  const [imageLocalPath, setImageLocalPath] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  async function onFileChange(file?: File | null, localPathHint?: string) {
    if (!file) {
      setImageDataUrl("");
      setImageLocalPath("");
      return;
    }
    const reader = new FileReader();
    const done = new Promise<string>((resolve) => {
      reader.onload = () => resolve(String(reader.result || ""));
    });
    reader.readAsDataURL(file);
    const dataUrl = await done;
    setImageDataUrl(dataUrl);
    setImageLocalPath(
      localPathHint && localPathHint.trim().length > 0
        ? localPathHint
        : file.name
    );
    console.log("[studio] image selected", {
      sizeBytes: dataUrl.length,
      mime: dataUrl.slice(5, dataUrl.indexOf(";")),
      localPathPreview: (localPathHint || file.name || "").slice(0, 128),
    });
  }

  async function generate() {
    if (!prompt.trim()) return;
    let finalSlug = slug.trim();
    if (!finalSlug) {
      finalSlug = generateRandomSlug();
      setSlug(finalSlug);
    }
    setError(null);
    setStatus("Generating...");
    const startedAt = Date.now();
    console.log("[studio] generate start", {
      promptLength: prompt.length,
      hasImage: Boolean(imageDataUrl),
      hasLocalPath: Boolean(imageLocalPath),
      slugLength: finalSlug.length,
    });
    startTransition(async () => {
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            imageDataUrl: imageDataUrl || undefined,
            imageLocalPath: imageLocalPath || undefined,
            slug: finalSlug,
          }),
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(
            `Request failed: ${res.status} ${res.statusText} - ${text}`
          );
        }
        const data = await res.json();
        const durationMs = Date.now() - startedAt;
        console.log("[studio] generate success", {
          durationMs,
          hasUrl: Boolean(data?.url),
        });
        if (data?.url) {
          window.location.href = data.url as string;
          return;
        }
        setStatus("Generation complete (no URL returned)");
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[studio] generate error", { message });
        setError(message);
        setStatus("");
      }
    });
  }

  // Save step removed: generation now persists directly when a slug is provided

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
            disabled={isPending}
            className="px-4 py-2 bg-black text-white rounded disabled:opacity-50"
          >
            <span className="inline-flex items-center gap-2">
              {isPending && (
                <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              )}
              {isPending ? "Generating..." : "Generate & Save"}
            </span>
          </button>
          <label className="px-3 py-2 border rounded cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                onFileChange(e.target.files?.[0], e.target.value)
              }
              className="hidden"
            />
            {imageDataUrl ? "Image selected" : "Attach image"}
          </label>
          <input
            className="border rounded px-2"
            placeholder="slug (optional; auto-generated if empty)"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
          {/* Saving is now part of generation */}
        </div>
        {(status || error) && (
          <div className="mt-3 text-sm">
            {status && <div className="text-gray-600">{status}</div>}
            {error && <div className="text-red-600">{error}</div>}
          </div>
        )}
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-2">Saved Page</h2>
        <div className="relative border rounded min-h-40 p-4 text-gray-600">
          {isPending ? (
            <div className="flex items-center gap-3">
              <span className="inline-block w-6 h-6 border-2 border-gray-400 border-t-black rounded-full animate-spin" />
              Generating and saving...
            </div>
          ) : (
            <div>
              Click "Generate & Save". You'll be redirected to /generated/
              {slug || "your-slug"} when done.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
