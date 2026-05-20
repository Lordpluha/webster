import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createTransport, type Transporter } from "nodemailer";

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>("SMTP_HOST")?.trim();
    if (host) {
      const auth = this.buildAuth();
      const port = Number(this.config.get<string | number>("SMTP_PORT", 587));
      this.transporter = createTransport({
        host,
        port,
        secure: port === 465,
        auth,
      });
      if (!auth) {
        this.logger.warn(
          "SMTP_HOST is set but SMTP_USER/SMTP_PASS missing — relay will reject messages",
        );
      } else {
        this.logger.log(`SMTP configured: ${host}:${port}`);
      }
    } else {
      this.logger.warn("SMTP_HOST not set — emails will be logged to console");
    }
  }

  async send(to: string, subject: string, html: string) {
    const from = this.config.get<string>("SMTP_FROM", "Webster <no-reply@webster.local>");

    if (!this.transporter) {
      this.logger.warn(`[Mail] (no SMTP) To: ${to} | Subject: ${subject}`);
      this.logger.debug(html);
      return;
    }

    try {
      const info = await this.transporter.sendMail({ from, to, subject, html });
      this.logger.log(`Mail sent to ${to} (messageId=${info.messageId ?? "n/a"})`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Mail failed to ${to}: ${message}`);
      throw err;
    }
  }

  async sendPasswordReset(email: string, token: string) {
    const baseUrl = this.config.get<string>("FRONTEND_URL", "http://localhost:5173");
    const link = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;

    await this.send(
      email,
      "Password Reset — Webster",
      `<p>You requested a password reset.</p>
       <p><a href="${link}">Click here to reset your password</a></p>
       <p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>`,
    );
  }

  async sendEmailVerification(email: string, token: string) {
    const baseUrl = this.config.get<string>("FRONTEND_URL", "http://localhost:5173");
    const link = `${baseUrl}/verify-email?token=${encodeURIComponent(token)}`;

    await this.send(
      email,
      "Verify your email — Webster",
      `<p>Welcome to Webster!</p>
       <p><a href="${link}">Click here to verify your email</a></p>
       <p>This link expires in 24 hours.</p>`,
    );
  }

  async sendMagicLink(email: string, token: string) {
    const baseUrl = this.config.get<string>("FRONTEND_URL", "http://localhost:5173");
    const link = `${baseUrl}/magic-link?token=${encodeURIComponent(token)}`;

    await this.send(
      email,
      "Sign in to Webster",
      `<p>Click the link below to sign in to your Webster account:</p>
       <p><a href="${link}">Sign in to Webster</a></p>
       <p>This link expires in 15 minutes. If you didn't request this, you can safely ignore this email.</p>`,
    );
  }

  private buildAuth() {
    const user = this.config.get<string>("SMTP_USER")?.trim();
    const pass = this.config.get<string>("SMTP_PASS")?.trim();
    if (user && pass) {
      return { user, pass };
    }
    return undefined;
  }
}
