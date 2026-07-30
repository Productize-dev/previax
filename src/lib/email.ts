import { ADMIN_NOTIFY_EMAIL } from "@/lib/config";

type SendEmailInput = {
  to?: string;
  subject: string;
  text: string;
  html?: string;
};

/**
 * Sends transactional email via Resend when RESEND_API_KEY is set.
 * Always returns ok:true for the in-app path when email is skipped,
 * so workflow continues without blocking.
 */
export async function sendTransactionalEmail(
  input: SendEmailInput,
): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const to = input.to ?? ADMIN_NOTIFY_EMAIL;
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.RESEND_FROM_EMAIL ?? "Previax <onboarding@resend.dev>";

  if (!apiKey) {
    console.info("[email:skipped]", { to, subject: input.subject });
    return { ok: true, skipped: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: input.subject,
        text: input.text,
        html: input.html ?? `<pre>${input.text}</pre>`,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[email:failed]", res.status, body);
      return { ok: false, error: body };
    }

    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Email failed";
    console.error("[email:error]", message);
    return { ok: false, error: message };
  }
}

/** @deprecated Prefer sendTransactionalEmail */
export async function sendAdminEmail(input: SendEmailInput) {
  return sendTransactionalEmail(input);
}
