/* eslint-disable @typescript-eslint/no-explicit-any */
const env = (import.meta as any).env as Record<string, string>
export const PATIENT_API  = env.VITE_PATIENT_API_URL  ?? ''
export const COMMS_API    = env.VITE_COMMS_API_URL    ?? ''
export const COMMS_SECRET = env.VITE_COMMS_OPERATOR_SECRET ?? ''
export const CORE_API     = env.VITE_CORE_API_URL     ?? 'http://localhost:4000'
export const CORE_SECRET  = env.VITE_CORE_SECRET      ?? ''
