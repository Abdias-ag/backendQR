'use strict';

require('dotenv').config();

/**
 * @service EmailService
 * @description Service d'envoi d'emails via l'API HTTPS Brevo
 */

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

const sendBrevoEmail = async ({ to, subject, html }) => {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME;

  if (!apiKey) {
    throw new Error('BREVO_API_KEY non configuré');
  }

  if (!senderEmail) {
    throw new Error('BREVO_SENDER_EMAIL non configuré');
  }

  if (!senderName) {
    throw new Error('BREVO_SENDER_NAME non configuré');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: senderName,
          email: senderEmail,
        },
        to: [
          {
            email: to,
          },
        ],
        subject,
        htmlContent: html,
      }),
      signal: controller.signal,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = data?.message || `Brevo API error (${response.status})`;
      throw new Error(message);
    }

    return data;
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('Brevo API timeout after 15s');
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * Template HTML commun
 */
const emailTemplate = (content) => `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QR Platform</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f0f4ff; color: #1a1a2e; }
    .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #4361ee, #7209b7); padding: 40px 40px 30px; text-align: center; }
    .header h1 { color: white; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { color: rgba(255,255,255,0.8); margin-top: 8px; font-size: 14px; }
    .body { padding: 40px; }
    .code-box { background: linear-gradient(135deg, #f0f4ff, #e8f0fe); border: 2px solid #4361ee; border-radius: 12px; text-align: center; padding: 24px; margin: 24px 0; }
    .code { font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #4361ee; font-family: monospace; }
    .btn { display: inline-block; background: linear-gradient(135deg, #4361ee, #7209b7); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; margin: 16px 0; }
    .footer { background: #f8f9ff; padding: 24px 40px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #e8e8e8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔲 QR Platform</h1>
      <p>La plateforme professionnelle de QR Codes Dynamiques</p>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} QR Platform. Tous droits réservés.</p>
      <p style="margin-top: 8px;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
    </div>
  </div>
</body>
</html>
`;

/**
 * Envoyer un email de vérification de compte
 * @param {string} to - Adresse email destinataire
 * @param {string} name - Prénom de l'utilisateur
 * @param {string} code - Code de vérification
 */
const sendVerificationEmail = async (to, name, code) => {
  const content = `
    <h2 style="font-size: 22px; margin-bottom: 12px;">Vérifiez votre compte 👋</h2>
    <p style="color: #555; line-height: 1.6;">Bonjour <strong>${name}</strong>,</p>
    <p style="color: #555; line-height: 1.6; margin-top: 12px;">Merci de vous être inscrit sur QR Platform. Utilisez le code ci-dessous pour vérifier votre adresse email.</p>
    <div class="code-box">
      <p style="color: #666; font-size: 13px; margin-bottom: 8px;">Votre code de vérification</p>
      <div class="code">${code}</div>
      <p style="color: #999; font-size: 12px; margin-top: 8px;">Valable 15 minutes</p>
    </div>
    <p style="color: #555; font-size: 14px;">Si vous n'avez pas créé de compte, ignorez cet email.</p>
  `;

  return sendBrevoEmail({
    to,
    subject: `${code} - Code de vérification QR Platform`,
    html: emailTemplate(content),
  });
};

/**
 * Envoyer un email de réinitialisation de mot de passe
 * @param {string} to - Adresse email destinataire
 * @param {string} name - Prénom de l'utilisateur
 * @param {string} code - Code de réinitialisation
 */
const sendResetPasswordEmail = async (to, name, code) => {
  const content = `
    <h2 style="font-size: 22px; margin-bottom: 12px;">Réinitialisation du mot de passe 🔐</h2>
    <p style="color: #555; line-height: 1.6;">Bonjour <strong>${name}</strong>,</p>
    <p style="color: #555; line-height: 1.6; margin-top: 12px;">Vous avez demandé à réinitialiser votre mot de passe. Utilisez le code ci-dessous.</p>
    <div class="code-box">
      <p style="color: #666; font-size: 13px; margin-bottom: 8px;">Code de réinitialisation</p>
      <div class="code">${code}</div>
      <p style="color: #999; font-size: 12px; margin-top: 8px;">Valable 15 minutes</p>
    </div>
    <p style="color: #e63946; font-size: 14px;">⚠️ Si vous n'avez pas fait cette demande, changez votre mot de passe immédiatement.</p>
  `;

  return sendBrevoEmail({
    to,
    subject: `${code} - Réinitialisation mot de passe QR Platform`,
    html: emailTemplate(content),
  });
};

/**
 * Envoyer un email de bienvenue après vérification
 * @param {string} to - Adresse email
 * @param {string} name - Prénom
 */
const sendWelcomeEmail = async (to, name) => {
  const content = `
    <h2 style="font-size: 22px; margin-bottom: 12px;">Bienvenue sur QR Platform ! 🎉</h2>
    <p style="color: #555; line-height: 1.6;">Bonjour <strong>${name}</strong>,</p>
    <p style="color: #555; line-height: 1.6; margin-top: 12px;">Votre compte est maintenant vérifié et actif. Commencez à créer vos premiers QR Codes dynamiques !</p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${process.env.FRONTEND_URL}/dashboard" class="btn">Accéder au Dashboard →</a>
    </div>
    <p style="color: #555; font-size: 14px; line-height: 1.6;"><strong>Avec votre plan Gratuit vous pouvez :</strong></p>
    <ul style="color: #555; font-size: 14px; line-height: 2; padding-left: 20px; margin-top: 8px;">
      <li>Créer jusqu'à 5 QR Codes dynamiques</li>
      <li>Suivre jusqu'à 500 scans/mois</li>
      <li>Personnaliser couleurs et logos</li>
    </ul>
  `;

  return sendBrevoEmail({
    to,
    subject: '🎉 Bienvenue sur QR Platform !',
    html: emailTemplate(content),
  });
};

module.exports = {
  sendVerificationEmail,
  sendResetPasswordEmail,
  sendWelcomeEmail,
};
