export async function getSync<T>(key: string): Promise<T | undefined> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(key, (result) => {
      resolve(result[key] as T | undefined)
    })
  })
}

export async function setSync(key: string, value: unknown): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ [key]: value }, resolve)
  })
}

export async function getLocal<T>(key: string): Promise<T | undefined> {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (result) => {
      resolve(result[key] as T | undefined)
    })
  })
}

export async function setLocal(key: string, value: unknown): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, resolve)
  })
}

export async function removeSync(key: string): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.remove(key, resolve)
  })
}

export async function removeLocal(key: string): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.remove(key, resolve)
  })
}
