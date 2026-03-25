import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? 'smtp.hostinger.com',
  port: Number(process.env.SMTP_PORT ?? 465),
  secure: true, // porta 465 usa SSL
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendPasswordResetEmail(to: string, name: string, code: string) {
  await transporter.sendMail({
    from: `"EvoluFit" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Código de recuperação de senha — EvoluFit',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0F1117;padding:32px;border-radius:16px;">
        <h2 style="color:#00E5A0;margin:0 0 8px">EvoluFit</h2>
        <p style="color:#aaa;margin:0 0 24px">Recuperação de senha</p>
        <p style="color:#fff">Olá, <strong>${name}</strong>!</p>
        <p style="color:#aaa">Use o código abaixo para redefinir sua senha. Ele expira em <strong>15 minutos</strong>.</p>
        <div style="background:#1C1F2A;border:1px solid #2A2D3A;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
          <span style="font-size:40px;font-weight:800;letter-spacing:12px;color:#00E5A0">${code}</span>
        </div>
        <p style="color:#555;font-size:12px">Se você não solicitou isso, ignore este email. Sua senha permanece a mesma.</p>
      </div>
    `,
  })
}
