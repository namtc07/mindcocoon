import { createClient } from "@supabase/supabase-js";

/**
 * Deletes the signed-in user's account. The bearer token is verified with Supabase
 * first; only then is the service-role key used. Backups and recovery secrets are
 * removed by ON DELETE CASCADE.
 */
export async function DELETE(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !publishable || !serviceRole) {
    return Response.json({ error: "Accounts are not configured" }, { status: 503 });
  }

  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return Response.json({ error: "Missing token" }, { status: 401 });

  const verifier = createClient(url, publishable, { auth: { persistSession: false } });
  const { data, error } = await verifier.auth.getUser(token);
  if (error || !data.user) return Response.json({ error: "Invalid session" }, { status: 401 });

  const admin = createClient(url, serviceRole, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error: deleteError } = await admin.auth.admin.deleteUser(data.user.id);
  if (deleteError) return Response.json({ error: "Could not delete account" }, { status: 500 });

  return new Response(null, { status: 204 });
}
