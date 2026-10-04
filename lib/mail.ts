import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendVerificationEmail({
  email,
  name,
  token,
}: {
  email: string;
  name: string;
  token: string;
}) {
  const appUrl = process.env.APP_URL;

  if (!appUrl) {
    throw new Error("APP_URL is not configured");
  }

  const verificationUrl = `${appUrl}/verify-email?token=${token}`;

  await transporter.sendMail({
    from: `"ChitChat" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Verify your ChitChat email",

    html: `
      <!DOCTYPE html>
      <html>
        <body style="
          margin: 0;
          padding: 40px 20px;
          background: #f8fafc;
          font-family: Arial, sans-serif;
        ">

          <div style="
            max-width: 480px;
            margin: auto;
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 20px;
            padding: 32px;
          ">

            <div style="
              width: 44px;
              height: 44px;
              border-radius: 12px;
              background: linear-gradient(
                135deg,
                #3b82f6,
                #7c3aed
              );
              color: white;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 22px;
              font-weight: bold;
            ">
              C
            </div>

            <h1 style="
              margin-top: 24px;
              color: #111827;
            ">
              Verify your email
            </h1>

            <p style="
              color: #6b7280;
              line-height: 1.6;
            ">
              Hi ${name},
            </p>

            <p style="
              color: #6b7280;
              line-height: 1.6;
            ">
              Thanks for creating your ChitChat account.
              Please verify your email address to
              activate your account.
            </p>

            <a
              href="${verificationUrl}"
              style="
                display: inline-block;
                margin: 20px 0;
                padding: 13px 22px;
                border-radius: 10px;
                background: #4f46e5;
                color: white;
                text-decoration: none;
                font-weight: 600;
              "
            >
              Verify Email
            </a>

            <p style="
              color: #9ca3af;
              font-size: 13px;
              line-height: 1.5;
            ">
              This link expires in 24 hours.
            </p>

          </div>

        </body>
      </html>
    `,
  });
}
