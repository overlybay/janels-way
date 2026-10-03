/* Janel's Way — Supabase client + data helpers.
 * Requires: config.js loaded first, and the Supabase JS v2 CDN script.
 * All data access goes through the logged-in user's session; Postgres
 * Row Level Security (see supabase/schema.sql) enforces what each role sees.
 */
(function () {
  const cfg = window.JW_CONFIG || {};
  const missing =
    !cfg.SUPABASE_URL || cfg.SUPABASE_URL.indexOf("PASTE_YOUR") === 0 ||
    !cfg.SUPABASE_ANON_KEY || cfg.SUPABASE_ANON_KEY.indexOf("PASTE_YOUR") === 0;

  if (missing) {
    document.addEventListener("DOMContentLoaded", () => {
      const banner = document.createElement("div");
      banner.className = "error";
      banner.style.margin = "16px";
      banner.textContent =
        "Supabase is not configured yet. Paste your SUPABASE_URL and SUPABASE_ANON_KEY into config.js (see README.md).";
      document.body.prepend(banner);
    });
    window.JW = { notConfigured: true };
    return;
  }

  const supabase = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);

  async function getUser() {
    const { data } = await supabase.auth.getUser();
    return data.user || null;
  }

  async function getProfile() {
    const user = await getUser();
    if (!user) return null;
    const { data, error } = await supabase
      .from("profiles").select("*").eq("id", user.id).single();
    if (error) return null;
    return data;
  }

  // Redirects to login when signed out; optionally enforces a role.
  async function requireAuth(role) {
    const user = await getUser();
    if (!user) { window.location.href = "login.html"; return null; }
    const profile = await getProfile();
    if (!profile) {
      alert("Your profile is still being created. Please wait a moment and reload.");
      return null;
    }
    if (role && profile.role !== role) {
      window.location.href = profile.role === "staff" ? "dashboard.html" : "parent.html";
      return null;
    }
    return { user, profile };
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "login.html";
  }

  // ---- Staff data helpers (RLS limits these to staff) ----
  async function listClients() {
    const { data, error } = await supabase.from("clients").select("*").order("initials");
    if (error) throw error;
    return data;
  }

  async function getClientFile(clientId) {
    const [client, goals, notes, behavior] = await Promise.all([
      supabase.from("clients").select("*").eq("id", clientId).single(),
      supabase.from("goals").select("*").eq("client_id", clientId).order("created_at"),
      supabase.from("notes").select("*").eq("client_id", clientId).order("created_at", { ascending: false }),
      supabase.from("behavior_data").select("*").eq("client_id", clientId).order("recorded_at", { ascending: false }).limit(200)
    ]);
    if (client.error) throw client.error;
    return {
      client: client.data,
      goals: goals.data || [],
      notes: notes.data || [],
      behavior: behavior.data || []
    };
  }

  async function listSessions(upcomingOnly) {
    let q = supabase.from("sessions")
      .select("*, clients(initials)")
      .order("starts_at", { ascending: true });
    if (upcomingOnly) q = q.gte("starts_at", new Date().toISOString());
    const { data, error } = await q;
    if (error) throw error;
    return data;
  }

  async function listNotes(filters) {
    let q = supabase.from("notes")
      .select("*, clients(initials)")
      .order("created_at", { ascending: false });
    if (filters && filters.client_id) q = q.eq("client_id", filters.client_id);
    if (filters && filters.status) q = q.eq("status", filters.status);
    const { data, error } = await q;
    if (error) throw error;
    return data;
  }

  async function saveNote({ client_id, session_id, content, status }) {
    const user = await getUser();
    const { data, error } = await supabase.from("notes").insert({
      client_id, session_id: session_id || null, content,
      status: status || "draft", staff_id: user.id
    }).select().single();
    if (error) throw error;
    return data;
  }

  async function updateNoteStatus(noteId, status) {
    const { error } = await supabase.from("notes").update({ status }).eq("id", noteId);
    if (error) throw error;
  }

  async function recordBehavior({ client_id, session_id, behavior, count }) {
    const { error } = await supabase.from("behavior_data").insert({
      client_id, session_id: session_id || null, behavior, count: Number(count) || 0
    });
    if (error) throw error;
  }

  // ---- Parent helpers (RLS limits these to the parent's own child) ----
  async function getMyChild() {
    const profile = await getProfile();
    if (!profile || !profile.client_id) return null;
    return getClientFile(profile.client_id);
  }

  window.JW = {
    supabase, getUser, getProfile, requireAuth, signOut,
    listClients, getClientFile, listSessions, listNotes,
    saveNote, updateNoteStatus, recordBehavior, getMyChild,
    notConfigured: false
  };
})();
