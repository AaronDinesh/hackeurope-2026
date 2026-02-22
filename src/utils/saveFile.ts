import { isTauri } from '@tauri-apps/api/core'
import { invoke } from '@tauri-apps/api/core'
import { save } from '@tauri-apps/plugin-dialog'

const normalizeSavePath = (path: string) => {
  if (!path.startsWith('file://')) return path
  try {
    return decodeURIComponent(new URL(path).pathname)
  } catch {
    return path
  }
}

export async function saveBlobFile(blob: Blob, suggestedName: string): Promise<string | undefined> {
  if (isTauri()) {
    const filePath = await save({ defaultPath: suggestedName })
    if (!filePath) return undefined
    const buffer = await blob.arrayBuffer()
    const normalizedPath = normalizeSavePath(filePath)
    await invoke('write_binary_file', {
      path: normalizedPath,
      data: Array.from(new Uint8Array(buffer)),
    })
    return normalizedPath
  }

  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = suggestedName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
  return undefined
}
