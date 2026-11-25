/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MOCKS_ENABLED?: 'true' | 'false'
  readonly VITE_API_URL?: string
  readonly VITE_SOCKET_URL?: string
}
