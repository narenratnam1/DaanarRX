import { NextRequest } from 'next/server';
import { verifyToken, extractToken } from '../utils/auth';
import { getUserById, getClinicById } from '../services/authService';
import { GraphQLContext } from '../types/index';

export async function createGraphQLContext({ req }: { req: NextRequest }): Promise<GraphQLContext> {
  try {
    const authHeader = req.headers.get('authorization');
    const token = extractToken(authHeader);

    if (token) {
      const payload = verifyToken(token);
      const user = await getUserById(payload.userId);
      const clinic = user ? await getClinicById(user.clinicId) : null;

      if (user && clinic) {
        return {
          user,
          clinic,
          token,
        };
      }
    }
  } catch (error) {
    // Token invalid or expired, continue without auth
    console.error('Auth error:', error);
  }

  return {
    user: undefined,
    clinic: undefined,
    token: undefined,
  };
}
