import { Link } from '@tanstack/react-router'
import { ShoppingCart } from 'lucide-react'
import { useCart } from './use-cart'

export function CartLink({ mobile = false }: { mobile?: boolean }) {
  const { query } = useCart()
  const count =
    query.data?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0
  return (
    <Link
      to="/carrinho"
      aria-label="Abrir carrinho"
      className={`relative grid place-items-center ${mobile ? 'min-h-11 min-w-11' : 'h-10 w-7'}`}
    >
      <ShoppingCart size={mobile ? 22 : 24} />
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute -top-0.5 -right-1.5 grid min-h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground"
        >
          {count}
        </span>
      )}
    </Link>
  )
}
