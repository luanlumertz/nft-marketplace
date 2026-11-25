import { z } from 'zod'
import { nftSchema, type Nft } from '@/features/nfts/contracts'
import { nftFixtures } from './fixtures/nfts'

export const MOCK_STORAGE_KEY = 'kurio:mock:v2'
export const scenarioSchema = z.enum([
  'default',
  'slow',
  'out-of-order',
  'network-error',
  'catalog-error',
  'empty',
  'session-expired',
  'favorite-error',
  'registration-conflict',
  'auth-error',
])

const storeSchema = z.object({
  scenario: scenarioSchema,
  nfts: z.array(nftSchema),
})
type MockState = z.infer<typeof storeSchema>

function initialState(): MockState {
  return { scenario: 'default', nfts: structuredClone(nftFixtures) }
}

function restore(): MockState {
  try {
    const raw = localStorage.getItem(MOCK_STORAGE_KEY)
    if (raw) return storeSchema.parse(JSON.parse(raw))
  } catch {
    // Estado antigo ou corrompido nao impede a abertura da demonstracao.
    localStorage.removeItem(MOCK_STORAGE_KEY)
  }
  return initialState()
}

let state = restore()

function persist() {
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(state))
}

export const mockStore = {
  getState: () => state,
  reset() {
    state = initialState()
    persist()
  },
  setScenario(scenario: MockState['scenario']) {
    state.scenario = scenario
    persist()
  },
  updateNft(nft: Nft) {
    const current = state.nfts.find((item) => item.id === nft.id)
    if (!current || current.version >= nft.version) return
    state.nfts = state.nfts.map((item) => (item.id === nft.id ? nft : item))
    persist()
  },
}
