import { z } from 'zod'
import { nftSchema, type Nft } from '@/features/nfts/contracts'
import { nftFixtures } from './fixtures/nfts'
import { commerce } from './commerce-store'

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
  'cart-error',
  'coupon-invalid',
  'coupon-expired',
  'profile-error',
  'profile-conflict',
  'wallets-error',
  'wallet-conflict',
  'checkout-error',
  'wallet-rejected',
  'wallet-disconnected',
  'order-error',
  'order-timeout',
  'order-pending',
  'payment-declined',
  'price-changed',
  'edition-sold-out',
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
  getState: () => ({
    ...state,
    nfts: state.nfts.map((nft) => {
      const inventory = commerce.read().inventory[nft.id]
      return inventory
        ? {
            ...nft,
            available: Math.max(0, nft.available - inventory.sold),
            version: nft.version + inventory.version,
          }
        : nft
    }),
  }),
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
    const inventory = commerce.read().inventory[nft.id]
    if (!current || current.version + (inventory?.version ?? 0) >= nft.version)
      return
    state.nfts = state.nfts.map((item) =>
      item.id === nft.id
        ? {
            ...nft,
            available: nft.available + (inventory?.sold ?? 0),
            version: nft.version - (inventory?.version ?? 0),
          }
        : item,
    )
    persist()
  },
}
