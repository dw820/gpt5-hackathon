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
You are a world-class web game designer and frontend developer. Generate a single, complete, valid, self-contained HTML document for a simple, fun, interactive game that uses the user's provided image as the main visual element.

RULES:
1. OUTPUT
   - Return only the HTML document inside a single \`\`\`html code block.
   - Must be fully self-contained: no external assets, fonts, scripts, or network calls.

2. IMAGE USAGE
   - Use the provided image directly in the game (e.g., as a background, target, or draggable object).
   - If the image has distinct elements or colors, incorporate them into the gameplay (e.g., collect items of a certain color from the image).
   - If no image is provided, create a simple inline SVG placeholder.

3. GAME DESIGN
   - Keep the game **very simple** — no complex mechanics.
   - Must be playable instantly without extra user input beyond interacting with the game.
   - Show basic instructions, score, and a restart button.
   - Support mouse, touch, and keyboard if relevant.
   - Game should run smoothly in any modern browser.

4. CODE STYLE
   - Use semantic HTML and responsive inline CSS.
   - Use minimal, clean JavaScript inside a single \`<script>\` tag.
   - Add short code comments only for image→game mapping.
   - Avoid heavy logic, large code, or complex physics.

5. SAFETY & ACCESSIBILITY
   - No personal claims about real people in images.
   - Include \`alt\` text and basic ARIA labels.
   - No external dependencies, tracking, or analytics.

GOAL:
Produce a small, working, fun game that directly incorporates the user’s image and can be played in 30–60 seconds.

END.
`;

export async function POST(request: Request) {
  try {
    const { prompt, imageDataUrl, slug } = (await request.json()) as {
      prompt: string;
      imageDataUrl?: string;
      slug?: string;
    };
    console.log("[api/generate] request", {
      hasPrompt: Boolean(prompt),
      promptLength: typeof prompt === "string" ? prompt.length : undefined,
      hasImage: Boolean(imageDataUrl),
      imagePreview: imageDataUrl?.slice(0, 32),
      hasSlug: Boolean(slug),
      slugLength: typeof slug === "string" ? slug.length : undefined,
    });
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "`prompt` must be a non-empty string" },
        { status: 400 }
      );
    }

    const input = [
      {
        role: "system",
        content: [{ type: "input_text", text: SYSTEM_PROMPT }],
      },
      {
        role: "user",
        content: [
          { type: "input_text", text: prompt },
          ...(imageDataUrl
            ? [{ type: "input_image", image_url: imageDataUrl, detail: "auto" }]
            : []),
        ],
      },
    ] as unknown as ResponseInput;

    const startedAt = Date.now();
    const responseText = await getResponseOutputText(input);
    const html = extractHtmlFromText(responseText);
    const durationMs = Date.now() - startedAt;
    console.log("[api/generate] success", {
      durationMs,
      htmlLength: html.length,
    });

    // If a slug was provided, save immediately and return the generated page URL
    if (slug && typeof slug === "string" && slug.trim().length > 0) {
      const safe = sanitizeSlug(slug);
      const filename = safe.endsWith(".html") ? safe : `${safe}.html`;
      const saveStartedAt = Date.now();
      await saveHtml(html, filename);
      const saveDurationMs = Date.now() - saveStartedAt;
      console.log("[api/generate] saved", {
        saveDurationMs,
        filename,
      });
      revalidatePath(`/generated/${safe}`);
      return NextResponse.json({ url: `/generated/${safe}`, slug: safe });
    }

    // Fallback: return HTML for clients that still preview in-memory
    return NextResponse.json({ html });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[api/generate] error", { message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
