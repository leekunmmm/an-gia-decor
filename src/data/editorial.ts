export interface EditorialArticle {
  slug: string;
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
}

export const libraryArticles: EditorialArticle[] = [];

export const newsArticles: EditorialArticle[] = [];
