// app/api/upload/route.js
import { NextResponse } from 'next/server'
import { getCollection } from '@/app/lib/mongodb'
import * as XLSX from 'xlsx'

// Next.js App Router config
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Chunk helper
function chunkArray(arr, size) {
  const out = []
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size))
  }
  return out
}

// Parse multipart form file
async function parseMultipartFile(req) {
  const formData = await req.formData()
  const file = formData.get('file')

  if (!file || typeof file === 'string') {
    return { error: 'No file provided' }
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const firstSheet = workbook.SheetNames[0]
    const sheet = workbook.Sheets[firstSheet]
    const json = XLSX.utils.sheet_to_json(sheet, { defval: '' })
    return { rows: json }
  } catch (e) {
    return { error: 'Unable to read spreadsheet: ' + e.message }
  }
}

// Normalizer
function normalizeRow(row) {
  const id = (row.id ?? row.ID ?? row.Id ?? '').toString()
  const drive = (
    row.drive ??
    row.Drive ??
    row.DRIVE ??
    row.DriveName ??
    ''
  ).toString()

  const metadata = (
    row.metadata ??
    row.Metadata ??
    row.METADATA ??
    ''
  ).toString()

  const reporter = (
    row.reporter ??
    row.Reporter ??
    row.REPORTER ??
    row.ReporterName ??
    ''
  ).toString()

  return {
    id,
    drive,
    metadata,
    reporter,
    createdAt: new Date(),
    original: row, // keep original row for debugging
  }
}

export async function POST(req) {
  // Ensure it's multipart
  const contentType = req.headers.get('content-type') || ''
  if (!contentType.includes('multipart/form-data')) {
    return NextResponse.json(
      { error: 'Upload must use multipart/form-data with field "file"' },
      { status: 415 }
    )
  }

  // Parse file
  const { rows, error } = await parseMultipartFile(req)
  if (error) return NextResponse.json({ error }, { status: 400 })
  if (!rows || rows.length === 0) {
    return NextResponse.json(
      { error: 'File contains no rows' },
      { status: 400 }
    )
  }

  // Normalize
  const docs = rows.map(normalizeRow)

  // Mongo connection
  const col = await getCollection('records')

  // Create basic indexes (NO TEXT INDEX HERE — Create text index once manually!)
  await Promise.all([
    col.createIndex({ id: 1 }, { name: 'idx_id' }),
    col.createIndex({ drive: 1 }, { name: 'idx_drive' }),
    col.createIndex({ reporter: 1 }, { name: 'idx_reporter' }),
  ])

  // Batch insert
  const BATCH_SIZE = 2000
  const chunks = chunkArray(docs, BATCH_SIZE)

  let inserted = 0
  let errors = 0

  for (const batch of chunks) {
    try {
      const result = await col.insertMany(batch, { ordered: false })
      inserted += result.insertedCount ?? Object.keys(result.insertedIds).length
    } catch (e) {
      // Partial insert fallback
      const ok = e?.result?.result?.nInserted
      if (ok) inserted += ok
      errors += batch.length - (ok || 0)
    }
  }

  return NextResponse.json({
    status: 'success',
    inserted,
    errors,
    total: docs.length,
  })
}
