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
  params: { slug: string };
}) {
  const { slug } = params;
  const html = await readHtmlForSlug(slug);
  if (!html) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-2">Not found</h1>
        <p>No generated page found for slug: {slug}</p>
      </div>
    );
  }

  // Render inside an iframe so inline <script> tags execute
  return (
    <div className="w-screen min-h-screen">
      <iframe
        title={`generated-${slug}`}
        className="w-screen h-[100vh] border-0"
        srcDoc={html}
        // Allow scripts and input interactions inside the iframe
        sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock"
      />
    </div>
  );
}
