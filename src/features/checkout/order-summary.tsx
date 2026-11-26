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
        className={`mb-3 grid border-b border-border pb-2 text-[16px] ${receipt ? 'grid-cols-[minmax(0,1fr)_80px_100px] mobile:grid-cols-[minmax(0,1fr)_90px]' : 'grid-cols-[minmax(0,1fr)_100px]'}`}
      >
        <span>NFTs</span>
        {receipt && <span className="text-center mobile:hidden">Edições</span>}
        <span className="text-right">Subtotal</span>
      </div>
      <ul aria-label="Itens do pedido" className="space-y-3">
        {cart.items.map((item) => (
          <li
            key={item.id}
            className={`grid items-center gap-2 p-1 ${receipt ? 'grid-cols-[minmax(0,1fr)_80px_100px] mobile:grid-cols-[minmax(0,1fr)_90px]' : 'grid-cols-[minmax(0,1fr)_100px] bg-[#251610]'}`}
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
  const label = receipt ? 'col-start-2 mobile:col-start-1' : ''
  const value = receipt ? 'col-start-3 mobile:col-start-2' : ''
  return (
    <dl
      aria-label="Valores do pedido"
      className={
        receipt
          ? 'mt-4 grid grid-cols-3 items-center gap-x-3 gap-y-2 text-sm mobile:grid-cols-2'
          : 'mt-4 space-y-3 text-sm'
      }
    >
      {!receipt && (
        <div className="flex justify-between gap-4">
          <dt>Subtotal</dt>
          <dd className="text-right text-lg wrap-anywhere">
            {cart.quote.subtotalEth} ETH
          </dd>
        </div>
      )}
      {(!receipt || cart.quote.discountEth !== '0') && (
        <div className={receipt ? 'contents' : 'flex justify-between gap-4'}>
          <dt className={label}>Desconto do lançamento</dt>
          <dd className={`${value} text-right wrap-anywhere`}>
            (-) {cart.quote.discountEth} ETH
          </dd>
        </div>
      )}
      <div className={receipt ? 'contents' : 'grid grid-cols-2 gap-x-4'}>
        <dt className={label}>Taxa de rede</dt>
        <dd className={`${value} text-right text-lg wrap-anywhere`}>
          {cart.quote.networkFeeEth} ETH
        </dd>
        {!receipt && (
          <dd className="col-span-2 mt-2 text-center text-xs text-primary">
            Taxa estimada
          </dd>
        )}
      </div>
      <div
        className={
          receipt
            ? 'contents'
            : 'flex justify-between gap-4 border-t border-border pt-3'
        }
      >
        <dt className={`${label} text-lg font-semibold`}>Total</dt>
        <dd
          className={`${value} text-right text-lg font-semibold break-all text-primary`}
        >
          {cart.quote.totalEth} ETH
        </dd>
      </div>
    </dl>
  )
}
