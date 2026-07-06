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

    // GET - Fetch patient(s)
    if (method === "GET") {
      const patientId = url.searchParams.get("id");
      const search = url.searchParams.get("search");
      const includeProfile = url.searchParams.get("include_profile") === "true";
      const limit = parseInt(url.searchParams.get("limit") || "50");
      const offset = parseInt(url.searchParams.get("offset") || "0");

      // Single patient with full profile
      if (patientId && includeProfile) {
        const { data: patient, error: patientError } = await supabase
          .from("patients")
          .select("*")
          .eq("id", patientId)
          .maybeSingle();

        if (patientError) throw patientError;
        if (!patient) {
          return new Response(
            JSON.stringify({ error: "Patient not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Fetch related data in parallel
        const [
          { data: appointments },
          { data: medical_records },
          { data: invoices },
          { data: lab_tests },
        ] = await Promise.all([
          supabase.from("appointments")
            .select("id, appointment_date, appointment_time, type, status, doctors(full_name)")
            .eq("patient_id", patientId)
            .order("appointment_date", { ascending: false })
            .limit(10),
          supabase.from("medical_records")
            .select("id, visit_date, diagnosis, chief_complaint, doctors(full_name)")
            .eq("patient_id", patientId)
            .order("visit_date", { ascending: false })
            .limit(5),
          supabase.from("invoices")
            .select("id, invoice_number, invoice_date, total_amount, status")
            .eq("patient_id", patientId)
            .order("invoice_date", { ascending: false })
            .limit(5),
          supabase.from("lab_tests")
            .select("id, test_name, ordered_date, status")
            .eq("patient_id", patientId)
            .order("ordered_date", { ascending: false })
            .limit(5),
        ]);

        const profile = {
          patient,
          appointments: appointments || [],
          medical_records: medical_records || [],
          invoices: invoices || [],
          lab_tests: lab_tests || [],
        };

        return new Response(JSON.stringify(profile), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Single patient without profile
      if (patientId) {
        const { data, error } = await supabase
          .from("patients")
          .select("*")
          .eq("id", patientId)
          .maybeSingle();

        if (error) throw error;

        return new Response(JSON.stringify({ patient: data }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // List patients with optional search
      let query = supabase
        .from("patients")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (search) {
        query = query.or(`full_name.ilike.%${search}%,patient_number.ilike.%${search}%,phone.ilike.%${search}%`);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return new Response(JSON.stringify({ patients: data, total: count }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST - Create patient
    if (method === "POST") {
      const body = await req.json();
      const {
        full_name,
        date_of_birth,
        gender,
        blood_group,
        phone,
        email,
        address,
        emergency_contact_name,
        emergency_contact_phone,
        insurance_provider,
        insurance_number,
        allergies,
      } = body;

      if (!full_name?.trim()) {
        return new Response(
          JSON.stringify({ error: "full_name is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data, error } = await supabase
        .from("patients")
        .insert({
          full_name,
          date_of_birth: date_of_birth || null,
          gender: gender || null,
          blood_group: blood_group || null,
          phone: phone || null,
          email: email || null,
          address: address || null,
          emergency_contact_name: emergency_contact_name || null,
          emergency_contact_phone: emergency_contact_phone || null,
          insurance_provider: insurance_provider || null,
          insurance_number: insurance_number || null,
          allergies: allergies || null,
          status: "active",
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ patient: data }), {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // PUT - Update patient
    if (method === "PUT") {
      const body = await req.json();
      const { id, ...updates } = body;

      if (!id) {
        return new Response(
          JSON.stringify({ error: "id is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Filter out null/undefined values that shouldn't be updated
      const cleanUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, v]) => v !== undefined)
      );

      const { data, error } = await supabase
        .from("patients")
        .update(cleanUpdates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ patient: data }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // DELETE - Remove patient
    if (method === "DELETE") {
      const body = await req.json();
      const { id } = body;

      if (!id) {
        return new Response(
          JSON.stringify({ error: "id is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error } = await supabase
        .from("patients")
        .delete()
        .eq("id", id);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Patient API error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to process request", details: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
