import { supabaseServer } from '../utils/supabase';
import type { Invitation } from '@/types';

export interface SendInvitationInput {
  email: string;
  userRole: string;
  clinicId: string;
  invitedBy: string;
}

export interface AcceptInvitationInput {
  invitationToken: string;
  password: string;
}

export const invitationService = {
  /**
   * Send an invitation to a user
   */
  async sendInvitation(input: SendInvitationInput): Promise<Invitation> {
    const { email, userRole, clinicId, invitedBy } = input;

    // Validate user role
    if (!['admin', 'employee'].includes(userRole)) {
      throw new Error('Invalid user role. Must be admin or employee.');
    }

    // Check if user already exists with this email in this clinic
    const { data: existingUser } = await supabaseServer
      .from('users')
      .select('user_id, email')
      .eq('email', email)
      .eq('clinic_id', clinicId)
      .single();

    if (existingUser) {
      throw new Error('User with this email already exists in this clinic.');
    }

    // Check if there's already an active invitation
    const { data: existingInvitation } = await supabaseServer
      .from('invitations')
      .select('*')
      .eq('email', email)
      .eq('clinic_id', clinicId)
      .eq('status', 'invited')
      .single();

    // If there's an existing invitation, resend it
    if (existingInvitation) {
      // Update the expiry date
      const { data: updatedInvitation, error: updateError } = await supabaseServer
        .from('invitations')
        .update({
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
        })
        .eq('invitation_id', existingInvitation.invitation_id)
        .select('*')
        .single();

      if (updateError) {
        throw new Error(`Failed to update invitation: ${updateError.message}`);
      }

      // Send the invitation email
      await this.sendInvitationEmail(email, updatedInvitation.invitation_token, clinicId);

      return this.formatInvitation(updatedInvitation);
    }

    // Create new invitation
    const { data: invitation, error } = await supabaseServer
      .from('invitations')
      .insert({
        email,
        clinic_id: clinicId,
        invited_by: invitedBy,
        user_role: userRole,
        status: 'invited',
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to create invitation: ${error.message}`);
    }

    // Send the invitation email
    await this.sendInvitationEmail(email, invitation.invitation_token, clinicId);

    return this.formatInvitation(invitation);
  },

  /**
   * Send invitation email via Supabase Auth
   */
  async sendInvitationEmail(email: string, invitationToken: string, clinicId: string): Promise<void> {
    // Get clinic name for email branding
    const { data: clinic } = await supabaseServer
      .from('clinics')
      .select('name')
      .eq('clinic_id', clinicId)
      .single();

    const clinicName = clinic?.name || 'DaanaRx';

    // Create a signup link with invitation token
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/signup?invitation=${invitationToken}`;

    // Send email using Supabase's invite user feature
    const { error } = await supabaseServer.auth.admin.inviteUserByEmail(email, {
      data: {
        invitation_token: invitationToken,
        clinic_name: clinicName,
        invite_url: inviteUrl,
      },
      redirectTo: inviteUrl,
    });

    if (error) {
      console.error('Failed to send invitation email:', error);
      throw new Error(`Failed to send invitation email: ${error.message}`);
    }
  },

  /**
   * Get all invitations for a clinic
   */
  async getInvitations(clinicId: string): Promise<Invitation[]> {
    const { data: invitations, error } = await supabaseServer
      .from('invitations')
      .select(`
        *,
        invitedByUser:invited_by(user_id, username, email)
      `)
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch invitations: ${error.message}`);
    }

    return invitations.map(this.formatInvitation);
  },

  /**
   * Get invitation by token
   */
  async getInvitationByToken(invitationToken: string): Promise<Invitation | null> {
    const { data: invitation, error } = await supabaseServer
      .from('invitations')
      .select(`
        *,
        invitedByUser:invited_by(user_id, username, email)
      `)
      .eq('invitation_token', invitationToken)
      .single();

    if (error || !invitation) {
      return null;
    }

    // Check if invitation is expired
    if (new Date(invitation.expires_at) < new Date()) {
      await supabaseServer
        .from('invitations')
        .update({ status: 'expired' })
        .eq('invitation_id', invitation.invitation_id);

      throw new Error('This invitation has expired.');
    }

    return this.formatInvitation(invitation);
  },

  /**
   * Accept an invitation and create a user account
   */
  async acceptInvitation(input: AcceptInvitationInput): Promise<{ user: any; token: string; clinic: any }> {
    const { invitationToken, password } = input;

    // Get the invitation
    const invitation = await this.getInvitationByToken(invitationToken);

    if (!invitation) {
      throw new Error('Invalid invitation token.');
    }

    if (invitation.status !== 'invited') {
      throw new Error('This invitation has already been used or expired.');
    }

    // Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabaseServer.auth.admin.createUser({
      email: invitation.email,
      password,
      email_confirm: true,
    });

    if (authError) {
      throw new Error(`Failed to create user: ${authError.message}`);
    }

    // Create the user record in the database
    const { data: user, error: userError } = await supabaseServer
      .from('users')
      .insert({
        user_id: authData.user.id,
        email: invitation.email,
        username: invitation.email.split('@')[0],
        clinic_id: invitation.clinicId,
        user_role: invitation.userRole,
      })
      .select('*')
      .single();

    if (userError) {
      // Rollback: delete the auth user
      await supabaseServer.auth.admin.deleteUser(authData.user.id);
      throw new Error(`Failed to create user record: ${userError.message}`);
    }

    // Mark invitation as accepted
    await supabaseServer
      .from('invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .eq('invitation_id', invitation.invitationId);

    // Get the clinic
    const { data: clinic, error: clinicError } = await supabaseServer
      .from('clinics')
      .select('*')
      .eq('clinic_id', invitation.clinicId)
      .single();

    if (clinicError) {
      throw new Error(`Failed to fetch clinic: ${clinicError.message}`);
    }

    // Sign in the user to get a token
    const { data: signInData, error: signInError } = await supabaseServer.auth.signInWithPassword({
      email: invitation.email,
      password,
    });

    if (signInError) {
      throw new Error(`Failed to sign in: ${signInError.message}`);
    }

    return {
      user,
      token: signInData.session.access_token,
      clinic,
    };
  },

  /**
   * Resend an invitation
   */
  async resendInvitation(invitationId: string, clinicId: string): Promise<Invitation> {
    const { data: invitation, error } = await supabaseServer
      .from('invitations')
      .select('*')
      .eq('invitation_id', invitationId)
      .eq('clinic_id', clinicId)
      .single();

    if (error || !invitation) {
      throw new Error('Invitation not found.');
    }

    if (invitation.status !== 'invited') {
      throw new Error('Cannot resend an invitation that has been accepted or expired.');
    }

    // Update the expiry date
    const { data: updatedInvitation, error: updateError } = await supabaseServer
      .from('invitations')
      .update({
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
      })
      .eq('invitation_id', invitationId)
      .select('*')
      .single();

    if (updateError) {
      throw new Error(`Failed to resend invitation: ${updateError.message}`);
    }

    // Resend the email
    await this.sendInvitationEmail(
      updatedInvitation.email,
      updatedInvitation.invitation_token,
      updatedInvitation.clinic_id
    );

    return this.formatInvitation(updatedInvitation);
  },

  /**
   * Cancel an invitation
   */
  async cancelInvitation(invitationId: string, clinicId: string): Promise<boolean> {
    const { error } = await supabaseServer
      .from('invitations')
      .delete()
      .eq('invitation_id', invitationId)
      .eq('clinic_id', clinicId);

    if (error) {
      throw new Error(`Failed to cancel invitation: ${error.message}`);
    }

    return true;
  },

  /**
   * Format invitation data
   */
  formatInvitation(data: any): Invitation {
    return {
      invitationId: data.invitation_id,
      email: data.email,
      clinicId: data.clinic_id,
      invitedBy: data.invited_by,
      invitedByUser: data.invitedByUser
        ? {
            userId: data.invitedByUser.user_id,
            username: data.invitedByUser.username,
            email: data.invitedByUser.email,
          }
        : undefined,
      userRole: data.user_role,
      status: data.status,
      invitationToken: data.invitation_token,
      createdAt: data.created_at,
      expiresAt: data.expires_at,
      acceptedAt: data.accepted_at,
    };
  },
};

