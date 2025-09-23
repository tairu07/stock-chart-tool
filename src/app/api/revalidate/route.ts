import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import type { RevalidateRequest } from '@/lib/types/api';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body: RevalidateRequest = await request.json();
    const { secret, tags } = body;

    // シークレットキーの検証
    if (secret !== process.env.REVALIDATE_SECRET) {
      return NextResponse.json(
        { error: 'Invalid secret' },
        { status: 401 }
      );
    }

    // タグの検証
    if (!Array.isArray(tags) || tags.length === 0) {
      return NextResponse.json(
        { error: 'Tags array is required' },
        { status: 400 }
      );
    }

    // 各タグを再検証
    const revalidatedTags: string[] = [];
    const errors: string[] = [];

    for (const tag of tags) {
      try {
        if (typeof tag === 'string' && tag.length > 0) {
          revalidateTag(tag);
          revalidatedTags.push(tag);
        } else {
          errors.push(`Invalid tag: ${tag}`);
        }
      } catch (error) {
        console.error(`Error revalidating tag ${tag}:`, error);
        errors.push(`Failed to revalidate tag: ${tag}`);
      }
    }

    const response = {
      success: true,
      revalidatedTags,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    };

    console.log('Cache revalidation completed:', response);

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in revalidate API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
