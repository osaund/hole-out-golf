import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-EVENT-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      logStep("Auth error", { error: userError?.message });
      return new Response(JSON.stringify({ error: "Please verify your email before registering" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }
    
    const user = userData.user;
    if (!user?.email) {
      return new Response(JSON.stringify({ error: "Email not available" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    logStep("User authenticated", { userId: user.id, email: user.email });

    const { eventId } = await req.json();
    if (!eventId) {
      return new Response(JSON.stringify({ error: "Event ID is required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    logStep("Event ID received", { eventId });

    // Fetch event details
    const { data: event, error: eventError } = await supabaseClient
      .from("events")
      .select("*")
      .eq("id", eventId)
      .maybeSingle();

    if (eventError || !event) {
      logStep("Event fetch error", { error: eventError?.message });
      return new Response(JSON.stringify({ error: "Event not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    if (!event.enabled) {
      return new Response(JSON.stringify({ error: "Event registration is not open" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    logStep("Event found", { eventId: event.id, entryFee: event.entry_fee });

    // Check if user is already registered
    const { data: existingReg } = await supabaseClient
      .from("event_registrations")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingReg) {
      return new Response(JSON.stringify({ error: "You are already registered for this event" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const entryFee = event.entry_fee || 0;

    // If entry fee is 0, register directly without payment
    if (entryFee <= 0) {
      const { error: regError } = await supabaseClient
        .from("event_registrations")
        .insert({
          event_id: eventId,
          user_id: user.id,
        });

      if (regError) {
        logStep("Registration error", { error: regError.message });
        return new Response(JSON.stringify({ error: "Failed to register" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        });
      }

      logStep("Free registration completed");
      return new Response(JSON.stringify({ success: true, free: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Create Stripe checkout session for paid events
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });
    
    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    logStep("Creating checkout session", { customerId, entryFee });

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: `${event.round} - ${event.region}`,
              description: `Event at ${event.venue} on ${event.date}`,
            },
            unit_amount: Math.round(entryFee * 100), // Convert to pence
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/?event_success=${eventId}`,
      cancel_url: `${req.headers.get("origin")}/?event_canceled=true`,
      metadata: {
        event_id: eventId,
        user_id: user.id,
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
