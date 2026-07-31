"use client";

import { createClient } from "@/lib/supabase/client";
import type { LoginInput, SignupInput } from "./schema";

/**
 * Client-side auth actions. Thin wrappers over Supabase Auth that return a
 * uniform { error } shape so screens can render friendly messages.
 */

export type ActionResult = { error: string | null };

export async function signIn(input: LoginInput): Promise<ActionResult> {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });
  return { error: error?.message ?? null };
}

/**
 * Sign up + provision the shop.
 *
 * Flow (PROJECT.md §10):
 *   1. auth.signUp creates the user (and a session if email confirmation is
 *      disabled).
 *   2. If we have a session, call the provision_shop RPC which atomically
 *      creates the shop + profile under the user's own JWT.
 *   3. If email confirmation is ON, there is no session yet; provisioning is
 *      deferred until first login (handled by ensureProvisioned).
 */
export async function signUp(
  input: SignupInput,
): Promise<ActionResult & { needsConfirmation: boolean }> {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      // Stash intended shop/full name so we can provision after confirmation.
      data: {
        shop_name: input.shopName,
        full_name: input.fullName || null,
      },
    },
  });

  if (error) return { error: error.message, needsConfirmation: false };

  // No session => email confirmation required. Provision on first login.
  if (!data.session) {
    return { error: null, needsConfirmation: true };
  }

  const provisionError = await provisionShop(
    input.shopName,
    input.fullName || null,
  );
  return { error: provisionError, needsConfirmation: false };
}

/**
 * Calls the provision_shop RPC. Safe to call more than once — the function is
 * written to return the existing shop if the user already has a profile.
 */
export async function provisionShop(
  shopName: string,
  fullName: string | null,
): Promise<string | null> {
  const supabase = createClient();
  const { error } = await supabase.rpc("provision_shop", {
    p_shop_name: shopName,
    p_full_name: fullName,
  });
  return error?.message ?? null;
}

/**
 * Ensures the logged-in user has a shop/profile. Called after login to cover
 * the email-confirmation path where provisioning was deferred. Reads the
 * intended shop name from user metadata set during signUp.
 */
export async function ensureProvisioned(): Promise<string | null> {
  const supabase = createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .maybeSingle();

  if (profile) return null; // already provisioned

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "Not signed in";

  const shopName = (user.user_metadata?.shop_name as string) || "My Pharmacy";
  const fullName = (user.user_metadata?.full_name as string) || null;

  return provisionShop(shopName, fullName);
}

export async function signOut(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
}
