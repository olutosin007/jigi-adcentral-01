import { APP_URL } from '../client'

interface BaseEmailProps {
  preheader?: string
  content: string
}

export function baseEmailTemplate({ preheader = '', content }: BaseEmailProps): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Jigi</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #FEFDFB; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  ${preheader ? `<div style="display: none; max-height: 0; overflow: hidden;">${preheader}</div>` : ''}
  
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FEFDFB;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px;">
          <!-- Header -->
          <tr>
            <td style="padding-bottom: 32px;">
              <a href="${APP_URL}" style="text-decoration: none;">
                <img src="${APP_URL}/logo.png" alt="Jigi" height="32" style="display: block;">
              </a>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="background-color: #FFFFFF; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding-top: 32px; text-align: center;">
              <p style="margin: 0 0 8px; color: #6B7280; font-size: 12px;">
                This email was sent by Jigi. You're receiving this because you have an account.
              </p>
              <p style="margin: 0; color: #9CA3AF; font-size: 12px;">
                © ${new Date().getFullYear()} Jigi. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

export function primaryButton(text: string, url: string): string {
  return `
    <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #0D9488; color: #FFFFFF; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
      ${text}
    </a>
  `.trim()
}

export function secondaryButton(text: string, url: string): string {
  return `
    <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #F3F4F6; color: #374151; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
      ${text}
    </a>
  `.trim()
}
