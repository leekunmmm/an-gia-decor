import type { ProductGroupId } from "./categories";

export interface Product {
  slug: string;
  name: string;
  categorySlug: string;
  categoryName: string;
  groupId: ProductGroupId;
  groupName: string;
  isNew: boolean;
  priceLabel: string;
  images: string[];
  applicationImage: string;
  description: string;
  highlights: string[];
  colors: string[];
  suitableSpaces: string[];
  dimensionsAndMaterials: string;
  careInstructions: string;
  relatedSlugs: string[];
}

export const products: Product[] = [];

export function normalizeVi(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();
}
