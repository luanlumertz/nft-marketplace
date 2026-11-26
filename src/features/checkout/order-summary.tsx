import type { Cart } from '@/features/cart/contracts'

export function OrderItems({
  cart,
  receipt = false,
}: {
  cart: Cart
  receipt?: boolean
}) {
  return (
    <div>
      <div
        aria-hidden="true"
        className={`mb-3 grid border-b border-border pb-2 text-[16px] ${receipt ? 'grid-cols-[minmax(0,1fr)_48px_100px] mobile:grid-cols-[minmax(0,1fr)_90px]' : 'grid-cols-[minmax(0,1fr)_100px]'}`}
      >
        <span>NFTs</span>
        {receipt && <span className="mobile:hidden">Edições</span>}
        <span className="text-right">Subtotal</span>
      </div>
      <ul aria-label="Itens do pedido" className="space-y-3">
        {cart.items.map((item) => (
          <li
            key={item.id}
            className={`grid items-center gap-2 p-1 ${receipt ? 'grid-cols-[minmax(0,1fr)_48px_100px] mobile:grid-cols-[minmax(0,1fr)_90px]' : 'grid-cols-[minmax(0,1fr)_100px] bg-[#251610]'}`}
          >
            <div className="flex min-w-0 items-center gap-2">
              <img
                src={item.imageUrl}
                width={70}
                height={70}
                alt={`Arte de ${item.name}`}
                className="size-17.5 shrink-0 rounded-lg object-cover mobile:size-14"
              />
              <div className="min-w-0">
                <p className="text-[14px] font-semibold mobile:text-xs">
                  {item.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  ID do token: {item.tokenId}
                </p>
                <p className="text-xs text-muted-foreground">
                  Edição: {item.editionLabel}
                  {!receipt && ` (× ${item.quantity})`}
                  {receipt && (
                    <span className="hidden mobile:inline">
                      {' '}
                      (× {item.quantity})
                    </span>
                  )}
                </p>
              </div>
            </div>
            {receipt && (
              <span className="text-center text-sm text-muted-foreground mobile:hidden">
                (× {item.quantity})
              </span>
            )}
            <p className="text-right text-[16px] font-semibold break-all text-primary mobile:text-sm">
              {item.totalEth} ETH
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}
export function OrderTotals({
  cart,
  receipt = false,
}: {
  cart: Cart
  receipt?: boolean
}) {
  return (
    <dl aria-label="Valores do pedido" className="mt-4 space-y-3 text-[14px]">
      {!receipt && (
        <div className="flex justify-between gap-4">
          <dt>Subtotal</dt>
          <dd className="text-right text-[18px] wrap-anywhere">
            {cart.quote.subtotalEth} ETH
          </dd>
        </div>
      )}
      {(!receipt || cart.quote.discountEth !== '0') && (
        <div className="flex justify-between gap-4">
          <dt>Desconto do lançamento</dt>
          <dd className="text-right wrap-anywhere">
            (-) {cart.quote.discountEth} ETH
          </dd>
        </div>
      )}
      <div className="flex justify-between gap-4">
        <dt>Taxa de rede</dt>
        <dd className="text-right">
          <span className="text-[18px] wrap-anywhere">
            {cart.quote.networkFeeEth} ETH
          </span>
          {!receipt && (
            <span className="mt-2 block text-xs text-primary">
              Taxa estimada
            </span>
          )}
        </dd>
      </div>
      <div className="flex justify-between gap-4 border-t border-border pt-3 text-[18px] font-semibold">
        <dt>Total</dt>
        <dd className="text-right break-all text-primary">
          {cart.quote.totalEth} ETH
        </dd>
      </div>
    </dl>
  )
}
