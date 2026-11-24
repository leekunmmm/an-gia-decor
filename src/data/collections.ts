export interface CollectionItem {
  slug: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  itemCount: number;
  image: string;
  hoverImage?: string;
  href: string;
}

export const collections: CollectionItem[] = [];
