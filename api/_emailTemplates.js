// Transactional email templates for CertifyCX.
//
// Each function returns { subject, html, text }. Plain strings only — kept
// English-only in v1 because the Supabase Send Email Hook payload does not
// carry user locale. Follow-up: read profiles.preferred_locale in the hook
// and switch on it.

const BRAND = 'CertifyCX';
const SUPPORT_EMAIL = 'mvpcertify@gmail.com';

const layout = ({ title, bodyHtml }) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1a1f36;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;box-shadow:0 1px 3px rgba(16,24,40,0.06);overflow:hidden;">
        <tr><td style="padding:28px 32px;border-bottom:1px solid #eef0f6;">
          <div style="font-size:20px;font-weight:700;color:#0b5fff;letter-spacing:-0.01em;">${BRAND}</div>
        </td></tr>
        <tr><td style="padding:32px;">${bodyHtml}</td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #eef0f6;font-size:12px;color:#6b7280;">
          Need help? Reach us at <a href="mailto:${SUPPORT_EMAIL}" style="color:#0b5fff;text-decoration:none;">${SUPPORT_EMAIL}</a>.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

const button = (href, label) => `<a href="${href}" style="display:inline-block;background:#0b5fff;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;font-size:15px;">${label}</a>`;

export function verifyEmail({ name, verifyUrl }) {
  const greeting = name ? `Hi ${name},` : 'Hello,';
  const subject = `Confirm your ${BRAND} email`;
  const html = layout({
    title: subject,
    bodyHtml: `
      <p style="font-size:16px;line-height:1.5;margin:0 0 16px;">${greeting}</p>
      <p style="font-size:16px;line-height:1.6;margin:0 0 24px;">
        Thanks for registering with ${BRAND}. Please confirm your email address to activate your account.
      </p>
      <p style="margin:0 0 24px;">${button(verifyUrl, 'Confirm email')}</p>
      <p style="font-size:13px;line-height:1.5;color:#6b7280;margin:0 0 8px;">
        Or paste this link into your browser:
      </p>
      <p style="font-size:13px;line-height:1.5;color:#0b5fff;word-break:break-all;margin:0 0 24px;">
        <a href="${verifyUrl}" style="color:#0b5fff;">${verifyUrl}</a>
      </p>
      <p style="font-size:13px;line-height:1.5;color:#6b7280;margin:0;">
        If you didn't sign up for ${BRAND}, you can safely ignore this email.
      </p>`,
  });
  const text = `${greeting}\n\nThanks for registering with ${BRAND}. Confirm your email by visiting:\n${verifyUrl}\n\nIf you didn't sign up, ignore this email.`;
  return { subject, html, text };
}

export function welcomeEmail({ name, role, dashboardUrl }) {
  const greeting = name ? `Welcome, ${name}!` : `Welcome to ${BRAND}!`;
  const subject = `Welcome to ${BRAND}`;
  const roleLine = role === 'client'
    ? 'Your account is ready — you can start a certification application from your dashboard.'
    : 'Your account is ready. Sign in to access your dashboard.';
  const html = layout({
    title: subject,
    bodyHtml: `
      <p style="font-size:18px;font-weight:600;line-height:1.4;margin:0 0 16px;">${greeting}</p>
      <p style="font-size:16px;line-height:1.6;margin:0 0 24px;">
        Your email is confirmed and your ${BRAND} account is active. ${roleLine}
      </p>
      <p style="margin:0 0 24px;">${button(dashboardUrl, 'Open dashboard')}</p>
      <p style="font-size:14px;line-height:1.6;color:#374151;margin:0 0 8px;">A few things you can do next:</p>
      <ul style="font-size:14px;line-height:1.7;color:#374151;margin:0 0 24px;padding-left:20px;">
        <li>Complete your profile and company details.</li>
        <li>Explore the ISO standards we support.</li>
        <li>Reach out any time at <a href="mailto:${SUPPORT_EMAIL}" style="color:#0b5fff;">${SUPPORT_EMAIL}</a>.</li>
      </ul>
      <p style="font-size:13px;line-height:1.5;color:#6b7280;margin:0;">
        Thanks for choosing ${BRAND}.
      </p>`,
  });
  const text = `${greeting}\n\nYour email is confirmed and your ${BRAND} account is active. ${roleLine}\n\nOpen your dashboard: ${dashboardUrl}\n\nQuestions? ${SUPPORT_EMAIL}`;
  return { subject, html, text };
}

