'use client'
import { useState, useEffect, useCallback } from 'react'
import FileUpload from './FileUpload'
import { MdClose } from 'react-icons/md'
import { FaCopy, FaDotCircle } from 'react-icons/fa'

// ------------------------------
// Pagination Helper
// ------------------------------
function getPageNumbers(current, total) {
  const maxVisible = 10
  const pages = []

  // Always show first page
  pages.push(1)

  let start = Math.max(2, current - 4)
  let end = Math.min(total - 1, current + 5)

  // If end is near beginning
  if (current <= 6) {
    start = 2
    end = Math.min(total - 1, maxVisible)
  }

  // If near end
  if (current >= total - 6) {
    start = Math.max(2, total - 9)
    end = total - 1
  }

  // Add pages in the range
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  // Always show last page
  if (total > 1) pages.push(total)

  return pages
}

// ------------------------------
// Highlight Component
// ------------------------------
function Highlight({ text = '', query = '' }) {
  if (!query.trim()) return <>{text}</>
  if (!text) return null

  const words =
    query
      .toLowerCase()
      .match(/"[^"]+"|\S+/g)
      ?.map((w) => w.replace(/^"|"$/g, '')) || []

  let segments = [{ t: String(text), key: 0 }]
  words.forEach((word) => {
    const lowerWord = word.toLowerCase()
    const newSegments = []

    segments.forEach((seg, idx) => {
      if (typeof seg.t !== 'string') {
        newSegments.push(seg)
        return
      }
      const s = seg.t
      const lowerS = s.toLowerCase()
      let pos = 0
      let found = lowerS.indexOf(lowerWord, pos)

      if (found === -1) {
        newSegments.push(seg)
      } else {
        while (found !== -1) {
          if (found > pos)
            newSegments.push({ t: s.slice(pos, found), key: `${idx}-${pos}` })
          newSegments.push({
            t: s.slice(found, found + word.length),
            highlight: true,
            key: `${idx}-${found}`,
          })
          pos = found + word.length
          found = lowerS.indexOf(lowerWord, pos)
        }
        if (pos < s.length)
          newSegments.push({ t: s.slice(pos), key: `${idx}-end` })
      }
    })
    segments = newSegments
  })

  return (
    <>
      {segments.map((seg, index) =>
        seg.highlight ? (
          <mark
            key={seg.key}
            className="bg-green-300 px-1 text-gray-700 rounded"
          >
            {seg.t}
          </mark>
        ) : (
          <span key={index}>{seg.t}</span>
        )
      )}
    </>
  )
}

// ------------------------------
// MAIN COMPONENT
// ------------------------------
export default function SearchableTable({ initialData = [] }) {
  const [query, setQuery] = useState('')
  const [items, setItems] = useState(initialData)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [filters, setFilters] = useState({ id: '', drive: '', reporter: '' })
  const [loading, setLoading] = useState(false)

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  // ------------------------------
  // FETCH FUNCTION (simple + safe)
  // ------------------------------
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const payload = {
        query,
        page,
        pageSize,
        filters,
        mode: 'and',
      }

      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Search failed')

      setItems(data.items)
      setTotal(data.total)
    } catch (err) {
      console.error(err)
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }, [query, page, pageSize, filters])

  // ------------------------------
  // 1️⃣ Fetch when page or pageSize changes
  // ------------------------------
  useEffect(() => {
    fetchData()
  }, [page, pageSize])

  // ------------------------------
  // 2️⃣ Debounce search + filters
  // ------------------------------
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1) // go to page 1 when searching
      fetchData()
    }, 400)
    return () => clearTimeout(t)
  }, [query, filters])

  // ------------------------------
  // DELETE ALL
  // ------------------------------
  const handleDeleteAll = async () => {
    if (!confirm('Delete ALL records?')) return
    try {
      const res = await fetch('/api/records', { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setItems([])
      setTotal(0)
      setPage(1)
      alert(`Deleted ${data.deleted} records`)
    } catch (e) {
      alert(e.message)
    }
  }

  return (
    <div className="container mx-auto mt-6">
      {/* Search + Upload */}
      <div className="mb-5 w-full grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        <FileUpload onComplete={fetchData} />

        <div className="relative">
          <input
            className="flex-1 border-borderColor border rounded pl-2 pr-10 py-2 w-full"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            onClick={() => setQuery('')}
            className="h-full px-3 bg-error text-white rounded absolute right-0 cursor-pointer"
          >
            <MdClose className="text-xl" />
          </button>
        </div>

        <div className="ml-auto">
          <button
            onClick={handleDeleteAll}
            className="px-3 py-2 bg-error text-white rounded cursor-pointer"
          >
            Delete All
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="shadow-xl rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-tHeaderBg text-tRowHeaderText">
            <tr>
              <th className="px-4 py-2 text-left w-[20%]">ID</th>
              <th className="px-4 py-2 text-left w-[15%]">Drive</th>
              <th className="px-4 py-2 text-left w-[50%]">Metadata</th>
              <th className="px-4 py-2 text-left w-[15%]">Reporter</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row, idx) => (
              <tr
                key={row._id || idx}
                className={
                  idx % 2 === 0
                    ? 'bg-tRowBg text-tText hover:bg-tRowHover border-b border-b-tBorder'
                    : 'bg-tAltRowBg text-tText hover:bg-tRowHover border-b border-b-tBorder'
                }
              >
                <td className="px-4 py-2">
                  <div className="flex items-center">
                    <FaCopy
                      className="p-1 text-lg bg-primary text-white mr-2 rounded cursor-pointer"
                      onClick={() => navigator.clipboard.writeText(row.id)}
                    />
                    <Highlight text={row.id} query={query} />
                  </div>
                </td>
                <td className="px-4 py-2">
                  <Highlight text={row.drive} query={query} />
                </td>
                <td className="px-4 py-2">
                  <Highlight text={row.metadata} query={query} />
                </td>
                <td className="px-4 py-2">
                  <Highlight text={row.reporter} query={query} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
        {/* Prev Button */}
        <button
          disabled={page === 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="px-3 py-1 border border-primary rounded bg-primary text-white disabled:opacity-50 cursor-pointer"
        >
          Prev
        </button>

        {/* Page Numbers */}
        {getPageNumbers(page, totalPages).map((num, idx, arr) => {
          const prev = arr[idx - 1]

          return (
            <div key={num} className="flex items-center">
              {/* Ellipsis */}
              {idx > 0 && num !== prev + 1 && <span className="px-1">...</span>}

              <button
                onClick={() => setPage(num)}
                className={`px-3 py-1 border border-primary rounded cursor-pointer ${
                  num === page ? 'bg-primary text-white' : ''
                }`}
              >
                {num}
              </button>
            </div>
          )
        })}

        {/* Next Button */}
        <button
          disabled={page === totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          className="px-3 py-1 border border-primary bg-primary rounded text-white disabled:opacity-50 cursor-pointer"
        >
          Next
        </button>
      </div>
    </div>
  )
}
