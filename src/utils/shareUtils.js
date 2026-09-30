import { isNative } from '../native'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
// ─── Share Utilities ─────────────────────────────────────────────────────────

/**
 * Share an image to Instagram Stories (or any app) via Web Share API.
 * Falls back to downloading the image on unsupported platforms.
 *
 * @param {string} imageURL  - Remote URL of the image to share
 * @param {string} [caption] - Optional caption text
 * @returns {'shared' | 'downloaded' | 'error'}
 */
export async function shareToStory(imageURL, caption = '') {
  // Fetch the image as a blob
  let blob
  try {
    const res = await fetch(imageURL)
    blob = await res.blob()
  } catch {
    throw new Error('Could not fetch image for sharing.')
  }

  if (isNative) {
    const data = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result).split(',')[1])
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
    const path = `palzy-story-${Date.now()}.${blob.type === 'image/png' ? 'png' : 'jpg'}`
    const { uri } = await Filesystem.writeFile({ path, data, directory: Directory.Cache })
    try { await Share.share({ files: [uri], title: 'Palzy', text: caption || 'Check this out on Palzy!' }); return 'shared' }
    finally { await Filesystem.deleteFile({ path, directory: Directory.Cache }).catch(() => {}) }
  }
  const ext  = blob.type === 'image/png' ? 'png' : 'jpg'
  const file = new File([blob], `palzy-story.${ext}`, { type: blob.type })

  // ── Try Web Share API (works on mobile Chrome/Safari) ────────
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: 'Palzy',
        text: caption || 'Check this out on Palzy!',
      })
      return 'shared'
    } catch (err) {
      // User cancelled — not a real error
      if (err.name === 'AbortError') return 'cancelled'
      // Fall through to download
    }
  }

  // ── Fallback: download the image ─────────────────────────────
  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href     = url
  a.download = `palzy-story.${ext}`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  return 'downloaded'
}

/**
 * Returns true if the current device supports file sharing via
 * the Web Share API (typically mobile Chrome / Safari).
 */
export function canNativeShare() {
  return isNative || !!(navigator.share && navigator.canShare)
}

/** Native downloads hand the file to Android's save/share chooser rather than claiming it was saved. */
export async function saveImage(url, filename) {
  if (!isNative) {
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
    return 'downloaded'
  }
  const blob = await (await fetch(url)).blob()
  const data = await new Promise((resolve, reject) => {
    const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1]); reader.onerror = reject; reader.readAsDataURL(blob)
  })
  const path = `${Date.now()}-${filename}`
  const { uri } = await Filesystem.writeFile({ path, data, directory: Directory.Cache })
  try { await Share.share({ files: [uri], title: 'Save image', dialogTitle: 'Save or share image' }); return 'chooser' }
  finally { await Filesystem.deleteFile({ path, directory: Directory.Cache }).catch(() => {}) }
}
