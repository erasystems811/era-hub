/* eslint-disable @typescript-eslint/no-explicit-any */
const env = (import.meta as any).env as Record<string, string>
export const PATIENT_API  = env.VITE_PATIENT_API_URL  ?? ''

// COMMS_API: env var baked at build time, but overridable via localStorage
// so the zrok URL can be updated without redeploying the app.
export function getCommsApi(): string {
  return localStorage.getItem('era_comms_url') || env.VITE_COMMS_API_URL || ''
}
export function saveCommsApi(url: string) {
  localStorage.setItem('era_comms_url', url.replace(/\/+$/, ''))
}
// Keep COMMS_API as a named export that reads live from localStorage
export const COMMS_API    = getCommsApi()
export const COMMS_SECRET = env.VITE_COMMS_OPERATOR_SECRET ?? ''

// ERA Core URL and secret — env var takes priority, then localStorage, then empty
export function getCoreApi(): string {
  return env.VITE_CORE_API_URL || localStorage.getItem('era_core_url') || ''
}
export function getCoreSecret(): string {
  return env.VITE_CORE_SECRET || localStorage.getItem('era_core_secret') || ''
}
export function saveCoreConfig(url: string, secret: string) {
  localStorage.setItem('era_core_url', url.replace(/\/+$/, ''))
  localStorage.setItem('era_core_secret', secret)
}

// Keep these as named exports for backward compatibility — they read live from localStorage
export const CORE_API    = env.VITE_CORE_API_URL    ?? ''
export const CORE_SECRET = env.VITE_CORE_SECRET     ?? ''
