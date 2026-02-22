import { convertFileSrc, invoke, isTauri } from '@tauri-apps/api/core'

let cachedDataDir: string | null = null
let imageStorageAvailable = true

const ensureDataDir = async () => {
  if (!isTauri() || !imageStorageAvailable) return null
  if (cachedDataDir) return cachedDataDir
  try {
    cachedDataDir = await invoke<string>('get_data_dir')
    return cachedDataDir
  } catch (error) {
    console.warn('Image storage disabled:', error)
    imageStorageAvailable = false
    return null
  }
}

const normalizePath = (base: string, relative: string) => {
  const sanitizedBase = base.replace(/[\\/]+$/, '')
  const trimmedRelative = relative.replace(/^[/\\]+/, '')
  return `${sanitizedBase}/${trimmedRelative}`
}

const inferExtension = (url: string) => {
  const match = url.match(/\.([a-zA-Z0-9]+)(?:\?|#|$)/)
  if (match) {
    return match[1]
  }
  return 'png'
}

export async function downloadAndStoreImage(options: {
  sessionId: string
  category: 'mood-board' | 'storyboard' | 'final-outputs'
  remoteUrl: string
  itemId: string
}) {
  if (!isTauri() || !imageStorageAvailable) {
    return ''
  }
  const response = await fetch(options.remoteUrl)
  if (!response.ok) {
    throw new Error('Unable to download asset')
  }
  const buffer = await response.arrayBuffer()
  const extension = inferExtension(options.remoteUrl)
  try {
    const relativePath = await invoke<string>('save_image', {
      sessionId: options.sessionId,
      category: options.category,
      filename: `${options.itemId}.${extension}`,
      data: Array.from(new Uint8Array(buffer)),
    })
    return relativePath
  } catch (error) {
    console.warn('Failed to store image locally:', error)
    imageStorageAvailable = false
    return ''
  }
}

export async function resolveImageSource(relativePath: string) {
  const dataDir = await ensureDataDir()
  if (!dataDir || !relativePath) return ''
  const absolutePath = normalizePath(dataDir, relativePath)
  return convertFileSrc(absolutePath)
}

export async function removeSessionImages(sessionId: string) {
  if (!isTauri() || !imageStorageAvailable) return
  try {
    await invoke('delete_session_images', { sessionId })
  } catch (error) {
    console.warn('Failed to remove session images:', error)
  }
}

export async function ensureImageAsset(options: {
  sessionId: string | null
  category: 'mood-board' | 'storyboard' | 'final-outputs'
  itemId: string
  imagePath?: string
  imageUrl?: string
}) {
  if (!options.sessionId || !isTauri() || !imageStorageAvailable) {
    return {
      imagePath: options.imagePath,
      imageUrl: options.imageUrl ?? '',
    }
  }

  try {
    let imagePath = options.imagePath
    if ((!imagePath || imagePath.length === 0) && options.imageUrl && options.imageUrl.startsWith('http')) {
      imagePath = await downloadAndStoreImage({
        sessionId: options.sessionId,
        category: options.category,
        remoteUrl: options.imageUrl,
        itemId: options.itemId,
      })
    }

    if (!imagePath) {
      return {
        imagePath: options.imagePath,
        imageUrl: options.imageUrl ?? '',
      }
    }

    const imageUrl = await resolveImageSource(imagePath)
    return { imagePath, imageUrl: imageUrl || options.imageUrl || '' }
  } catch (error) {
    console.warn('Image caching unavailable:', error)
    return {
      imagePath: options.imagePath,
      imageUrl: options.imageUrl ?? '',
    }
  }
}
