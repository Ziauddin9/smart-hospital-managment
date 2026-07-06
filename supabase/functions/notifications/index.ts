import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const method = req.method;

    // GET - Fetch notifications for a user
    if (method === "GET") {
      const userId = url.searchParams.get("user_id");
      const unreadOnly = url.searchParams.get("unread_only") === "true";
      const limit = parseInt(url.searchParams.get("limit") || "20");

      let query = supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (userId) {
        query = query.eq("user_id", userId);
      }
      if (unreadOnly) {
        query = query.eq("read", false);
      }

      const { data, error } = await query;

      if (error) throw error;

      return new Response(JSON.stringify({ notifications: data }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST - Create notification
    if (method === "POST") {
      const body = await req.json();
      const { user_id, title, message, type, action_url } = body;

      if (!user_id || !title) {
        return new Response(
          JSON.stringify({ error: "user_id and title are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data, error } = await supabase
        .from("notifications")
        .insert({
          user_id,
          title,
          message: message || null,
          type: type || "info",
          action_url: action_url || null,
          read: false,
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ notification: data }), {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // PUT - Mark as read
    if (method === "PUT") {
      const body = await req.json();
      const { notification_id, mark_all_read, user_id } = body;

      if (mark_all_read && user_id) {
        const { error } = await supabase
          .from("notifications")
          .update({ read: true })
          .eq("user_id", user_id)
          .eq("read", false);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, message: "All notifications marked as read" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (notification_id) {
        const { data, error } = await supabase
          .from("notifications")
          .update({ read: true })
          .eq("id", notification_id)
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ notification: data }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({ error: "notification_id or (mark_all_read and user_id) required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // DELETE - Remove notification
    if (method === "DELETE") {
      const body = await req.json();
      const { notification_id } = body;

      if (!notification_id) {
        return new Response(
          JSON.stringify({ error: "notification_id is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notification_id);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Notifications error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to process request", details: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
