import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const targetUserId = body?.userId;

    if (!targetUserId || !['user_alice', 'user_bob'].includes(targetUserId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const response = NextResponse.json({
      success: true,
      activeUser: targetUserId,
      message: `Switched active user to ${targetUserId}`,
    });

    response.cookies.set('lld_demo_user_id', targetUserId, {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
