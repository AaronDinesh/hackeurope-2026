import { useState } from 'react'
import { open } from '@tauri-apps/plugin-shell'
import { dirname } from '@tauri-apps/api/path'
import { useContentStore } from '../../stores/content'
import { useToastStore } from '../../stores/toast'
import { apiClient } from '../../services/api'
import { saveBlobFile } from '../../utils/saveFile'

export function FinalOutputPanel() {
  const outputs = useContentStore((state) => state.finalOutputs)
  const replaceFinalOutput = useContentStore((state) => state.replaceFinalOutput)
  const addToast = useToastStore((state) => state.addToast)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const handleOpenFolder = async (filePath: string) => {
    try {
      const folder = await dirname(filePath)
      await open(folder)
    } catch (error) {
      addToast({ type: 'error', message: (error as Error).message ?? 'Unable to open folder' })
    }
  }

  if (!outputs.length) {
    return <Placeholder message="No final outputs yet." />
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      {outputs.map((output) => (
        <article key={output.id} className="flex flex-col gap-3 rounded-3xl border border-border bg-muted/30 p-4 shadow-sm">
          <div className="flex flex-col gap-1 text-sm text-muted-foreground">
            <span className="text-base font-semibold text-foreground">
              {output.type === 'image' ? 'Image' : 'Video'} · {output.format.toUpperCase()}
            </span>
            <span>{new Date(output.createdAt).toLocaleString()}</span>
          </div>
          <div className="overflow-hidden rounded-2xl bg-muted">
            {output.type === 'image' ? (
              <img src={output.previewUrl} alt="Final output" className="h-full w-full object-cover" />
            ) : (
              <video src={output.previewUrl} className="h-full w-full" controls />
            )}
          </div>
          {output.notes ? <p className="text-sm text-muted-foreground">{output.notes}</p> : null}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background"
              disabled={downloadingId === output.id}
              onClick={async () => {
                try {
                  setDownloadingId(output.id)
                  const sourceUrl = output.downloadUrl || output.previewUrl
                  if (!sourceUrl) {
                    throw new Error('No download URL available')
                  }
                  const blob = await apiClient.downloadFromUrl(sourceUrl)
                  const savedPath = await saveBlobFile(
                    blob,
                    `${output.type === 'image' ? 'final-image' : 'final-video'}-${output.id}.${output.format ?? 'bin'}`,
                  )
                  if (savedPath) {
                    replaceFinalOutput(output.id, { savedPath, savedAt: Date.now() })
                  }
                  addToast({ type: 'success', message: 'Download complete' })
                } catch (error) {
                  addToast({ type: 'error', message: (error as Error).message ?? 'Download failed' })
                } finally {
                  setDownloadingId(null)
                }
              }}
            >
              {downloadingId === output.id ? 'Preparing…' : 'Download'}
            </button>
            {output.savedPath ? (
              <button
                type="button"
                className="rounded-full border border-border px-4 py-2 text-sm"
                onClick={() => handleOpenFolder(output.savedPath!)}
              >
                Open Folder
              </button>
            ) : null}
            <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              {output.savedPath ? 'Downloaded' : 'Not saved'}
            </span>
          </div>
        </article>
      ))}
    </div>
  )
}

function Placeholder({ message }: { message: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-muted-foreground">
      <p className="text-base">{message}</p>
      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Final Output</p>
    </div>
  )
}
