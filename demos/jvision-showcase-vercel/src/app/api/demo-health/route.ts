import { NextResponse } from "next/server";
import repositoryDates from "../../../data/repository-dates.json";
import { getManagedProducts } from "../../../lib/products-store";

export const maxDuration = 30;

type GitHubRepository = {
  html_url: string;
  created_at: string;
  pushed_at: string;
};

async function getRepositoryDates() {
  const snapshot = new Map<string, GitHubRepository>(
    Object.entries(repositoryDates).map(([url, dates]) => [url, { html_url: url, ...dates }]),
  );
  try {
    const response = await fetch("https://api.github.com/users/yunghua817/repos?per_page=100&type=public", {
      headers: { Accept: "application/vnd.github+json", "User-Agent": "Jvision-Showcase" },
      next: { revalidate: 3600 },
    });
    if (!response.ok) return snapshot;
    const repositories = await response.json() as GitHubRepository[];
    repositories.forEach((repository) => snapshot.set(repository.html_url.toLowerCase(), repository));
    return snapshot;
  } catch {
    return snapshot;
  }
}

async function checkDemo(url: string) {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(3500),
      next: { revalidate: 1800 },
    });
    return response.status >= 200 && response.status < 500 && response.status !== 404 ? "online" : "offline";
  } catch {
    return "offline";
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { slugs?: unknown } | null;
  if (!Array.isArray(body?.slugs)) return NextResponse.json({ message: "資料格式不正確" }, { status: 400 });
  const slugs = [...new Set(body.slugs.filter((slug): slug is string => typeof slug === "string"))].slice(0, 60);
  const products = (await getManagedProducts()).filter((product) => slugs.includes(product.slug));
  const repositories = await getRepositoryDates();
  const results: Record<string, { status: string; createdAt?: string; updatedAt?: string }> = {};
  let cursor = 0;

  async function worker() {
    while (cursor < products.length) {
      const product = products[cursor++];
      const repository = repositories.get(product.githubUrl.replace(/\/$/, "").toLowerCase());
      results[product.slug] = {
        status: await checkDemo(product.demoUrl),
        createdAt: repository?.created_at,
        updatedAt: repository?.pushed_at,
      };
    }
  }

  await Promise.all(Array.from({ length: Math.min(16, products.length) }, worker));
  return NextResponse.json({ results });
}
