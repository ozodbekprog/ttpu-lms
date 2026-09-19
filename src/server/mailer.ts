import "server-only";
import nodemailer from "nodemailer";

export function getAppUrl() {
  return process.env.APP_URL || "http://localhost:3000";
}

export async function sendMail({
  to,
  subject,
  text,
}: {
  to: string;
  subject: string;
  text: string;
}) {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.MAIL_FROM || user || "no-reply@ttpu.uz";

  if (host && user && pass) {
    const transport = nodemailer.createTransport({
      host,
      port: Number(port || 587),
      secure: Number(port || 587) === 465,
      auth: { user, pass },
    });
    await transport.sendMail({ from, to, subject, text });
    return;
  }

  console.log(`DEV EMAIL\nTo: ${to}\nSubject: ${subject}\n\n${text}`);
}
