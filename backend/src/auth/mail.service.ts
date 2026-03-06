import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
    private transporter: nodemailer.Transporter;
    private readonly logger = new Logger(MailService.name);

    constructor(private configService: ConfigService) {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: this.configService.get<string>('SMTP_USER'),
                pass: this.configService.get<string>('SMTP_PASS'),
            },
        });
    }

    async sendOTP(to: string, otp: string) {
        const mailOptions = {
            from: `"CampusFeed Support" <${this.configService.get<string>('SMTP_USER')}>`,
            to,
            subject: 'Account Activation OTP - CampusFeed',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #4f46e5; text-align: center;">Welcome to CampusFeed!</h2>
          <p>Hello,</p>
          <p>Please use the following 6-digit OTP to activate your account and set your password. This OTP is valid for 5 minutes.</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1e1b4b; background: #f3f4f6; padding: 10px 20px; border-radius: 5px; border: 1px solid #d1d5db;">
              ${otp}
            </span>
          </div>
          <p>If you did not request this, please ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #6b7280; text-align: center;">
            &copy; 2026 CampusFeed. All rights reserved.
          </p>
        </div>
      `,
        };

        try {
            await this.transporter.sendMail(mailOptions);
            this.logger.log(`OTP sent successfully to ${to}`);
        } catch (error) {
            this.logger.error(`Failed to send OTP to ${to}`, error.stack);
            throw error;
        }
    }
}
