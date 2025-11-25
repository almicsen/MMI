/**
 * API Route: Generate API Key
 * Server-side only - uses Node.js crypto
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateAPIKey, hashAPIKey } from '@/lib/api/security-server';

export async function POST(request: NextRequest) {
  try {
    // Verify admin access (you'll need to implement this based on your auth setup)
    // For now, we'll just return the generated key
    // In production, add proper authentication checks
    
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

