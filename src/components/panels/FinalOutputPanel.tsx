import { useState } from 'react'
import { useContentStore } from '../../stores/content'
import { useToastStore } from '../../stores/toast'
import { apiClient } from '../../services/api'
import { saveBlobFile } from '../../utils/saveFile'

export function FinalOutputPanel() {
  const outputs = useContentStore((state) => state.finalOutputs)
  const addToast = useToastStore((state) => state.addToast)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

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
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background"
              disabled={downloadingId === output.id}
              onClick={async () => {
                try {
                  setDownloadingId(output.id)
                  const blob = await apiClient.downloadFinalAsset({ id: output.id })
                  await saveBlobFile(
                    blob,
                    `${output.type === 'image' ? 'final-image' : 'final-video'}-${output.id}.${output.format ?? 'bin'}`,
                  )
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
