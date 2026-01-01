/**
 * API Route: Generate API Key
 * Server-side only - uses Node.js crypto
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateAPIKey, hashAPIKey } from '@/lib/api/security-server';
import { requireAdmin } from '@/lib/auth/server';

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    
    const key = generateAPIKey();
    const hashedKey = hashAPIKey(key);
    
    return NextResponse.json({ 
      key, 
      hashedKey 
    });
  } catch (error) {
    console.error('Error generating API key:', error);
    return NextResponse.json(
      { error: 'Failed to generate API key' },
      { status: 500 }
    );
  }
}
