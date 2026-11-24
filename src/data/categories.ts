export type ProductGroupId =
  | "sofa"
  | "phong-khach"
  | "phong-an"
  | "phong-ngu"
  | "phong-lam-viec"
  | "decor";

export interface ProductGroup {
  id: ProductGroupId;
  name: string;
  description: string;
}

export interface ProductCategory {
  slug: string;
  title: string;
  groupId: ProductGroupId;
  groupName: string;
  bannerImage: string;
  previewImage: string;
  subcategories: string[];
  description: string;
}

export const productGroups: ProductGroup[] = [
  {
    id: "sofa",
    name: "Sofa",
    description: "Các dòng sofa thiết kế thủ công từ da chống trầy, nhung cao cấp và gỗ tự nhiên.",
  },
  {
    id: "phong-khach",
    name: "Phòng khách",
    description: "Bàn trà mặt đá, kệ tivi và tủ trang trí định hình điểm nhấn không gian tiếp đón.",
  },
  {
    id: "phong-an",
    name: "Phòng ăn",
    description: "Bàn ăn đá phiến nung kết, ghế bọc da và hệ tủ trưng bày chuẩn mực thẩm mỹ.",
  },
  {
    id: "phong-ngu",
    name: "Phòng ngủ",
    description: "Giường ngủ bọc da êm ái, tab đầu giường gỗ óc chó và bàn trang điểm tinh giản.",
  },
  {
    id: "phong-lam-viec",
    name: "Phòng làm việc",
    description: "Bàn giám đốc, ghế công thái học bọc da và kệ sách kiến trúc chuyên biệt.",
  },
  {
    id: "decor",
    name: "Decor & Ánh sáng",
    description: "Thảm dệt tay, đèn đồng thau, tranh nghệ thuật và gương trang trí hoàn thiện không gian.",
  },
];

export const categories: ProductCategory[] = [];
