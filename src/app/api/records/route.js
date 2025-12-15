// app/api/records/route.js
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getCollection } from '@/app/lib/mongodb'

export async function GET(req) {
  // Optional: allow query parameters for admin listing
  const url = new URL(req.url)
  const page = Math.max(1, Number(url.searchParams.get('page') || 1))
  const pageSize = Math.min(
    200,
    Math.max(1, Number(url.searchParams.get('pageSize') || 50))
  )
  const skip = (page - 1) * pageSize

  const col = await getCollection('records')

  const [items, total] = await Promise.all([
    col
      .find({}, { projection: { __raw: 0 } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .toArray(),
    col.countDocuments({}),
  ])

  return NextResponse.json({
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  })
}

export async function DELETE() {
  const col = await getCollection('records')
  const result = await col.deleteMany({})
  return NextResponse.json({ deleted: result.deletedCount ?? 0 })
}
