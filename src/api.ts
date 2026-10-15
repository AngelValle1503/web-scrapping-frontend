const configuredApiUrl = import.meta.env.VITE_API_URL?.trim()

const apiBaseUrl = configuredApiUrl ? configuredApiUrl.replace(/\/$/, '') : ''

export function apiUrl(path: string): string {
  return `${apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`
}
