import { z } from 'zod';
export const newsletterSchema = z.object({ email: z.string().email() });
export const contactSchema = z.object({ name:z.string().min(2), email:z.string().email(), phone:z.string().optional(), subject:z.string().min(2), message:z.string().min(10) });
export const membershipSchema = z.object({ fullName:z.string().min(2), phone:z.string().min(7), email:z.string().email(), platform:z.string().optional(), vehicleInfo:z.string().optional(), region:z.string().optional(), additionalInfo:z.string().optional(), consent:z.literal('on') });
