import axios from 'axios'
import { env } from '@/lib/env'

export const http = axios.create({
  baseURL: env.apiUrl,
  timeout: 10_000,
  headers: { Accept: 'application/json' },
})