export function recoveryEmail({ name, resetUrl }) {
  const greeting = name ? `Hi ${name},` : 'Hello,';
  const subject = `Reset your ${BRAND} password`;
  const html = layout({
    title: subject,
    bodyHtml: `
      <p style="font-size:16px;line-height:1.5;margin:0 0 16px;">${greeting}</p>
      <p style="font-size:16px;line-height:1.6;margin:0 0 24px;">
        We received a request to reset your ${BRAND} password. Click below to choose a new one.
      </p>
      <p style="margin:0 0 24px;">${button(resetUrl, 'Reset password')}</p>
      <p style="font-size:13px;line-height:1.5;color:#6b7280;margin:0 0 8px;">
        Or paste this link into your browser:
      </p>
      <p style="font-size:13px;line-height:1.5;color:#0b5fff;word-break:break-all;margin:0 0 24px;">
        <a href="${resetUrl}" style="color:#0b5fff;">${resetUrl}</a>
      </p>
      <p style="font-size:13px;line-height:1.5;color:#6b7280;margin:0;">
        If you didn't request this, you can safely ignore this email — your password won't change.
      </p>`,
  });
  const text = `${greeting}\n\nReset your ${BRAND} password:\n${resetUrl}\n\nIf you didn't request this, ignore this email.`;
  return { subject, html, text };
}

export function magicLinkEmail({ name, link }) {
  const greeting = name ? `Hi ${name},` : 'Hello,';
  const subject = `Your ${BRAND} sign-in link`;
  const html = layout({
    title: subject,
    bodyHtml: `
      <p style="font-size:16px;line-height:1.5;margin:0 0 16px;">${greeting}</p>
      <p style="font-size:16px;line-height:1.6;margin:0 0 24px;">Click below to sign in to ${BRAND}.</p>
      <p style="margin:0 0 24px;">${button(link, 'Sign in')}</p>
      <p style="font-size:13px;line-height:1.5;color:#6b7280;margin:0;">If you didn't request this link, you can ignore this email.</p>`,
  });
  const text = `${greeting}\n\nSign in: ${link}`;
  return { subject, html, text };
}

export function inviteEmail({ name, link }) {
  const greeting = name ? `Hi ${name},` : 'Hello,';
  const subject = `You're invited to ${BRAND}`;
  const html = layout({
    title: subject,
    bodyHtml: `
      <p style="font-size:16px;line-height:1.5;margin:0 0 16px;">${greeting}</p>
      <p style="font-size:16px;line-height:1.6;margin:0 0 24px;">You've been invited to join ${BRAND}. Accept the invitation to set up your account.</p>
      <p style="margin:0 0 24px;">${button(link, 'Accept invitation')}</p>`,
  });
  const text = `${greeting}\n\nAccept your ${BRAND} invitation: ${link}`;
  return { subject, html, text };
}

export function emailChangeEmail({ name, link }) {
  const greeting = name ? `Hi ${name},` : 'Hello,';
  const subject = `Confirm your new ${BRAND} email`;
  const html = layout({
    title: subject,
    bodyHtml: `
      <p style="font-size:16px;line-height:1.5;margin:0 0 16px;">${greeting}</p>
      <p style="font-size:16px;line-height:1.6;margin:0 0 24px;">Confirm your new email address to finish updating your ${BRAND} account.</p>
      <p style="margin:0 0 24px;">${button(link, 'Confirm new email')}</p>`,
  });
  const text = `${greeting}\n\nConfirm your new email: ${link}`;
  return { subject, html, text };
}
