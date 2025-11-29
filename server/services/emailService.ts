export interface SendWelcomeEmailParams {
  email: string;
  clinicName: string;
  username: string;
}

export interface SendInvitationEmailParams {
  email: string;
  clinicName: string;
  invitationUrl: string;
  invitedByUsername: string;
}

export const emailService = {
  /**
   * Send welcome email after successful signup using Supabase Auth
   */
  async sendWelcomeEmail(params: SendWelcomeEmailParams): Promise<void> {
    const { email, clinicName, username } = params;

    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

      // Supabase doesn't have a direct "send custom email" API
      // We'll use the auth.admin.inviteUserByEmail with a custom email template
      // Note: This requires configuring email templates in Supabase Dashboard

      // For now, log the welcome message
      console.log('\n=================================');
      console.log('✅ User Signup Successful');
      console.log('=================================');
      console.log('Email:', email);
      console.log('Username:', username);
      console.log('Clinic:', clinicName);
      console.log('Login URL:', appUrl);
      console.log('=================================\n');

      // TODO: Configure Supabase email templates in Dashboard
      // Navigate to: Authentication > Email Templates
      // You can customize the "Confirm signup" template with your branding

      console.log(`✅ Welcome message logged for ${email} - Configure Supabase email templates for automatic sending`);
    } catch (error: any) {
      console.error('❌ Failed to log welcome message:', error);
      // Don't throw - we don't want to fail signup if email fails
    }
  },

  /**
   * Send invitation email to join a clinic using Supabase Auth
   */
  async sendInvitationEmail(params: SendInvitationEmailParams): Promise<void> {
    const { email, clinicName, invitationUrl, invitedByUsername } = params;

    try {
      // Log the invitation for now
      console.log('\n=================================');
      console.log('📧 Invitation Created');
      console.log('=================================');
      console.log('To:', email);
      console.log('Clinic:', clinicName);
      console.log('Invited By:', invitedByUsername);
      console.log('Invitation Link:', invitationUrl);
      console.log('=================================\n');

      // Note: Supabase Auth's inviteUserByEmail creates an auth user immediately,
      // which is not what we want for our invitation flow.
      //
      // Options for sending emails with Supabase:
      // 1. Use Supabase Edge Functions with a third-party email service
      // 2. Use Supabase's built-in SMTP settings (Dashboard > Project Settings > Auth > SMTP Settings)
      // 3. Wait for Supabase's custom email API (in development)
      //
      // For now, admins should share the invitation link manually
      // or you can integrate a simple email service like Resend, SendGrid, or Mailgun

      console.log(`📧 Invitation link ready for ${email} - Share this link with the user or configure SMTP in Supabase`);
    } catch (error: any) {
      console.error('❌ Failed to create invitation:', error);
      // For invitations, we might want to throw to let admin know
      throw new Error('Failed to create invitation. Please try again.');
    }
  },

  /**
   * Configure Supabase to send transactional emails
   *
   * Setup Instructions:
   *
   * 1. Go to Supabase Dashboard > Project Settings > Auth > SMTP Settings
   * 2. Enable "Enable Custom SMTP"
   * 3. Configure your SMTP provider (Gmail, SendGrid, Mailgun, etc.)
   * 4. Test the connection
   * 5. Update email templates in Authentication > Email Templates
   *
   * Recommended SMTP Providers:
   * - Gmail (for testing only - has rate limits)
   * - SendGrid (free tier: 100 emails/day)
   * - Mailgun (free tier: 5,000 emails/month)
   * - Amazon SES (very cheap, reliable)
   *
   * Once SMTP is configured, Supabase will automatically send emails for:
   * - Email confirmation (signup)
   * - Password reset
   * - Email change confirmation
   *
   * For custom emails (like invitations), you'll need to:
   * - Use Supabase Edge Functions, OR
   * - Integrate a third-party email service directly
   */
};
