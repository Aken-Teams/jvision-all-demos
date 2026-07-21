import "server-only";

import { get, put } from "@vercel/blob";
import { products as fallbackProducts, type Product } from "../data/products";

const catalogPath = "showcase/products.json";

function isProduct(value: unknown): value is Product {
  if (!value || typeof value !== "object") return false;
  const product = value as Partial<Product>;
  return Number.isInteger(product.id)
    && typeof product.name === "string"
    && typeof product.module === "string"
    && typeof product.description === "string"
    && typeof product.demoUrl === "string"
    && typeof product.githubUrl === "string"
    && typeof product.category === "string"
    && typeof product.slug === "string";
}

export async function getManagedProducts(): Promise<Product[]> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return fallbackProducts;

  try {
    const result = await get(catalogPath, { access: "private", useCache: false });
    if (!result || result.statusCode !== 200) return fallbackProducts;
    const data = JSON.parse(await new Response(result.stream).text()) as unknown;
    return Array.isArray(data) && data.every(isProduct) ? data : fallbackProducts;
  } catch {
    return fallbackProducts;
  }
}

export async function saveManagedProducts(products: Product[]) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("尚未設定 Vercel Blob 儲存空間");
  }

  await put(catalogPath, JSON.stringify(products, null, 2), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 60,
    contentType: "application/json; charset=utf-8",
  });
}
