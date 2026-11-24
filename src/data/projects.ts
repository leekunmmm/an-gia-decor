export type ProjectType = "nha-pho" | "van-phong" | "cua-hang";

export interface ProjectItem {
  slug: string;
  title: string;
  type: ProjectType;
  typeLabel: string;
  location: string;
  year: string;
  area: string;
  featured: boolean;
  coverImage: string;
  gallery: string[];
  summary: string;
  scope: string[];
}

export const projectTypeStats: {
  type: ProjectType;
  label: string;
  count: number;
  image: string;
}[] = [
  { type: "nha-pho", label: "Nhà phố", count: 0, image: "/images/project-villa.jpg" },
  { type: "van-phong", label: "Văn phòng", count: 0, image: "/images/project-office.jpg" },
  { type: "cua-hang", label: "Cửa hàng", count: 0, image: "/images/reel-showroom.jpg" },
];

export const projects: ProjectItem[] = [];
