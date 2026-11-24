import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/data-service";
import { buildPageMetadata } from "@/lib/seo";
import { AuthSplitView } from "@/components/auth/AuthSplitView";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return buildPageMetadata({
    title: "Đăng nhập",
    description: `Đăng nhập tài khoản thành viên ${settings.name} để lưu sản phẩm yêu thích và nhận tư vấn nội thất.`,
    path: "/login",
    siteName: settings.name,
    noIndex: true,
  });
}

export default function LoginPage() {
  return <AuthSplitView mode="login" />;
}
