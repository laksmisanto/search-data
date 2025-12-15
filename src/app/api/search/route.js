// app/api/search/route.js

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getCollection } from '@/app/lib/mongodb'

// ----------------------
// Escape regex safely
function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function buildQuery(query, filters = {}, mode = 'and') {
  const andParts = []

  // ----------------------
  // Exact filters
  // ----------------------
  if (filters.id) andParts.push({ id: String(filters.id) })
  if (filters.drive) andParts.push({ drive: String(filters.drive) })
  if (filters.reporter) andParts.push({ reporter: String(filters.reporter) })

  // ----------------------
  // Text search
  // ----------------------
  const q = String(query).trim()
  if (q) {
    // Extract words and quoted phrases
    const terms =
      q.match(/"[^"]+"|\S+/g)?.map((t) => t.replace(/^"|"$/g, '')) || []

    const textConditions = terms.map((term) => {
      const isPhrase = term.includes(' ')
      const pattern = isPhrase
        ? escapeRegex(term) // exact phrase
        : `\\b${escapeRegex(term)}\\b` // whole word

      const rx = new RegExp(pattern, 'i')

      return {
        $or: [{ id: rx }, { drive: rx }, { reporter: rx }, { metadata: rx }],
      }
    })

    if (textConditions.length > 0) {
      andParts.push(
        mode === 'and' ? { $and: textConditions } : { $or: textConditions }
      )
    }
  }

  // ----------------------
  // Final query
  // ----------------------
  if (andParts.length === 0) return {}
  if (andParts.length === 1) return andParts[0]
  return { $and: andParts }
}

// ----------------------
// Clean empty query
// ----------------------
function cleanQuery(q) {
  if (!q || typeof q !== 'object') return {}
  if (Object.keys(q).length === 0) return {}

  if (q.$and && q.$and.length === 0) return {}

  return q
}

// ----------------------
// POST handler
// ----------------------
export async function POST(req) {
  try {
    let body = {}
    try {
      body = await req.json()
    } catch {}

    const {
      query = '',
      page = 1,
      pageSize = 20,
      filters = {},
      mode = 'and',
    } = body

    const safePage = Math.max(1, Number(page))
    const safePageSize = Math.min(200, Math.max(1, Number(pageSize)))

    const skip = (safePage - 1) * safePageSize
    const limit = safePageSize

    const col = await getCollection('records')

    const mongoQuery = buildQuery(query, filters, mode)
    const finalQuery = cleanQuery(mongoQuery)

    const [items, total] = await Promise.all([
      col
        .find(finalQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),

      col.countDocuments(finalQuery),
    ])

    return NextResponse.json({
      success: true,
      items,
      total,
      page: safePage,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (err) {
    console.error('SEARCH ERROR:', err)
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    )
  }
}
