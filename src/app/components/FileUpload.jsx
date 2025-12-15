// components/FileUpload.jsx
'use client'
import { useState } from 'react'
import { MdUploadFile } from 'react-icons/md'

export default function FileUpload({ onComplete }) {
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [fileName, setFileName] = useState('')

  const MAX_MB = 100 // client-side check to match server 100mb

  const handleUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    setFileName(file.name)
    if (file.size > MAX_MB * 1024 * 1024) {
      alert(`File too large. Max ${MAX_MB}MB allowed.`)
      return
    }

    setUploading(true)
    setProgress(3)

    const form = new FormData()
    form.append('file', file)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/upload', true)

    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) {
        const percent = Math.round((ev.loaded / ev.total) * 100)
        setProgress(percent)
      }
    }

    xhr.onload = () => {
      setUploading(false)
      try {
        const data = JSON.parse(xhr.responseText || '{}')
        if (xhr.status >= 200 && xhr.status < 300) {
          setProgress(100)
          // dispatch event so table listens and refreshes
          if (typeof window !== 'undefined') {
            const ev = new CustomEvent('upload:completed', {
              detail: { fileName, result: data },
            })
            window.dispatchEvent(ev)
          }
          if (onComplete) onComplete(data)
        } else {
          alert(data.error || 'Upload failed')
        }
      } catch (e) {
        alert('Unexpected response from server')
      } finally {
        setProgress(0)
      }
    }

    xhr.onerror = () => {
      setUploading(false)
      alert('Upload failed due to network error')
      setProgress(0)
    }

    xhr.send(form)
  }

  return (
    <div className="w-full flex space-y-2 flex-col">
      <div className="w-full flex items-center space-x-4">
        <label
          htmlFor="uploadData"
          className="flex items-center justify-center px-2.5 py-1.5 space-x-1 rounded hover:border-primary transition cursor-pointer bg-secondary"
        >
          <MdUploadFile className="text-2xl text-white" />
          <span className="text-lg text-white">Upload</span>
          <input
            disabled={uploading}
            type="file"
            id="uploadData"
            onChange={handleUpload}
            className="hidden"
            accept=".xlsx,.xls,.csv,.json"
          />
        </label>

        {uploading && (
          <div className="w-full">
            <div className="flex justify-between mb-1">
              <span className="text-xs text-textPrimary">
                Uploading {fileName || ''}
              </span>
              <span className="text-xs text-textPrimary">{progress}%</span>
            </div>

            <div className="w-full bg-white rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all duration-200"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {!uploading && fileName && (
          <p className="text-xs text-textSecondary">Selected: {fileName}</p>
        )}
      </div>

      <p className="text-sm text-textSecondary">
        Excel, CSV, JSON (max {MAX_MB}MB)
      </p>
    </div>
  )
}
