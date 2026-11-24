import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const admin = await requireAdminUser();
  if (!admin) {
    return NextResponse.json(
      { error: "Yêu cầu quyền quản trị viên." },
      { status: 401 }
    );
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      paths?: unknown;
    };

    revalidatePath("/", "layout");

    if (Array.isArray(body.paths)) {
      for (const p of body.paths) {
        if (typeof p === "string" && p.startsWith("/")) {
          revalidatePath(p);
        }
      }
    }

    return NextResponse.json({ revalidated: true });
  } catch {
    return NextResponse.json(
      { error: "Không thể làm mới cache." },
      { status: 500 }
    );
  }
}
