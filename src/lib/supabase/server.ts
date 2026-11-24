import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/lib/supabase/public";

export async function createServerSupabaseClient() {
  const env = getSupabaseEnv();
  if (!env) return null;

  const cookieStore = await cookies();
  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot mutate cookies during render.
        }
      },
    },
  });
}

export async function requireAdminUser() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return null;

  const { data: adminRow, error: adminError } = await supabase
    .from("admin_users")
    .select("user_id, email, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminError || !adminRow) return null;

  return {
    supabase,
    user,
    admin: adminRow as { user_id: string; email: string; role: string },
  };
}
