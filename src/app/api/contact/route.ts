import { NextResponse } from "next/server";
import { createPublicSupabaseClient } from "@/lib/supabase/public";

const ALLOWED_SOURCES = new Set(["footer", "product", "project", "contact-page"]);

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as
      | Record<string, unknown>
      | null;
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Dữ liệu gửi lên không hợp lệ." },
        { status: 400 }
      );
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const company = typeof body.company === "string" ? body.company.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const rawSource = typeof body.source === "string" ? body.source.trim() : "footer";
    const source = ALLOWED_SOURCES.has(rawSource) ? rawSource : "footer";

    if (name.length < 2) {
      return NextResponse.json(
        { error: "Vui lòng nhập họ và tên (tối thiểu 2 ký tự)." },
        { status: 400 }
      );
    }

    if (phone.length < 6 || !/^[0-9+\s().-]{6,25}$/.test(phone)) {
      return NextResponse.json(
        { error: "Vui lòng nhập số điện thoại hợp lệ." },
        { status: 400 }
      );
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Địa chỉ email không đúng định dạng." },
        { status: 400 }
      );
    }

    const supabase = createPublicSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Hệ thống chưa kết nối cơ sở dữ liệu." },
        { status: 503 }
      );
    }

    const { error } = await supabase.from("contact_leads").insert({
      name: name.slice(0, 120),
      email: email.slice(0, 160),
      phone: phone.slice(0, 30),
      company: company.slice(0, 160),
      message: message.slice(0, 2000),
      source,
      status: "new",
    });

    if (error) {
      return NextResponse.json(
        { error: "Không thể lưu thông tin liên hệ. Vui lòng thử lại sau." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Đã tiếp nhận yêu cầu tư vấn từ bạn!",
    });
  } catch {
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi xử lý yêu cầu." },
      { status: 500 }
    );
  }
}
