import { NextResponse } from "next/server";
import {
  extractHtmlFromText,
  getResponseOutputText,
  saveHtml,
} from "@/lib/make-web";
import { revalidatePath } from "next/cache";
import type { ResponseInput } from "@/lib/make-web";

export const runtime = "nodejs";

function sanitizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

const SYSTEM_PROMPT = `
You are a world-class web game designer and frontend developer. Generate a single, complete, valid HTML document for a simple, fun, interactive game that uses the image from the provided URL as the main visual element.

RULES:
1. OUTPUT
   - Return only the HTML document inside a single \`\`\`html code block.
   - The HTML can load the provided image directly from its URL (no need to embed it as base64).
   - If an image URL is provided, use the literal placeholder {{IMAGE_URL}} wherever the image URL is needed (e.g., <img src="{{IMAGE_URL}}"> or CSS background). The server will replace this placeholder with the actual URL.

2. IMAGE USAGE
   - Use the provided image directly in the game (e.g., as the main object, clickable target, draggable object).
   - If the image has distinct elements or colors, incorporate them into the gameplay idea.
   - If no image URL is provided, show a simple placeholder.

3. GAME DESIGN
   - Keep the game **very simple** — no complex mechanics or heavy logic.
   - Playable instantly without extra setup.
   - Include basic instructions, score, and a restart button.
   - Support mouse and touch (keyboard optional).
   - Works in any modern browser.

4. CODE STYLE
   - Use semantic HTML, responsive inline CSS, and minimal clean JavaScript.
   - Short comments only for explaining how the image is used.
   - No external JS/CSS libraries, tracking, or analytics.

GOAL:
Produce a small, working, fun game that directly incorporates the image from the provided URL.

END.
`;

export async function POST(request: Request) {
  try {
    const { prompt, imageDataUrl, imageLocalPath, slug } =
      (await request.json()) as {
        prompt: string;
        imageDataUrl?: string;
        imageLocalPath?: string;
        slug?: string;
      };
    console.log("[api/generate] request", {
      hasPrompt: Boolean(prompt),
      promptLength: typeof prompt === "string" ? prompt.length : undefined,
      hasImage: Boolean(imageDataUrl),
      imagePreview: imageDataUrl?.slice(0, 32),
      hasLocalPath: Boolean(imageLocalPath),
      localPathPreview: imageLocalPath?.slice(0, 64),
      hasSlug: Boolean(slug),
      slugLength: typeof slug === "string" ? slug.length : undefined,
    });
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "`prompt` must be a non-empty string" },
        { status: 400 }
      );
    }

    const userContent = [
      { type: "input_text", text: prompt },
      ...(imageDataUrl
        ? [
            {
              type: "input_text",
              text: "Use the literal placeholder {{IMAGE_URL}} wherever the image URL is needed in the HTML.",
            },
          ]
        : []),
      ...(imageLocalPath && imageLocalPath.trim().length > 0
        ? [
            {
              type: "input_text",
              text: `Important: Include this exact local image path string somewhere in the output HTML (e.g., inside a comment or instructions): ${imageLocalPath}`,
            },
          ]
        : []),
      ...(imageDataUrl
        ? [{ type: "input_image", image_url: imageDataUrl, detail: "auto" }]
        : []),
    ];

    const input = [
      {
        role: "system",
        content: [{ type: "input_text", text: SYSTEM_PROMPT }],
      },
      {
        role: "user",
        content: userContent,
      },
    ] as unknown as ResponseInput;

    const startedAt = Date.now();
    const responseText = await getResponseOutputText(input);
    const html = extractHtmlFromText(responseText);
    const finalHtml = imageDataUrl
      ? html.replaceAll("{{IMAGE_URL}}", imageDataUrl)
      : html;
    const durationMs = Date.now() - startedAt;
    console.log("[api/generate] success", {
      durationMs,
      htmlLength: finalHtml.length,
    });

    // If a slug was provided, save immediately and return the generated page URL
    if (slug && typeof slug === "string" && slug.trim().length > 0) {
      const safe = sanitizeSlug(slug);
      const filename = safe.endsWith(".html") ? safe : `${safe}.html`;
      const saveStartedAt = Date.now();
      await saveHtml(finalHtml, filename);
      const saveDurationMs = Date.now() - saveStartedAt;
      console.log("[api/generate] saved", {
        saveDurationMs,
        filename,
      });
      revalidatePath(`/generated/${safe}`);
      return NextResponse.json({ url: `/generated/${safe}`, slug: safe });
    }

    // Fallback: return HTML for clients that still preview in-memory
    return NextResponse.json({ html: finalHtml });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[api/generate] error", { message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
