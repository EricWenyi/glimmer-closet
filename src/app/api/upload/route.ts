import { NextRequest, NextResponse } from 'next/server';

const backendBase = (
  process.env.CONTENT_API_BASE_URL ||
  process.env.NEXT_PUBLIC_CONTENT_API_BASE_URL ||
  'http://localhost:4001'
).replace(/\/$/, '');

const adminToken = process.env.ADMIN_TOKEN;

export async function POST(req: NextRequest) {
  if (!adminToken) {
    return NextResponse.json({ error: 'ADMIN_TOKEN not configured' }, { status: 500 });
  }

  // Forward the multipart form data as-is to the backend
  const formData = await req.formData();
  const res = await fetch(`${backendBase}/v1/clothes/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: formData,
  });

  const json = await res.json();
  return NextResponse.json(json, { status: res.status });
}
