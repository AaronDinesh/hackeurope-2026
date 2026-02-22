const isTauri = typeof window !== 'undefined' && '__TAURI__' in window

export async function saveBlobFile(blob: Blob, suggestedName: string) {
  if (isTauri) {
    const tauriApi = getTauriApi()
    const filePath = await tauriApi.dialog.save({ defaultPath: suggestedName })
    if (!filePath) return
    const buffer = await blob.arrayBuffer()
    await tauriApi.fs.writeBinaryFile(filePath, new Uint8Array(buffer))
    return
  }

  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = suggestedName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
