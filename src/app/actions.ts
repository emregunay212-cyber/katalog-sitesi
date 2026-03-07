"use server";

import { redirect } from "next/navigation";
import { removeSessionCookie } from "@/lib/auth";

export async function logout() {
  await removeSessionCookie();
  redirect("/");
}
