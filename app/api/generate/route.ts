import { NextResponse } from "next/server";
import { extractHtmlFromText, getResponseOutputText } from "@/lib/make-web";
import type { ResponseInput } from "@/lib/make-web";

export const runtime = "nodejs";

const SYSTEM_PROMPT =
  "You are a world-class web game designer and frontend developer. Generate a complete, valid, self-contained HTML document. The goal is to use the image input user provided, and generate a interactive game that is fun and engaging. Use semantic HTML, responsive CSS (inline <style> is fine), and no external network calls. Return your result inside a single ```html code block.";

export async function POST(request: Request) {
  try {
    const { prompt, imageDataUrl } = (await request.json()) as {
      prompt: string;
      imageDataUrl?: string;
    };
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

    const responseText = await getResponseOutputText(input);
    const html = extractHtmlFromText(responseText);
    return NextResponse.json({ html });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
