import type { ProductGroupId } from "./categories";

export interface HeroSlide {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  image: string;
  videoUrl?: string;
}

export interface VideoReel {
  id: string;
  title: string;
  duration: string;
  views: string;
  categoryLabel: string;
  posterImage: string;
  videoUrl?: string;
  tiktokVideoId?: string;
  tiktokUrl?: string;
  linkedHref: string;
}

export interface SpotlightData {
  eyebrow: string;
  label: string;
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
  image: string;
  posterImage?: string;
  videoUrl?: string;
}

export interface FeaturedTile {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
  image: string;
  hoverImage: string;
}

export interface ServiceItem {
  number: string;
  title: string;
  summary: string;
  image: string;
}

export interface HotspotItem {
  id: string;
  label: string;
  x: number;
  y: number;
  productSlug: string;
  productName: string;
  categoryName: string;
  priceLabel: string;
  image: string;
}

export interface DreamScene {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  image: string;
  hotspots: HotspotItem[];
}

export interface RoomApplication {
  id: string;
  label: string;
  description: string;
  image: string;
  hotspots: HotspotItem[];
}

export const heroSlides: HeroSlide[] = [
  {
    id: "slide-leather",
    eyebrow: "BỘ SƯU TẬP 2026 · DA CHỐNG TRẦY",
    title: "BỌC DA CHỐNG TRẦY THẾ HỆ MỚI",
    subtitle:
      "Bề mặt êm mịn tự nhiên, kháng trầy xước vượt trội trước sinh hoạt gia đình và thú cưng, giữ trọn phom dáng kiến trúc suốt nhiều năm.",
    ctaLabel: "Khám phá ngay",
    ctaHref: "/danh-muc/sofa-da-chong-tray",
    image: "/images/hero-leather.jpg",
    videoUrl: "/videos/luxury-suite-pan.mp4",
  },
  {
    id: "slide-velvet",
    eyebrow: "CHẤT LIỆU ĐƯƠNG ĐẠI · NHUNG BỈ",
    title: "VẢI NHUNG LÌ CHIỀU SÂU ÁNH SÁNG",
    subtitle:
      "Từng đường bo cong uốn lượn kết hợp sắc ngọc lục bảo và gam trầm sang trọng tạo điểm nhấn điện ảnh cho phòng khách tối giản.",
    ctaLabel: "Xem dòng nhung",
    ctaHref: "/danh-muc/sofa-vai-nhung",
    image: "/images/hero-velvet.jpg",
    videoUrl: "/videos/modern-interior.mp4",
  },
  {
    id: "slide-classic",
    eyebrow: "DI SẢN THỦ CÔNG · CHẾ TÁC TINH XẢO",
    title: "NÉT CỔ ĐIỂN VƯỢT THỜI GIAN",
    subtitle:
      "Sự giao thoa giữa gỗ óc chó Bắc Mỹ, vải boucle nhập khẩu và phụ kiện đồng thau tạo nên không gian sống điềm tĩnh và chuẩn mực.",
    ctaLabel: "Xem bộ sưu tập",
    ctaHref: "/bo-suu-tap",
    image: "/images/hero-classic.jpg",
    videoUrl: "/videos/decor-room.mp4",
  },
];

