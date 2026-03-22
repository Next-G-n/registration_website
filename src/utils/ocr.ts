type ScribeModule = {
  init?: (params?: { ocr?: boolean; font?: boolean; pdf?: boolean }) => Promise<void> | void
  extractText: (
    files: File[] | FileList,
    langs?: string[],
    outputFormat?: string,
    options?: Record<string, unknown>,
  ) => Promise<unknown>
}

let scribePromise: Promise<ScribeModule> | null = null
let initPromise: Promise<void> | null = null

async function getScribe() {
  if (!scribePromise) {
    scribePromise = import('scribe.js-ocr').then((mod) => (mod.default ?? mod) as ScribeModule)
  }
  return scribePromise
}

async function ensureScribeInitialized(scribe: ScribeModule) {
  if (!scribe.init) return
  if (!initPromise) {
    initPromise = Promise.resolve(scribe.init({ ocr: true }))
  }
  await initPromise
}

export async function extractTextFromImage(file: File) {
  const scribe = await getScribe()
  await ensureScribeInitialized(scribe)

  const result = await scribe.extractText([file], ['eng'], 'txt')
  if (typeof result === 'string') return result
  if (Array.isArray(result)) return result.map((part) => String(part ?? '')).join('\n')
  if (result && typeof result === 'object' && 'text' in (result as Record<string, unknown>)) {
    const text = (result as { text?: unknown }).text
    return typeof text === 'string' ? text : String(text ?? '')
  }
  return String(result ?? '')
}
