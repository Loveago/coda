import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { newsletterSchema } from '@/lib/validation';
import { rateLimit, requestAddress } from '@/lib/rate-limit';
export async function POST(request: Request){try{const limit=rateLimit(`newsletter:${requestAddress(request)}`,5);if(!limit.allowed)return NextResponse.json({error:'Too many requests. Please try again shortly.'},{status:429});const parsed=newsletterSchema.safeParse(await request.json());if(!parsed.success)return NextResponse.json({error:'Enter a valid email address.'},{status:400});await db.newsletterSubscriber.upsert({where:{email:parsed.data.email.toLowerCase()},update:{active:true},create:{email:parsed.data.email.toLowerCase()}});return NextResponse.json({success:true});}catch{return NextResponse.json({error:'Unable to subscribe right now.'},{status:500});}}
