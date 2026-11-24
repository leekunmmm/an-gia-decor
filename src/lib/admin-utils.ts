export function slugifyVi(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function linesToArray(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function arrayToLines(items?: string[] | null): string {
  if (!Array.isArray(items)) return "";
  return items.join("\n");
}

export function commaToArray(raw: string): string[] {
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function arrayToComma(items?: string[] | null): string {
  if (!Array.isArray(items)) return "";
  return items.join(", ");
}

export async function triggerRevalidate(paths?: string[]): Promise<boolean> {
  try {
    const res = await fetch("/api/revalidate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paths: paths ?? [] }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
