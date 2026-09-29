const FROM = "Reach Rewards <hello@reachnetworkrec.com>";

export async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  });
  if (!res.ok) {
    throw new Error(`Email failed to send: ${await res.text()}`);
  }
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function inviteEmailHtml(opts: {
  name: string;
  companyName: string;
  link: string;
  role: "admin" | "employee";
  hasPassword: boolean;
}) {
  const intro =
    opts.role === "admin"
      ? `You've been set up as the Reach Rewards admin for <strong>${esc(opts.companyName)}</strong>. You can add your team so they get access to discounts and offers too.`
      : `<strong>${esc(opts.companyName)}</strong> has given you access to Reach Rewards: discounts and offers from national retailers and local businesses.`;

  const action = opts.hasPassword
    ? "Log in with your existing email and password to get started."
    : "Set your password to get started. This link expires in 24 hours.";

  const button = opts.hasPassword ? "Log in to Reach Rewards" : "Set your password";

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#0F2438">
    <div style="background:#0F2438;padding:24px 28px;border-radius:12px 12px 0 0">
      <span style="color:#ffffff;font-size:20px;font-weight:bold">Reach Rewards</span>
    </div>
    <div style="border:1px solid #e2e8f0;border-top:none;padding:28px;border-radius:0 0 12px 12px">
      <p style="font-size:16px;margin:0 0 16px">Hi ${esc(opts.name)},</p>
      <p style="font-size:15px;line-height:1.6;margin:0 0 16px">${intro}</p>
      <p style="font-size:15px;line-height:1.6;margin:0 0 24px">${action}</p>
      <a href="${opts.link}" style="display:inline-block;background:#F7931E;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:8px">${button}</a>
      <p style="font-size:13px;color:#64748b;line-height:1.6;margin:28px 0 0">
        Reach Rewards is provided by Reach Network Recruitment. If you weren't expecting this email, you can ignore it.
      </p>
    </div>
  </div>`;
}