export const videoReels: VideoReel[] = [
  {
    id: "tiktok-7636224163027406098",
    title: "Thiết kế căn hộ tông xám chì – đen – trắng hiện đại, tối ưu không gian mở",
    duration: "TikTok",
    views: "156.5K lượt xem",
    categoryLabel: "Căn hộ hiện đại",
    posterImage: "/images/tiktok/7636224163027406098.jpg",
    videoUrl: "",
    tiktokVideoId: "7636224163027406098",
    tiktokUrl: "https://www.tiktok.com/@noithathiendai10/video/7636224163027406098",
    linkedHref: "/danh-muc/phong-khach",
  },
  {
    id: "tiktok-7694697792006098182",
    title: "Không gian phòng ngủ Master hiện đại siêu sang, tinh tế và ấm cúng",
    duration: "TikTok",
    views: "92.6K lượt xem",
    categoryLabel: "Phòng ngủ Master",
    posterImage: "/images/tiktok/7694697792006098182.jpg",
    videoUrl: "",
    tiktokVideoId: "7694697792006098182",
    tiktokUrl: "https://www.tiktok.com/@noithathiendai10/video/7694697792006098182",
    linkedHref: "/danh-muc/giuong-boc-da",
  },
  {
    id: "tiktok-7655891381512113429",
    title: "Bố trí công năng phòng ngủ Master: phòng thay đồ kịch trần & bàn trang điểm",
    duration: "TikTok",
    views: "74.3K lượt xem",
    categoryLabel: "Walk-in Closet",
    posterImage: "/images/tiktok/7655891381512113429.jpg",
    videoUrl: "",
    tiktokVideoId: "7655891381512113429",
    tiktokUrl: "https://www.tiktok.com/@noithathiendai10/video/7655891381512113429",
    linkedHref: "/danh-muc/tu-quan-ao",
  },
  {
    id: "tiktok-7704873222239456564",
    title: "Phòng ngủ Master vách ốp gỗ đầu giường ấm cúng & tủ áo cánh kính sang trọng",
    duration: "TikTok",
    views: "21.1K lượt xem",
    categoryLabel: "Thi công thực tế",
    posterImage: "/images/tiktok/7704873222239456564.jpg",
    videoUrl: "",
    tiktokVideoId: "7704873222239456564",
    tiktokUrl: "https://www.tiktok.com/@noithathiendai10/video/7704873222239456564",
    linkedHref: "/danh-muc/phong-ngu",
  },
  {
    id: "tiktok-7710067344353004806",
    title: "Góc phòng thay đồ tối giản, kệ trưng bày & bàn trang điểm ngập nắng",
    duration: "TikTok",
    views: "2.0K lượt xem",
    categoryLabel: "Phòng thay đồ",
    posterImage: "/images/tiktok/7710067344353004806.jpg",
    videoUrl: "",
    tiktokVideoId: "7710067344353004806",
    tiktokUrl: "https://www.tiktok.com/@noithathiendai10/video/7710067344353004806",
    linkedHref: "/danh-muc/ban-trang-diem",
  },
  {
    id: "tiktok-7706350300109622534",
    title: "Bóc tách thi công phòng ngủ tối giản: vách chia rãnh LED 12V & giường bay",
    duration: "TikTok",
    views: "1.6K lượt xem",
    categoryLabel: "Bóc tách thi công",
    posterImage: "/images/tiktok/7706350300109622534.jpg",
    videoUrl: "",
    tiktokVideoId: "7706350300109622534",
    tiktokUrl: "https://www.tiktok.com/@noithathiendai10/video/7706350300109622534",
    linkedHref: "/du-an",
  },
  {
    id: "tiktok-7704504983244279041",
    title: "Tổ ấm phong cách nội thất tối giản, sang trọng và đậm chất hiện đại",
    duration: "TikTok",
    views: "1.3K lượt xem",
    categoryLabel: "Không gian sống",
    posterImage: "/images/tiktok/7704504983244279041.jpg",
    videoUrl: "",
    tiktokVideoId: "7704504983244279041",
    tiktokUrl: "https://www.tiktok.com/@noithathiendai10/video/7704504983244279041",
    linkedHref: "/bo-suu-tap",
  },
  {
    id: "tiktok-7704145947105824001",
    title: "Không gian mở đẳng cấp: bàn ăn mặt đá, hệ bếp tối ưu & phòng khách sofa da",
    duration: "TikTok",
    views: "1.1K lượt xem",
    categoryLabel: "Phòng khách & Bếp",
    posterImage: "/images/tiktok/7704145947105824001.jpg",
    videoUrl: "",
    tiktokVideoId: "7704145947105824001",
    tiktokUrl: "https://www.tiktok.com/@noithathiendai10/video/7704145947105824001",
    linkedHref: "/danh-muc/ban-an-mat-da",
  },
];

