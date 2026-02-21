import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

type Payload = {
  email: string;
  password: string;
  name: string;
  phone_number: string;
  api_key: string;
  plan_id?: string | null;
  additional_attendants?: number;
  payment_notification_day?: number;
  payment_day?: number;
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SERVICE_ROLE_KEY) {
      console.error("Missing environment variables");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // =========================================================
    // PARTE 2 — Autenticação correta (pega usuário do token)
    // =========================================================
    const authHeader = req.headers.get("Authorization");
    console.log("Auth header received:", authHeader ? "present" : "missing");

    if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid Authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Cliente "do usuário" (usa ANON e o Bearer do request)
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await supabaseClient.auth.getUser();

    if (userError || !userData?.user) {
      console.error("Failed to get user:", userError);
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          details: userError?.message || "Invalid token",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const callerId = userData.user.id;
    console.log("User authenticated:", callerId);

    // Cliente admin (service role)
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // =========================================================
    // PARTE 3 — Verificação de super admin (tabela super_admins)
    // =========================================================
    console.log("Checking if user is super admin:", callerId);

    const { data: adminData, error: adminError } = await supabaseAdmin
      .from("super_admins")
      .select("user_id")
      .eq("user_id", callerId)
      .maybeSingle();

    console.log("Admin check result:", { adminData, adminError });

    if (adminError || !adminData) {
      console.error("User is not a super admin");
      return new Response(
        JSON.stringify({
          error: "Access denied",
          details: "User is not a super admin",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Super admin verified successfully");

    // Parse body
    const body: Partial<Payload> = await req.json().catch(() => ({}));
    console.log("Request body received:", JSON.stringify(body));

    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "").trim();
    const name = String(body.name ?? "").trim();
    const phone_number_raw = String(body.phone_number ?? "").trim();
    const phone_number = phone_number_raw.replace(/\D/g, ""); // Apenas dígitos
    const api_key = String(body.api_key ?? "").trim();
    const plan_id = body.plan_id || null;

    // Blindar números com validação
    const additional_attendants_raw = Number(body.additional_attendants ?? 0);
    const additional_attendants = Number.isFinite(additional_attendants_raw) && additional_attendants_raw >= 0
      ? Math.floor(additional_attendants_raw)
      : 0;

    const payment_notification_day_raw = Number(body.payment_notification_day ?? 5);
    const payment_notification_day = (payment_notification_day_raw >= 1 && payment_notification_day_raw <= 31)
      ? Math.floor(payment_notification_day_raw)
      : 5;

    const payment_day_raw = Number(body.payment_day ?? 10);
    const payment_day = (payment_day_raw >= 1 && payment_day_raw <= 31)
      ? Math.floor(payment_day_raw)
      : 10;

    console.log("Parsed fields:", {
      email,
      name,
      phone_number,
      api_key,
      plan_id,
      additional_attendants,
      payment_notification_day,
      payment_day,
      passwordLength: password.length,
    });

    if (!email || !password || !name || !phone_number || !api_key) {
      console.error("Missing required fields");
      return new Response(
        JSON.stringify({
          error: "Campos obrigatórios: email, password, name, phone_number, api_key",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validar telefone (mínimo 10 dígitos)
    if (phone_number.length < 10) {
      return new Response(
        JSON.stringify({
          error: "Telefone inválido. Deve ter pelo menos 10 dígitos.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validar se email já existe no auth.users ANTES de criar usuário
    console.log("Checking if email already exists:", email);

    const { data: existingAuthUser } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingAuthUser?.users?.some(u => u.email?.toLowerCase() === email);

    if (userExists) {
      console.error("Email already registered in auth.users");
      return new Response(
        JSON.stringify({
          error: "Email já está em uso por outra empresa",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validar também na tabela companies
    const { data: existingCompany } = await supabaseAdmin
      .from("companies")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingCompany) {
      console.error("Email already in use in companies table");
      return new Response(
        JSON.stringify({
          error: "Email já está em uso por outra empresa",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validar se api_key já existe
    console.log("Checking if api_key already exists:", api_key);
    const { data: existingApiKey } = await supabaseAdmin
      .from("companies")
      .select("id")
      .eq("api_key", api_key)
      .maybeSingle();

    if (existingApiKey) {
      console.error("API key already in use");
      return new Response(
        JSON.stringify({
          error: "API Key já está em uso por outra empresa",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Creating user in auth.users...");
    const { data: newUser, error: createUserError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    console.log("User creation result:", { newUser, createUserError });

    if (createUserError || !newUser.user) {
      console.error("User creation failed:", createUserError);
      return new Response(
        JSON.stringify({
          error: "Erro ao criar usuário",
          details: createUserError?.message || "Unknown error",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const newUserId = newUser.user.id;
    console.log("User created successfully with ID:", newUserId);

    console.log("Inserting company into database...");

    // Calcula max_attendants baseado no plano
    let max_attendants = 1;
    if (plan_id) {
      console.log("Looking up plan with ID:", plan_id);
      const { data: planData, error: planError } = await supabaseAdmin
        .from("plans")
        .select("max_attendants")
        .eq("id", plan_id)
        .maybeSingle();

      console.log("Plan lookup result:", { planData, planError });

      if (planError) {
        console.error("Error fetching plan:", planError);
      }

      // Considera 0 como ilimitado
      if (planData && planData.max_attendants !== null && planData.max_attendants !== undefined) {
        max_attendants = planData.max_attendants === 0
          ? 0 // 0 = ilimitado
          : planData.max_attendants + additional_attendants;
        console.log("Calculated max_attendants:", max_attendants);
      } else {
        console.warn("Plan not found or has no max_attendants, using default value");
        max_attendants = 1 + additional_attendants;
      }
    } else {
      console.log("No plan_id provided, using default max_attendants");
      max_attendants = 1 + additional_attendants;
    }

    const companyData = {
      name,
      phone_number,
      api_key,
      email,
      user_id: newUserId,
      is_super_admin: false,
      plan_id,
      additional_attendants,
      payment_notification_day,
      payment_day,
      max_attendants,
    };

    console.log("Company data to insert:", JSON.stringify(companyData));

    const { error: insertError, data: insertedCompany } = await supabaseAdmin
      .from("companies")
      .insert(companyData)
      .select("id, name, api_key, user_id")
      .single();

    console.log("Company insertion result:", { insertError, insertedCompany });

    if (insertError) {
      console.error("Company insertion failed:", insertError);

      console.log("Rolling back: deleting user...");
      await supabaseAdmin.auth.admin.deleteUser(newUserId);

      return new Response(
        JSON.stringify({
          error: "Erro ao inserir empresa",
          details: insertError.message || "Unknown error",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Company inserted successfully with ID:", insertedCompany.id);
    console.log("Note: Reception department will be created automatically by database trigger");

    return new Response(
      JSON.stringify({
        ok: true,
        company: { name, email, phone_number, api_key, user_id: newUserId },
        message: "Empresa e usuário criados com sucesso",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    const errorStack = e instanceof Error ? e.stack : "";

    console.error("Error in create-company:", {
      message: errorMessage,
      stack: errorStack,
      error: e,
    });

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
