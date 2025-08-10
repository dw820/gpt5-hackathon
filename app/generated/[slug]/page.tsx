import fs from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";

async function readHtmlForSlug(slug: string): Promise<string | null> {
  const filename = slug.endsWith(".html") ? slug : `${slug}.html`;
  const filePath = path.join(process.cwd(), "lib", "outputs", filename);
  try {
    const content = await fs.readFile(filePath, "utf8");
    return content;
  } catch {
    return null;
  }
}

export default async function GeneratedPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const html = await readHtmlForSlug(slug);
  if (!html) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-2">Not found</h1>
        <p>No generated page found for slug: {slug}</p>
      </div>
    );
  }
  return (
    <html>
      <head />
      <body dangerouslySetInnerHTML={{ __html: html }} />
    </html>
  );
}
