import "server-only";
import { openai } from "@/lib/openai";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type OpenAI from "openai";

// Resolve the directory of this module similar to Python's __file__ parent
const thisFilePath = fileURLToPath(import.meta.url);
const thisDir = path.dirname(thisFilePath);

export type ResponseInput = OpenAI.Responses.ResponseCreateParams["input"];

export async function getResponseOutputText(
  input: string | ResponseInput
): Promise<string> {
  const startedAt = Date.now();
  console.log("[lib/make-web] openai call start");
  const response = await openai.responses.create({
    // model: "gpt-5-nano",
    // model: "gpt-5",
    model: "gpt-5-mini",
    input,
  });
  const durationMs = Date.now() - startedAt;
  console.log("[lib/make-web] openai call end", { durationMs });

  // Prefer the convenience field if present; otherwise assemble text manually
  const outputText = (
    response as unknown as { output_text?: string } | undefined
  )?.output_text;
  if (outputText && outputText.length > 0) {
    return outputText;
  }

  // Fallback: concatenate text parts from the structured output
  const parts: string[] = [];
  const output =
    (response as unknown as { output?: Array<unknown> } | undefined)?.output ??
    [];
  for (const item of output) {
    const contents =
      (item as { content?: Array<unknown> } | undefined)?.content ?? [];
    for (const content of contents) {
      const c = content as { type?: string; text?: { value?: string } };
      if (c.type === "output_text" && c.text?.value) {
        parts.push(c.text.value);
      }
    }
  }
  return parts.join("\n");
}

export function extractHtmlFromText(text: string): string {
  // Extract an ```html ... ``` block; fallback to first ```...``` block; else full text
  const htmlBlock = /```html\s*([\s\S]*?)\s*```/i.exec(text);
  if (htmlBlock) return htmlBlock[1];
  const anyBlock = /```\s*([\s\S]*?)\s*```/.exec(text);
  if (anyBlock) return anyBlock[1];
  return text;
}

export async function saveHtml(
  html: string,
  filename: string
): Promise<string> {
  const outputsDir = path.join(thisDir, "outputs");
  await fs.mkdir(outputsDir, { recursive: true });
  const filePath = path.join(outputsDir, filename);
  await fs.writeFile(filePath, html, { encoding: "utf8" });
  return filePath;
}

export async function encodeImage(imagePath: string): Promise<string> {
  const data = await fs.readFile(imagePath);
  return data.toString("base64");
}

// keep encodeImage for potential image inputs to the model

/**
How to include an image in the generation input (short):

```ts
import path from "node:path";
import {
  encodeImage,
  getResponseOutputText,
  extractHtmlFromText,
  type ResponseInput,
} from "@/lib/make-web";

async function generateWithImage() {
  const imagePath = path.resolve(process.cwd(), "public/example.png");
  const encoded = await encodeImage(imagePath); // base64 string (no prefix)

  const input: ResponseInput = [
    {
      role: "user",
      content: [
        { type: "input_text", text: "Create a landing page matching this image's style" },
        {
          type: "input_image",
          image_url: `data:image/png;base64,${encoded}`,
          detail: "auto",
        },
      ],
    },
  ];

  const text = await getResponseOutputText(input);
  const html = extractHtmlFromText(text);
  return html; // render in UI or save with saveHtml(html, "my-page.html")
}
```

Notes:
- Use the correct MIME in the `image_url` prefix (e.g., `image/jpeg`).
- For UI-only flows, send the base64 to your API or extend `/api/generate` to accept `input_image` content.
*/
