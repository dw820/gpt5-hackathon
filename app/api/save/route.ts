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
    const { html, slug } = (await request.json()) as { html: string; slug: string };
    if (!html || typeof html !== "string") {
      return NextResponse.json({ error: "`html` must be provided" }, { status: 400 });
    }
    if (!slug || typeof slug !== "string") {
      return NextResponse.json({ error: "`slug` must be provided" }, { status: 400 });
    }
    const safe = sanitizeSlug(slug);
    const filename = safe.endsWith(".html") ? safe : `${safe}.html`;
    await saveHtml(html, filename);
    revalidatePath(`/generated/${safe}`);
    return NextResponse.json({ url: `/generated/${safe}`, slug: safe });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