export const featuredTiles: FeaturedTile[] = [
  {
    id: "feat-1",
    eyebrow: "SIGNATURE SERIES",
    title: "SOFA BẮC ÂU TỐI GIẢN",
    description: "Tỷ lệ thanh mảnh trên nền gỗ sồi trắng kết hợp nệm mút đa tầng êm ái cho căn hộ hiện đại.",
    ctaLabel: "Xem danh mục",
    href: "/danh-muc/sofa-bac-au",
    image: "/images/sofa-nordic.jpg",
    hoverImage: "/images/sofa-minimal.jpg",
  },
  {
    id: "feat-2",
    eyebrow: "ARCHITECTURAL LIVING",
    title: "BÀN TRÀ & ĐÁ TỰ NHIÊN",
    description: "Đá marble Nero Marquina chống thấm nano phối hợp hoàn hảo cùng các dòng sofa da và gỗ.",
    ctaLabel: "Khám phá ngay",
    href: "/danh-muc/ban-tra",
    image: "/images/coffee-table.jpg",
    hoverImage: "/images/hero-leather.jpg",
  },
];

export const aboutData = {
  eyebrow: "VỀ CHÚNG TÔI",
  heading: "Kiến tạo nội thất cho mọi tổ ấm",
  description:
    "Tại An Gia Decor, mỗi thiết kế được cân chỉnh theo tỷ lệ nhà phố và căn hộ Việt, tuyển chọn gỗ tự nhiên cùng da vải bền đẹp, chế tác trực tiếp tại xưởng.",
  ctaLabel: "Xem công trình thực tế",
  ctaHref: "/du-an",
  statValue: "10+",
  statLabel: "năm kinh nghiệm · showroom tại TP. Thủ Đức, TP.HCM",
};

export const servicesData: ServiceItem[] = [
  {
    number: "01.",
    title: "Tư vấn phối cảnh & kích thước theo mặt bằng",
    summary: "Đội ngũ kiến trúc sư khảo sát trực tiếp căn hộ, cân chỉnh kích thước sofa và vật liệu đồng bộ ánh sáng.",
    image: "/images/room-living.jpg",
  },
  {
    number: "02.",
    title: "May đo chất liệu da chống trầy & vải nhập khẩu",
    summary: "Hơn 120 mẫu da Microfiber, da bò Ý và vải Linen/Nhung Bỉ có sẵn tại showroom để trực tiếp chạm thử.",
    image: "/images/hero-leather.jpg",
  },
  {
    number: "03.",
    title: "Gia công khung gỗ tự nhiên trực tiếp tại xưởng",
    summary: "Chủ động xưởng sản xuất giúp đảm bảo tiến độ 10–14 ngày và tối ưu chi phí trực tiếp không qua trung gian.",
    image: "/images/craftsmanship-studio.jpg",
  },
  {
    number: "04.",
    title: "Vận chuyển & lắp đặt chuẩn mực tại công trình",
    summary: "Đội kỹ thuật riêng giao nhận, kê đặt cẩn thận, căn chỉnh chân đế và hướng dẫn bảo quản tận nơi.",
    image: "/images/project-villa.jpg",
  },
  {
    number: "05.",
    title: "Bảo hành kết cấu dài hạn & bảo trì trọn đời",
    summary: "Bảo hành khung sườn gỗ lên tới 5 năm, hỗ trợ làm sạch và thay áo đệm khi gia đình có nhu cầu làm mới.",
    image: "/images/sofa-wood.jpg",
  },
];

