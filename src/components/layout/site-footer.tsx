import { Link } from '@tanstack/react-router'
import {
  FaFacebookF,
  FaInstagram,
  FaXTwitter,
  FaLinkedinIn,
  FaYoutube,
} from 'react-icons/fa6'
import { catalogDefaults, collections } from '@/features/nfts/catalog-search'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

const unavailable = 'Indisponível nesta demonstração'
const footerCollections = collections.filter(([value]) =>
  ['arte-digital', 'fotografia', 'musica', 'arte-3d', 'utilidade'].includes(
    value,
  ),
)
export function SiteFooter({
  showOnMobile = false,
}: {
  showOnMobile?: boolean
}) {
  return (
    <footer
      className={`site-footer mt-0 [&_h3]:text-[17px] [&_h3]:font-semibold [&_h3]:leading-5 site-container w-[calc(100%-48px)] max-w-300 mx-auto ${showOnMobile ? 'mobile:rounded-3xl mobile:bg-card mobile:px-5 mobile:pt-6 mobile:pb-32' : 'mobile:hidden'}`}
    >
      <div className="mobile:hidden">
        <div className="footer-benefits grid grid-cols-[repeat(3,1fr)_1.3fr] bg-card p-[32px_32px_16px] [&_>_div]:p-[0_16px] [&_>_div]:[border-right:1px_solid_var(--primary)] [&_>_div:last-child]:[border-right:0] [&_p]:text-[13px] [&_p]:text-muted-foreground [&_p]:leading-5.75 [&_p]:mt-2.5 [&_small]:block [&_small]:mt-2 [&_small]:text-[10px] [&_small]:text-muted-foreground tablet:px-3 tablet-compact:grid-cols-[1fr_1fr] tablet-compact:gap-y-7">
          {[
            [
              'W',
              'Segurança da carteira',
              'Proteja sua carteira e colecione arte digital verificada com confiança.',
            ],
            [
              'C',
              'Criadores em destaque',
              'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.',
            ],
            [
              'D',
              'Alertas de lançamentos',
              'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.',
            ],
          ].map(([icon, title, text]) => (
            <div key={title}>
              <span
                className="benefit-icon grid place-items-center w-18.5 h-18.5 mb-2.5 rounded-[50%] bg-primary text-background font-bold text-[24px]"
                aria-hidden="true"
              >
                {icon}
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
          <div>
            <h3>Antecipe-se ao próximo lançamento</h3>
            <label htmlFor="email-alertas" className="sr-only">
              E-mail para alertas
            </label>
            <div className="newsletter flex mt-3.5 text-[13px] [&_input]:min-w-0 [&_input]:w-full [&_input]:[background:#3b250f] [&_input]:p-2 [&_input]:rounded-[5px_0_0_5px] [&_button]:bg-primary [&_button]:text-background [&_button]:rounded-[0_5px_5px_0] [&_button]:p-[8px_12px] [&_button]:font-semibold">
              <input
                id="email-alertas"
                placeholder="digite seu e-mail..."
                disabled
              />
              <button disabled title={unavailable}>
                Enviar
              </button>
            </div>
            <p>
              Receba lançamentos selecionados, histórias de criadores e
              novidades do mercado.
            </p>
            <small>Cadastro de alertas indisponível.</small>
          </div>
        </div>
        <div className="footer-contact grid grid-cols-[minmax(72px,0.45fr)_repeat(3,minmax(0,1fr))] gap-5 items-center p-[24px_32px] [background:#3a2412] text-[15px] leading-6 tablet-compact:text-[14px]">
          <strong>KURIO</strong>
          <span>
            Feito para colecionadores,
            <br />
            criadores e cultura
          </span>
          <span>contato@email.com</span>
          <span>+55 11 4002 8922</span>
        </div>
        <div className="footer-links grid grid-cols-4 gap-6 p-[30px_32px_32px] bg-card text-[13px] [&_h3]:mb-3 [&_>_div_>_a]:block [&_>_div_>_a]:mt-2.5 [&_>_div_>_span]:block [&_>_div_>_span]:mt-2.5 [&_a:hover]:text-primary [&_a:hover]:underline tablet-compact:grid-cols-[1fr_1fr] tablet-compact:gap-y-7">
          <div>
            <h3>Meu perfil</h3>
            {[
              'Meu perfil',
              'Minha coleção',
              'Atividade',
              'Estúdio do criador',
              'Lista de interesse',
            ].map((text) =>
              text === 'Meu perfil' || text === 'Lista de interesse' ? (
                <Link
                  key={text}
                  to={text === 'Meu perfil' ? '/perfil' : '/favoritos'}
                >
                  {text}
                </Link>
              ) : (
                <span key={text} aria-disabled="true" title={unavailable}>
                  {text}
                </span>
              ),
            )}
          </div>
          <div>
            <h3>Central de ajuda</h3>
            {[
              'Central de ajuda',
              'Como comprar NFTs',
              'Carteira e segurança',
              'Política do mercado',
              'Denunciar item',
            ].map((text) => (
              <span key={text} aria-disabled="true" title={unavailable}>
                {text}
              </span>
            ))}
          </div>
          <div>
            <h3>Coleções</h3>
            {footerCollections.map(([value, label]) => (
              <Link
                key={value}
                to="/"
                search={{ ...catalogDefaults, collections: [value] }}
                hash="catalogo"
              >
                {label}
              </Link>
            ))}
          </div>
          <div>
            <h3>Redes sociais</h3>
            <div className="social-icons flex gap-2.5 text-primary [&_span]:grid [&_span]:place-items-center [&_span]:w-8 [&_span]:h-8 [&_span]:shrink-0 [&_span]:[border:1px_solid_var(--primary)] [&_span]:rounded-xs [&_svg]:w-4 [&_svg]:h-4">
              {(
                [
                  [FaFacebookF, 'Facebook'],
                  [FaInstagram, 'Instagram'],
                  [FaXTwitter, 'X'],
                  [FaLinkedinIn, 'LinkedIn'],
                  [FaYoutube, 'YouTube'],
                ] as const
              ).map(([Icon, label]) => (
                <span
                  key={label}
                  aria-disabled="true"
                  aria-label={label}
                  title={`${label}: ${unavailable}`}
                >
                  <Icon aria-hidden="true" focusable="false" />
                </span>
              ))}
            </div>
            <h3 className="mt-6">Carteiras compatíveis</h3>
            <div
              className="wallet-badge flex items-center justify-between flex-wrap gap-1 p-[7px_8px] [border:1px_solid_var(--border)] rounded-xs text-[10px] text-primary whitespace-nowrap"
              aria-label="Carteiras compatíveis: MetaMask, WalletConnect e Coinbase"
            >
              <span>METAMASK</span>
              <span
                aria-hidden="true"
                className="size-1 shrink-0 rounded-full bg-primary"
              />
              <span>WALLETCONNECT</span>
              <span
                aria-hidden="true"
                className="size-1 shrink-0 rounded-full bg-primary"
              />
              <span>COINBASE</span>
            </div>
          </div>
        </div>
      </div>
      <div className="hidden mobile:block">
        <strong className="text-[16px] tracking-[2px]">KURIO</strong>
        <p className="mt-2 max-w-64 text-[12px] leading-5 text-muted-foreground">
          Feito para colecionadores, criadores e cultura digital.
        </p>
        <nav
          aria-label="Atalhos do rodapé"
          className="mt-5 grid grid-cols-3 gap-2"
        >
          <Button
            asChild
            variant="outline"
            className="min-w-0 border-border bg-transparent px-2 text-[11px]"
          >
            <Link to="/" search={catalogDefaults} hash="catalogo">
              Catálogo
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="min-w-0 border-border bg-transparent px-2 text-[11px]"
          >
            <Link to="/favoritos">Favoritos</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="min-w-0 border-border bg-transparent px-2 text-[11px]"
          >
            <Link to="/carrinho">Carrinho</Link>
          </Button>
        </nav>
        <details className="group mt-5 border-y border-border py-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[14px] font-semibold">
            Explorar coleções
            <ChevronDown
              className="size-4 text-primary transition-transform group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <nav
            aria-label="Coleções no rodapé"
            className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[12px] text-muted-foreground [&_a]:py-2 [&_a:hover]:text-primary"
          >
            {footerCollections.map(([value, label]) => (
              <Link
                key={value}
                to="/"
                search={{ ...catalogDefaults, collections: [value] }}
                hash="catalogo"
              >
                {label}
              </Link>
            ))}
          </nav>
        </details>
        <p className="mt-4 text-[11px] text-muted-foreground">
          Carteiras compatíveis
        </p>
        <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-primary">
          <span>METAMASK</span>
          <span>WALLETCONNECT</span>
          <span>COINBASE</span>
        </p>
      </div>
      <p className="footer-copyright text-center mt-3 pb-6 text-[13px] mobile:mt-6 mobile:pb-0 mobile:text-[10px] mobile:leading-5">
        © 2026 Kurio. Propriedade digital para todos.
      </p>
    </footer>
  )
}
