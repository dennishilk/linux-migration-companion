import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cwd } from "node:process";
import { describe, expect, it } from "vitest";

const canonicalUrl = "https://www.dennishilk.com/linux-migration-companion/";
const socialImageUrl = `${canonicalUrl}social-card.png`;

function sourceDocument(): Document {
  const html = readFileSync(resolve(cwd(), "index.html"), "utf8");
  return new DOMParser().parseFromString(html, "text/html");
}

function meta(document: Document, selector: string): string | null {
  return document.querySelector<HTMLMetaElement>(selector)?.content ?? null;
}

describe("release SEO metadata", () => {
  it("publishes one indexable canonical URL for every application state", () => {
    const document = sourceDocument();

    expect(document.documentElement.lang).toBe("en");
    expect(document.title).toBe(
      "Linux Migration Companion | Windows-to-Linux Planning"
    );
    expect(meta(document, 'meta[name="robots"]')).toBe(
      "index, follow, max-image-preview:large, max-snippet:-1"
    );
    const description = meta(document, 'meta[name="description"]');
    expect(description?.length).toBeGreaterThanOrEqual(120);
    expect(description?.length).toBeLessThanOrEqual(160);
    expect(meta(document, 'meta[name="author"]')).toBe("Dennis Hilk");
    expect(meta(document, 'meta[name="copyright"]')).toBe(
      "© 2026 Dennis Hilk"
    );
    expect(
      document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href
    ).toBe(canonicalUrl);
    expect(canonicalUrl).not.toContain("?step=");
    expect(document.querySelectorAll('link[rel="alternate"][hreflang]')).toHaveLength(0);
    expect(
      document
        .querySelector<HTMLLinkElement>('link[rel="icon"]')
        ?.getAttribute("href")
    ).toBe("%BASE_URL%favicon.svg");
    expect(
      document.querySelector<HTMLLinkElement>('link[rel="license"]')?.href
    ).toBe(
      "https://github.com/dennishilk/linux-migration-companion/blob/main/LICENSE"
    );
  });

  it("provides complete Open Graph and X card metadata", () => {
    const document = sourceDocument();

    expect(meta(document, 'meta[property="og:type"]')).toBe("website");
    expect(meta(document, 'meta[property="og:site_name"]')).toBe(
      "Linux Migration Companion"
    );
    expect(meta(document, 'meta[property="og:url"]')).toBe(canonicalUrl);
    expect(meta(document, 'meta[property="og:locale"]')).toBe("en_US");
    expect(meta(document, 'meta[property="og:locale:alternate"]')).toBe("de_DE");
    expect(meta(document, 'meta[property="og:image"]')).toBe(socialImageUrl);
    expect(meta(document, 'meta[property="og:image:width"]')).toBe("1200");
    expect(meta(document, 'meta[property="og:image:height"]')).toBe("630");
    expect(meta(document, 'meta[property="og:image:alt"]')).toBeTruthy();
    expect(meta(document, 'meta[name="twitter:card"]')).toBe(
      "summary_large_image"
    );
    expect(meta(document, 'meta[name="twitter:image"]')).toBe(socialImageUrl);
    expect(meta(document, 'meta[name="twitter:image:alt"]')).toBeTruthy();
  });

  it("describes only supported WebApplication facts in JSON-LD", () => {
    const document = sourceDocument();
    const node = document.querySelector('script[type="application/ld+json"]');
    const data = JSON.parse(node?.textContent ?? "{}") as Record<string, unknown>;

    expect(data).toMatchObject({
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Linux Migration Companion",
      url: canonicalUrl,
      applicationCategory: "UtilitiesApplication",
      softwareVersion: "0.3.0-rc.2",
      isAccessibleForFree: true,
      inLanguage: ["en", "de"],
      license: "https://opensource.org/license/mit",
      codeRepository:
        "https://github.com/dennishilk/linux-migration-companion"
    });
    expect(data).not.toHaveProperty("aggregateRating");
    expect(data).not.toHaveProperty("review");
    expect(data).not.toHaveProperty("offers");
  });

  it("ships an allow-all subpath robots file and one-URL sitemap", () => {
    const robots = readFileSync(resolve(cwd(), "public", "robots.txt"), "utf8");
    const sitemap = readFileSync(resolve(cwd(), "public", "sitemap.xml"), "utf8");
    const parsedSitemap = new DOMParser().parseFromString(
      sitemap,
      "application/xml"
    );

    expect(robots).toContain("User-agent: *");
    expect(robots).toContain("Allow: /");
    expect(robots).not.toContain("Disallow: /");
    expect(robots).toContain(`Sitemap: ${canonicalUrl}sitemap.xml`);
    expect(
      Array.from(parsedSitemap.getElementsByTagName("loc"), (node) =>
        node.textContent?.trim()
      )
    ).toEqual([canonicalUrl]);
  });

  it("publishes a 1200 by 630 PNG social image", () => {
    const image = readFileSync(resolve(cwd(), "public", "social-card.png"));

    expect(image.subarray(1, 4).toString("ascii")).toBe("PNG");
    expect(image.readUInt32BE(16)).toBe(1200);
    expect(image.readUInt32BE(20)).toBe(630);
  });
});
