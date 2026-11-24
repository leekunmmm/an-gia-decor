import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/data-service";
import { buildPageMetadata } from "@/lib/seo";
import { AuthSplitView } from "@/components/auth/AuthSplitView";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return buildPageMetadata({
    title: "Quên mật khẩu",
    description: `Khôi phục mật khẩu tài khoản thành viên ${settings.name}.`,
    path: "/quen-mat-khau",
    siteName: settings.name,
    noIndex: true,
  });
}

export default function ForgotPasswordPage() {
  return <AuthSplitView mode="forgot" />;
}
