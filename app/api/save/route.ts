import { NextResponse } from "next/server";
import { saveHtml } from "@/lib/make-web";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

function sanitizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export async function POST(request: Request) {
  try {
    const { html, slug } = (await request.json()) as {
      html: string;
      slug: string;
    };
    console.log("[api/save] request", {
      hasHtml: Boolean(html),
      htmlLength: typeof html === "string" ? html.length : undefined,
      hasSlug: Boolean(slug),
      slugLength: typeof slug === "string" ? slug.length : undefined,
    });
    if (!html || typeof html !== "string") {
      return NextResponse.json(
        { error: "`html` must be provided" },
        { status: 400 }
      );
    }
    if (!slug || typeof slug !== "string") {
      return NextResponse.json(
        { error: "`slug` must be provided" },
        { status: 400 }
      );
    }
    const safe = sanitizeSlug(slug);
    const filename = safe.endsWith(".html") ? safe : `${safe}.html`;
    const startedAt = Date.now();
    await saveHtml(html, filename);
    const durationMs = Date.now() - startedAt;
    console.log("[api/save] success", { durationMs, filename });
    revalidatePath(`/generated/${safe}`);
    return NextResponse.json({ url: `/generated/${safe}`, slug: safe });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[api/save] error", { message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
