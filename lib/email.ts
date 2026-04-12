import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = process.env.RESEND_FROM_EMAIL ?? "noreply@habino.app";

/** Send booking confirmation to user + notification to agent */
export async function sendBookingEmails(params: {
  userEmail: string;
  userName: string;
  agentEmail?: string;
  agentName?: string;
  propertyTitle: string;
  scheduledAt: string;
  notes?: string;
}) {
  if (!process.env.RESEND_API_KEY) return; // skip if not configured

  const dateStr = new Date(params.scheduledAt).toLocaleString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  // Confirmation to user
  await resend.emails.send({
    from: FROM,
    to:   params.userEmail,
    subject: `Viewing confirmed — ${params.propertyTitle}`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;">
        <img src="https://habino.app/icon-192.svg" width="48" style="margin-bottom:24px;" />
        <h2 style="color:#1A1A2E;font-size:20px;margin:0 0 8px;">Your viewing is booked ✅</h2>
        <p style="color:#717171;font-size:15px;margin:0 0 24px;">Hi ${params.userName}, your viewing request has been sent to the agent.</p>
        <div style="background:#F7FAF9;border-radius:12px;padding:20px;margin-bottom:24px;">
          <p style="color:#2D6A4F;font-weight:700;margin:0 0 4px;font-size:15px;">${params.propertyTitle}</p>
          <p style="color:#1A1A2E;font-size:14px;margin:0 0 4px;">📅 ${dateStr}</p>
          ${params.notes ? `<p style="color:#717171;font-size:13px;margin:8px 0 0;">Note: ${params.notes}</p>` : ""}
        </div>
        <p style="color:#717171;font-size:13px;">The agent will confirm shortly. You can follow up in the Messages section.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
        <p style="color:#AFAFAF;font-size:12px;">Habino — AI Property Platform</p>
      </div>
    `,
  });

  // Notification to agent
  if (params.agentEmail) {
    await resend.emails.send({
      from: FROM,
      to:   params.agentEmail,
      subject: `New viewing request — ${params.propertyTitle}`,
      html: `
        <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;">
          <h2 style="color:#1A1A2E;font-size:20px;margin:0 0 8px;">New viewing request 📅</h2>
          <p style="color:#717171;font-size:15px;margin:0 0 24px;">Hi ${params.agentName ?? "Agent"}, a user has requested a viewing.</p>
          <div style="background:#F7FAF9;border-radius:12px;padding:20px;margin-bottom:24px;">
            <p style="color:#2D6A4F;font-weight:700;margin:0 0 4px;font-size:15px;">${params.propertyTitle}</p>
            <p style="color:#1A1A2E;font-size:14px;margin:0 0 4px;">📅 ${dateStr}</p>
            <p style="color:#1A1A2E;font-size:14px;margin:0 0 4px;">👤 ${params.userName} (${params.userEmail})</p>
            ${params.notes ? `<p style="color:#717171;font-size:13px;margin:8px 0 0;">Note: ${params.notes}</p>` : ""}
          </div>
          <p style="color:#717171;font-size:13px;">Please confirm or reschedule via the Habino platform.</p>
        </div>
      `,
    });
  }
}

/** Notify agent of a new in-app message */
export async function sendNewMessageEmail(params: {
  agentEmail: string;
  agentName?: string;
  senderName: string;
  propertyTitle: string;
  messagePreview: string;
}) {
  if (!process.env.RESEND_API_KEY) return;

  await resend.emails.send({
    from: FROM,
    to:   params.agentEmail,
    subject: `New message from ${params.senderName} — ${params.propertyTitle}`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;">
        <h2 style="color:#1A1A2E;font-size:20px;margin:0 0 8px;">New message ✉️</h2>
        <p style="color:#717171;font-size:15px;margin:0 0 24px;">Hi ${params.agentName ?? "Agent"}, you have a new message.</p>
        <div style="background:#F7FAF9;border-radius:12px;padding:20px;margin-bottom:24px;">
          <p style="color:#2D6A4F;font-weight:700;margin:0 0 4px;font-size:15px;">${params.propertyTitle}</p>
          <p style="color:#1A1A2E;font-size:14px;margin:0 0 4px;">From: ${params.senderName}</p>
          <p style="color:#717171;font-size:13px;margin:8px 0 0;font-style:italic;">"${params.messagePreview}"</p>
        </div>
        <a href="https://habino.app/messages" style="display:inline-block;background:#2D6A4F;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;">Reply in Habino →</a>
      </div>
    `,
  });
}
