export type {
  ProductGroupId,
  ProductGroup,
  ProductCategory,
} from "@/data/categories";
export type { Product } from "@/data/products";
export type { CollectionItem } from "@/data/collections";
export type { ProjectType, ProjectItem } from "@/data/projects";
export type { EditorialArticle } from "@/data/editorial";
export type { BrandConfig } from "@/config/brand";

export type ArticleKind = "library" | "news";

export interface ArticleRecord {
  id?: string;
  slug: string;
  kind: ArticleKind;
  title: string;
  category: string;
  date: string;
  readTime: string;
  excerpt: string;
  coverImage: string;
  isHero?: boolean;
  keyPoints?: string[];
  sourceLabel?: string;
  sourceUrl?: string;
  sections: { heading: string; paragraphs: string[] }[];
  isPublished?: boolean;
  sortOrder?: number;
}

export type LeadStatus = "new" | "contacted" | "quoted" | "closed";

export interface ContactLead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  message: string;
  source: string;
  status: LeadStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}
