import { User, Clinic } from '@/types';

export interface GraphQLContext {
  user?: User;
  clinic?: Clinic;
  token?: string;
}

export interface JWTPayload {
  userId: string;
  clinicId: string;
  userRole: string;
}
