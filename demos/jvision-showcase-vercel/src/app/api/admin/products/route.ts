import { NextResponse } from "next/server";
import type { Product } from "../../../../data/products";
import { getManagedProducts, saveManagedProducts } from "../../../../lib/products-store";

function validUrl(value: string, allowRelative = false) {
  if (allowRelative && value.startsWith("/")) return true;
  try { return new URL(value).protocol === "https:"; } catch { return false; }
}

function validateProducts(value: unknown): value is Product[] {
  if (!Array.isArray(value) || value.length > 200) return false;
  const ids = new Set<number>();
  const slugs = new Set<string>();
  return value.every((item) => {
    if (!item || typeof item !== "object") return false;
    const product = item as Partial<Product>;
    if (!Number.isInteger(product.id) || ids.has(product.id as number)) return false;
    if (typeof product.slug !== "string" || !product.slug.trim() || slugs.has(product.slug)) return false;
    ids.add(product.id as number);
    slugs.add(product.slug);
    return [product.name, product.module, product.description, product.category]
      .every((field) => typeof field === "string" && field.trim().length > 0)
      && typeof product.demoUrl === "string" && validUrl(product.demoUrl)
      && typeof product.githubUrl === "string" && validUrl(product.githubUrl)
      && (product.posterUrl === undefined || product.posterUrl === "" || validUrl(product.posterUrl, true))
      && (product.visible === undefined || typeof product.visible === "boolean");
  });
}

export async function GET() {
  return NextResponse.json({ products: await getManagedProducts() });
}

export async function PUT(request: Request) {
  const body = await request.json().catch(() => null) as { products?: unknown } | null;
  if (!validateProducts(body?.products)) return NextResponse.json({ message: "資料格式不正確，請檢查必填欄位與網址" }, { status: 400 });
  await saveManagedProducts(body.products);
  return NextResponse.json({ ok: true, count: body.products.length });
}