export const spotlightNordic: SpotlightData = {
  eyebrow: "DÒNG SẢN PHẨM CHỦ ĐẠO",
  label: "TINH THẦN SCANDINAVIAN",
  title: "DÒNG SOFA BẮC ÂU",
  description:
    "Loại bỏ các chi tiết rườm rà để giữ lại đường nét thanh thoát nhất, dòng sofa Bắc Âu mang lại sự thông thoáng thị giác và cảm giác thư giãn nhẹ nhõm cho mọi phòng khách hiện đại.",
  ctaLabel: "Xem tất cả mẫu",
  href: "/danh-muc/sofa-bac-au",
  image: "/images/sofa-nordic.jpg",
  posterImage: "/images/sofa-nordic.jpg",
  videoUrl: "/videos/sofa-minimalist.mp4",
};

export const spotlightWood: SpotlightData = {
  eyebrow: "CHẤT LIỆU GỖ TỰ NHIÊN",
  label: "CHẾ TÁC THỦ CÔNG",
  title: "DÒNG SOFA CHÂN GỖ",
  description:
    "Tôn vinh đường vân gỗ óc chó Bắc Mỹ và sồi trắng châu Âu trên từng mối ghép mộng tinh xảo, kết hợp đệm mút đàn hồi cao mang đến vẻ đẹp bền vững qua nhiều thế hệ.",
  ctaLabel: "Khám phá dòng gỗ",
  href: "/danh-muc/sofa-chan-go",
  image: "/images/sofa-wood.jpg",
  posterImage: "/images/sofa-wood.jpg",
  videoUrl: "/videos/wood-workshop.mp4",
};

export const commitmentData: {
  eyebrow: string;
  headingStart: string;
  headingHighlight: string;
  stageImage: string;
  stageVideoUrl?: string;
  stageCaption: string;
  cardImage: string;
  cardTag: string;
  cardTitle: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
} = {
  eyebrow: "TRIẾT LÝ AN GIA DECOR",
  headingStart: "SỐNG ĐẸP,",
  headingHighlight: "BỀN LÂU",
  stageImage: "/images/craftsmanship-studio.jpg",
  stageVideoUrl: "/videos/wood-craftsmanship.mp4",
  stageCaption: "CHUẨN MỰC TỪ ĐƯỜNG MAY ĐẾN KẾT CẤU",
  cardImage: "/images/sofa-wood.jpg",
  cardTag: "BẢO HÀNH KHUNG 5 NĂM",
  cardTitle: "Vật liệu chuẩn mực, an toàn dài lâu",
  description:
    "Mỗi chiếc sofa hay bàn ăn trước khi rời xưởng đều trải qua quy trình kiểm tra 18 điểm: từ độ ẩm gỗ tự nhiên dưới 12%, độ đàn hồi nệm mút cho tới độ bền ma sát của từng thớ da vải.",
  ctaLabel: "Cam kết của chúng tôi",
  ctaHref: "/thu-vien",
};

