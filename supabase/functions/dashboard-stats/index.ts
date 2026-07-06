import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface DashboardStats {
  total_patients: number;
  total_doctors: number;
  today_appointments: number;
  completed_today: number;
  pending_bills: number;
  low_stock_medicines: number;
  pending_lab_tests: number;
  new_patients_this_month: number;
  total_revenue: number;
  pending_amount: number;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const today = new Date().toISOString().split("T")[0];
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];

    // Execute all stats queries in parallel
    const [
      { count: total_patients },
      { count: total_doctors },
      { count: today_appointments },
      { count: completed_today },
      { count: pending_bills },
      { count: low_stock_medicines },
      { count: pending_lab_tests },
      { count: new_patients_this_month },
      { data: revenueData },
      { data: pendingData },
      { data: recentAppointments },
      { data: upcomingAppointments },
      { data: lowStockMeds },
    ] = await Promise.all([
      supabase.from("patients").select("*", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("doctors").select("*", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("appointments").select("*", { count: "exact", head: true }).eq("appointment_date", today),
      supabase.from("appointments").select("*", { count: "exact", head: true }).eq("appointment_date", today).eq("status", "completed"),
      supabase.from("invoices").select("*", { count: "exact", head: true }).in("status", ["pending", "draft"]),
      supabase.from("medicines").select("*", { count: "exact", head: true }).filter("quantity_in_stock", "lte", 10),
      supabase.from("lab_tests").select("*", { count: "exact", head: true }).in("status", ["ordered", "sample_collected", "processing"]),
      supabase.from("patients").select("*", { count: "exact", head: true }).gte("created_at", monthStart),
      supabase.from("invoices").select("total_amount").eq("status", "paid"),
      supabase.from("invoices").select("total_amount").in("status", ["pending", "partially_paid"]),
      supabase.from("appointments")
        .select("id, appointment_date, appointment_time, type, status, patients(full_name, patient_number), doctors(full_name, specialization)")
        .order("appointment_date", { ascending: false })
        .order("appointment_time", { ascending: false })
        .limit(10),
      supabase.from("appointments")
        .select("id, appointment_date, appointment_time, type, status, patients(full_name), doctors(full_name, specialization)")
        .gte("appointment_date", today)
        .in("status", ["scheduled", "confirmed"])
        .order("appointment_date", { ascending: true })
        .order("appointment_time", { ascending: true })
        .limit(5),
      supabase.from("medicines")
        .select("id, name, quantity_in_stock, reorder_level, expiry_date")
        .lte("quantity_in_stock", 10)
        .limit(10),
    ]);

    const total_revenue = (revenueData || []).reduce((sum: number, inv: { total_amount: number }) => sum + (inv.total_amount || 0), 0);
    const pending_amount = (pendingData || []).reduce((sum: number, inv: { total_amount: number }) => sum + (inv.total_amount || 0), 0);

    // Calculate expiring soon medicines
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const expiringSoon = (lowStockMeds || []).filter((med: { expiry_date?: string }) => {
      if (!med.expiry_date) return false;
      return new Date(med.expiry_date) <= thirtyDaysFromNow;
    });

    const stats: DashboardStats = {
      total_patients: total_patients || 0,
      total_doctors: total_doctors || 0,
      today_appointments: today_appointments || 0,
      completed_today: completed_today || 0,
      pending_bills: pending_bills || 0,
      low_stock_medicines: low_stock_medicines || 0,
      pending_lab_tests: pending_lab_tests || 0,
      new_patients_this_month: new_patients_this_month || 0,
      total_revenue,
      pending_amount,
    };

    const response = {
      stats,
      recent_appointments: recentAppointments || [],
      upcoming_appointments: upcomingAppointments || [],
      low_stock_details: lowStockMeds || [],
      expiring_soon_count: expiringSoon.length,
      generated_at: new Date().toISOString(),
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Dashboard stats error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to fetch dashboard stats", details: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
