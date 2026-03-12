const DB_NAME = 'hchat-crypto'
const STORE_NAME = 'keys'
const KEY_ID = 'master'

let cachedKey: CryptoKey | null = null

function openKeyDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function getOrCreateKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey

  const db = await openKeyDb()

  // Try loading existing key
  const existing = await new Promise<CryptoKey | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).get(KEY_ID)
    req.onsuccess = () => resolve(req.result as CryptoKey | undefined)
    req.onerror = () => reject(req.error)
  })

  if (existing) {
    cachedKey = existing
    db.close()
    return existing
  }

  // Generate new key
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const req = tx.objectStore(STORE_NAME).put(key, KEY_ID)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })

  cachedKey = key
  db.close()
  return key
}

function isWebCryptoAvailable(): boolean {
  return (
    typeof crypto !== 'undefined' &&
    typeof crypto.subtle !== 'undefined' &&
    typeof indexedDB !== 'undefined'
  )
}

export async function encrypt(plaintext: string): Promise<string> {
  if (!isWebCryptoAvailable()) {
    return btoa(unescape(encodeURIComponent(plaintext)))
  }

  const key = await getOrCreateKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(plaintext)

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded,
  )

  // Combine IV + ciphertext
  const combined = new Uint8Array(iv.length + cipherBuffer.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(cipherBuffer), iv.length)

  // Base64 encode
  let binary = ''
  for (let i = 0; i < combined.length; i++) {
    binary += String.fromCharCode(combined[i])
  }
  return btoa(binary)
}

export async function decrypt(ciphertext: string): Promise<string> {
  if (!isWebCryptoAvailable()) {
    return decodeURIComponent(escape(atob(ciphertext)))
  }

  const key = await getOrCreateKey()

  // Base64 decode
  const binary = atob(ciphertext)
  const combined = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    combined[i] = binary.charCodeAt(i)
  }

  const iv = combined.slice(0, 12)
  const data = combined.slice(12)

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    data,
  )

  return new TextDecoder().decode(decrypted)
}

/**
 * Try to decrypt; if it fails, treat as plaintext (migration) and re-encrypt.
 */
export async function decryptWithMigration(
  raw: string,
  onMigrate: (encrypted: string) => void,
): Promise<string> {
  try {
    return await decrypt(raw)
  } catch {
    // Likely plaintext from before encryption was added — migrate
    const encrypted = await encrypt(raw)
    onMigrate(encrypted)
    return raw
  }
}
