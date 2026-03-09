import { NextResponse } from "next/server";
import { getCurrentUser, SessionUser } from "./auth";

/**
 * API route'larda tekrar eden auth kontrolünü merkezileştirir.
 * Giriş yapmamış kullanıcılara 401 döner.
 * Opsiyonel olarak rol kontrolü yapar.
 */
export async function requireAuth(opts?: { role?: string }): Promise<
  | { user: SessionUser; error: null }
  | { user: null; error: NextResponse }
> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      user: null,
      error: NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 }),
    };
  }
  if (opts?.role && user.role !== opts.role) {
    return {
      user: null,
      error: NextResponse.json({ error: "Bu işlem için yetkiniz yok." }, { status: 403 }),
    };
  }
  return { user, error: null };
}
