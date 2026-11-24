import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/data-service";
import { buildPageMetadata } from "@/lib/seo";
import { AuthSplitView } from "@/components/auth/AuthSplitView";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return buildPageMetadata({
    title: "Đăng ký",
    description: `Tạo tài khoản thành viên ${settings.name} để lưu sản phẩm yêu thích và nhận ưu đãi.`,
    path: "/register",
    siteName: settings.name,
    noIndex: true,
  });
}

export default function RegisterPage() {
  return <AuthSplitView mode="register" />;
}
