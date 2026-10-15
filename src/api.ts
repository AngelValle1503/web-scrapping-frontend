const configuredApiUrl = import.meta.env.VITE_API_URL?.trim()

const apiBaseUrl = configuredApiUrl ? configuredApiUrl.replace(/\/$/, '') : ''
const authTokenStorageKey = 'web-scrapping-auth-token'

export function apiUrl(path: string): string {
  return `${apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`
}

export function getAuthToken(): string | null {
  return localStorage.getItem(authTokenStorageKey)
}

export function setAuthToken(token: string): void {
  localStorage.setItem(authTokenStorageKey, token)
}

export function clearAuthToken(): void {
  localStorage.removeItem(authTokenStorageKey)
}

export function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers)
  const token = getAuthToken()

  headers.set('Accept', 'application/json')

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  return fetch(apiUrl(path), {
    ...init,
    headers,
  })
}
