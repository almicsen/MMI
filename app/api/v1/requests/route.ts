import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { APIKeyRequest } from '@/lib/firebase/types';

/**
 * API Key Request Endpoint
 * POST /api/v1/requests - Submit a new API key request
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, company, useCase, expectedMonthlyVolume, deploymentPreference } = body;

    // Validation
    if (!name || !email || !useCase || expectedMonthlyVolume === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create request
    const requestData = {
      name,
      email,
      company: company || '',
      useCase,
      expectedMonthlyVolume: parseInt(expectedMonthlyVolume) || 0,
      deploymentPreference: deploymentPreference || 'saas',
      status: 'pending' as const,
      createdAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, 'apiKeyRequests'), requestData);

    return NextResponse.json({
      success: true,
      requestId: docRef.id,
      message: 'Request submitted successfully',
    });
  } catch (error: any) {
    console.error('Error creating API key request:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

