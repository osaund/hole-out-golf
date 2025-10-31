import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PrizeClaimEmailRequest {
  courseName: string;
  userEmail: string;
  userName: string;
  teeTime?: string;
  notes?: string;
  claimDate: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { courseName, userEmail, userName, teeTime, notes, claimDate }: PrizeClaimEmailRequest = await req.json();

    console.log("Sending prize claim email:", { courseName, userEmail, userName, teeTime, notes, claimDate });

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Hole Out Golf <onboarding@resend.dev>",
        to: ["info@holeoutgolf.co.uk"],
        subject: `New Prize Claim - ${courseName}`,
        html: `
          <h1>New Hole-in-One Prize Claim</h1>
          <h2>Claim Details</h2>
          <p><strong>Course:</strong> ${courseName}</p>
          <p><strong>Player:</strong> ${userName}</p>
          <p><strong>Email:</strong> ${userEmail}</p>
          <p><strong>Date:</strong> ${new Date(claimDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          ${teeTime ? `<p><strong>Tee Time:</strong> ${teeTime}</p>` : ''}
          ${notes ? `<p><strong>Additional Notes:</strong><br/>${notes}</p>` : ''}
          <hr/>
          <p>This claim requires review and approval in the admin panel.</p>
        `,
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      throw new Error(`Resend API error: ${JSON.stringify(emailData)}`);
    }

    console.log("Email sent successfully:", emailData);

    return new Response(JSON.stringify(emailData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-prize-claim-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
