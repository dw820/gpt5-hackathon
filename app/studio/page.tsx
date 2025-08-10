"use client";

import { useState, useTransition } from "react";

export default function StudioPage() {
  const [prompt, setPrompt] = useState("");
  const [html, setHtml] = useState<string>("");
  const [slug, setSlug] = useState("");
  const [isPending, startTransition] = useTransition();
  const [imageDataUrl, setImageDataUrl] = useState<string>("");

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
  }

  async function generate() {
    if (!prompt.trim()) return;
    startTransition(async () => {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          imageDataUrl: imageDataUrl || undefined,
        }),
      });
      const data = await res.json();
      setHtml(data.html ?? "");
    });
  }

  async function save() {
    if (!html || !slug.trim()) return;
    const res = await fetch("/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ html, slug }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url as string;
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
            disabled={isPending}
            className="px-4 py-2 bg-black text-white rounded disabled:opacity-50"
          >
            {isPending ? "Generating..." : "Generate"}
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
            disabled={!html || !slug}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Save & Open
          </button>
        </div>
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-2">Live Preview</h2>
        <div className="border rounded min-h-40">
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
        </div>
      </div>
    </div>
  );
}