export const dreamScenes: DreamScene[] = [
  {
    id: "dream-1",
    number: "01.",
    title: "Phòng khách tối giản",
    subtitle: "Không gian tiếp đón trầm ấm với sofa da và đá marble.",
    image: "/images/room-living.jpg",
    hotspots: [
      {
        id: "h-d1-table",
        label: "Bàn trà Nero",
        x: 24,
        y: 72,
        productSlug: "ban-tra-da-marble-nero",
        productName: "Bàn Trà Đá Marble Nero Marquina",
        categoryName: "Bàn trà",
        priceLabel: "Liên hệ",
        image: "/images/coffee-table.jpg",
      },
      {
        id: "h-d1-sofa",
        label: "Sofa Oslo Xám",
        x: 78,
        y: 62,
        productSlug: "sofa-bac-au-oslo-xam-tro",
        productName: "Sofa Bắc Âu Oslo Xám Tro",
        categoryName: "Sofa Bắc Âu",
        priceLabel: "Liên hệ",
        image: "/images/sofa-minimal.jpg",
      },
      {
        id: "h-d1-chair",
        label: "Bàn ăn Monolith",
        x: 49,
        y: 44,
        productSlug: "ban-an-mat-da-monolith",
        productName: "Bàn Ăn Mặt Đá Monolith 8 Ghế",
        categoryName: "Bàn ăn mặt đá",
        priceLabel: "Liên hệ",
        image: "/images/room-dining.jpg",
      },
    ],
  },
  {
    id: "dream-2",
    number: "02.",
    title: "Góc Bắc Âu xanh dịu",
    subtitle: "Tỷ lệ thanh thoát cho căn hộ nhiều ánh sáng tự nhiên.",
    image: "/images/sofa-nordic.jpg",
    hotspots: [
      {
        id: "h-d2-sofa",
        label: "Sofa Bắc Âu Tay Vát",
        x: 48,
        y: 62,
        productSlug: "sofa-bac-au-tay-vat-xanh-reu",
        productName: "Sofa Bắc Âu Tay Vát Xanh Rêu",
        categoryName: "Sofa Bắc Âu",
        priceLabel: "Liên hệ",
        image: "/images/sofa-nordic.jpg",
      },
      {
        id: "h-d2-table",
        label: "Bàn trà đôi Aura",
        x: 68,
        y: 78,
        productSlug: "ban-tra-doi-tron-go-oc-cho",
        productName: "Bàn Trà Đôi Tròn Gỗ Óc Chó Aura",
        categoryName: "Bàn trà",
        priceLabel: "Liên hệ",
        image: "/images/sofa-minimal.jpg",
      },
    ],
  },
  {
    id: "dream-3",
    number: "03.",
    title: "Phòng ăn đá phiến",
    subtitle: "Điểm hẹn ấm cúng bên bàn ăn đá chịu nhiệt và ánh đèn đồng.",
    image: "/images/room-dining.jpg",
    hotspots: [
      {
        id: "h-d3-table",
        label: "Bàn ăn Monolith",
        x: 52,
        y: 68,
        productSlug: "ban-an-mat-da-monolith",
        productName: "Bàn Ăn Mặt Đá Monolith 8 Ghế",
        categoryName: "Bàn ăn mặt đá",
        priceLabel: "Liên hệ",
        image: "/images/room-dining.jpg",
      },
      {
        id: "h-d3-light",
        label: "Đèn thả Aurelia",
        x: 50,
        y: 26,
        productSlug: "den-chum-dong-thau-aurelia",
        productName: "Đèn Thả Đồng Thau Aurelia Linear",
        categoryName: "Đèn trang trí",
        priceLabel: "Liên hệ",
        image: "/images/hero-classic.jpg",
      },
    ],
  },
  {
    id: "dream-4",
    number: "04.",
    title: "Phòng ngủ Master",
    subtitle: "Giấc ngủ sâu trong không gian bọc da và gỗ óc chó tĩnh tại.",
    image: "/images/room-bedroom.jpg",
    hotspots: [
      {
        id: "h-d4-bed",
        label: "Giường Valencia",
        x: 52,
        y: 64,
        productSlug: "giuong-boc-da-valencia-king",
        productName: "Giường Ngủ Bọc Da Valencia King",
        categoryName: "Giường bọc da",
        priceLabel: "Liên hệ",
        image: "/images/room-bedroom.jpg",
      },
      {
        id: "h-d4-tab",
        label: "Tab óc chó Zen",
        x: 24,
        y: 68,
        productSlug: "tu-dau-giuong-oc-cho-zen",
        productName: "Tủ Đầu Giường Gỗ Óc Chó Zen",
        categoryName: "Tủ đầu giường",
        priceLabel: "Liên hệ",
        image: "/images/room-bedroom-soft.jpg",
      },
    ],
  },
  {
    id: "dream-5",
    number: "05.",
    title: "Thư phòng điều hành",
    subtitle: "Sự tập trung tuyệt đối giữa chất liệu gỗ óc chó và da bò.",
    image: "/images/room-workspace.jpg",
    hotspots: [
      {
        id: "h-d5-desk",
        label: "Bàn làm việc Atelier",
        x: 48,
        y: 66,
        productSlug: "ban-lam-viec-giam-doc-atelier",
        productName: "Bàn Làm Việc Kiến Trúc Atelier",
        categoryName: "Bàn làm việc",
        priceLabel: "Liên hệ",
        image: "/images/room-workspace.jpg",
      },
      {
        id: "h-d5-chair",
        label: "Ghế Executive Ergo",
        x: 68,
        y: 58,
        productSlug: "ghe-cong-thai-hoc-executive-leather",
        productName: "Ghế Làm Việc Da Executive Ergo",
        categoryName: "Ghế công thái học",
        priceLabel: "Liên hệ",
        image: "/images/project-office.jpg",
      },
    ],
  },
  {
    id: "dream-6",
    number: "06.",
    title: "Phòng khách Boutique",
    subtitle: "Chất liệu nhung Bỉ và chi tiết kim loại cho dấu ấn cá nhân.",
    image: "/images/hero-velvet.jpg",
    hotspots: [
      {
        id: "h-d6-sofa",
        label: "Sofa Nhung Verona",
        x: 46,
        y: 60,
        productSlug: "sofa-vai-nhung-verona-ngoc-luc-bao",
        productName: "Sofa Vải Nhung Verona Ngọc Lục Bảo",
        categoryName: "Sofa vải nhung",
        priceLabel: "Liên hệ",
        image: "/images/hero-velvet.jpg",
      },
      {
        id: "h-d6-tv",
        label: "Kệ tivi Solis",
        x: 74,
        y: 50,
        productSlug: "ke-tivi-go-oc-cho-nero",
        productName: "Kệ Tivi Gỗ Óc Chó & Mặt Đá Solis",
        categoryName: "Kệ tivi",
        priceLabel: "Liên hệ",
        image: "/images/project-villa.jpg",
      },
    ],
  },
];

