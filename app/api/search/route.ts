import { NextResponse } from 'next/server';
import {
  parseSearchRequest,
  searchAcrossPlatforms
} from '@/lib/platforms';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { query, platforms } = parseSearchRequest(payload);
    const data = await searchAcrossPlatforms({ query, platforms });
    return NextResponse.json(data);
  } catch (error) {
    console.error('[search-route] failed', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
