export const brandConfig = {
  name: "An Gia Decor",
  shortName: "AN GIA",
  subName: "decor",
  monogram: "AG",
  domain: "angiadecor.vn",
  tagline: "Giải pháp nội thất tinh tuyển cho không gian sống đương đại",
  description:
    "An Gia Decor thiết kế, chế tác và phân phối sofa, bàn trà, giường ngủ và giải pháp nội thất kiến trúc cao cấp tại TP.HCM.",
  hotline: "0908 686 868",
  hotlineRaw: "0908686868",
  email: "sale@angiadecor.vn",
  zaloUrl: "https://zalo.me/0908686868",
  messengerUrl: "https://m.me/angiadecor.vn",
  tiktokUrl: "https://www.tiktok.com/@noithathiendai10",
  shopeeUrl: "https://shopee.vn",
  address: "188 Nguyễn Cơ Thạch, KĐT Sala, TP. Thủ Đức, TP. Hồ Chí Minh",
  hours: "08:30 – 20:30 hằng ngày (kể cả Chủ Nhật)",
  mapEmbedUrl:
    "https://www.openstreetmap.org/export/embed.html?bbox=106.712%2C10.764%2C106.736%2C10.784&layer=mapnik",
  experienceStat: "10+",
  experienceLabel: "năm kinh nghiệm · showroom TP.HCM",
  copyrightYear: "2026",
  logos: {
    horizontal: "/images/an-gia-decor-logo-ngang.png",
    stacked: "/images/icon.png",
    mark: "/images/an-gia-decor-logo-full.png",
  },
} as const;

export interface BrandConfig {
  name: string;
  shortName: string;
  subName: string;
  monogram: string;
  domain: string;
  tagline: string;
  description: string;
  hotline: string;
  hotlineRaw: string;
  email: string;
  zaloUrl: string;
  messengerUrl: string;
  tiktokUrl: string;
  shopeeUrl: string;
  address: string;
  hours: string;
  mapEmbedUrl: string;
  experienceStat: string;
  experienceLabel: string;
  copyrightYear: string;
  logos: {
    horizontal: string;
    stacked: string;
    mark: string;
  };
}
