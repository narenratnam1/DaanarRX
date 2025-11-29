import { supabaseServer } from '../utils/supabase';
import { Feedback, CreateFeedbackRequest } from '@/types';

/**
 * Create new feedback
 */
export async function createFeedback(
  input: CreateFeedbackRequest,
  userId: string,
  clinicId: string
): Promise<Feedback> {
  const { data: feedback, error } = await supabaseServer
    .from('feedback')
    .insert({
      clinic_id: clinicId,
      user_id: userId,
      feedback_type: input.feedbackType,
      feedback_message: input.feedbackMessage,
    })
    .select()
    .single();

  if (error || !feedback) {
    throw new Error(`Failed to create feedback: ${error?.message}`);
  }

  return formatFeedback(feedback);
}

/**
 * Format feedback data from database
 */
function formatFeedback(feedback: any): Feedback {
  return {
    feedbackId: feedback.feedback_id,
    clinicId: feedback.clinic_id,
    userId: feedback.user_id,
    feedbackType: feedback.feedback_type,
    feedbackMessage: feedback.feedback_message,
    createdAt: new Date(feedback.created_at),
    updatedAt: new Date(feedback.updated_at),
  };
}