export const roomApplications: RoomApplication[] = [
  {
    id: "room-living",
    label: "Phòng khách",
    description: "Tổ hợp sofa, bàn trà và ghế đơn cân bằng công năng tiếp khách lẫn thư giãn gia đình.",
    image: "/images/room-living.jpg",
    hotspots: dreamScenes[0].hotspots,
  },
  {
    id: "room-dining",
    label: "Phòng ăn",
    description: "Bàn ăn mặt đá chịu nhiệt cùng ghế bọc da và hệ đèn thả đồng thau ấm cúng.",
    image: "/images/room-dining.jpg",
    hotspots: [
      ...dreamScenes[2].hotspots,
      {
        id: "h-ra-chair",
        label: "Ghế ăn Bellini",
        x: 32,
        y: 66,
        productSlug: "ghe-an-boc-da-bellini",
        productName: "Ghế Ăn Bọc Da Bellini",
        categoryName: "Ghế ăn bọc da",
        priceLabel: "Liên hệ",
        image: "/images/room-dining-classic.jpg",
      },
    ],
  },
  {
    id: "room-bedroom",
    label: "Phòng ngủ",
    description: "Chất liệu da và vải dệt mềm mại đưa nhịp sống về trạng thái thư giãn tĩnh tại.",
    image: "/images/room-bedroom.jpg",
    hotspots: dreamScenes[3].hotspots,
  },
  {
    id: "room-workspace",
    label: "Phòng làm việc",
    description: "Không gian tập trung chuẩn mực với gỗ óc chó, giấu dây gọn và ghế công thái học.",
    image: "/images/room-workspace.jpg",
    hotspots: dreamScenes[4].hotspots,
  },
];

export interface CategoryExplorerTab {
  groupId: ProductGroupId;
  label: string;
  items: { number: string; title: string; slug: string; image: string }[];
}
