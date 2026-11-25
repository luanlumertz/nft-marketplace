import { Link } from '@tanstack/react-router'
import {
  FaFacebookF,
  FaInstagram,
  FaXTwitter,
  FaLinkedinIn,
  FaYoutube,
} from 'react-icons/fa6'
import { catalogDefaults, collections } from '@/features/nfts/catalog-search'

const unavailable = 'Indisponível nesta demonstração'
export function SiteFooter() {
  return (
    <footer className="site-footer mt-0 [&_h3]:text-[17px] [&_h3]:font-semibold [&_h3]:leading-[20px] mobile:hidden site-container w-[calc(100%_-_48px)] max-w-300 mx-auto">
      <div className="footer-benefits grid grid-cols-[repeat(3,_1fr)_1.3fr] bg-card [padding:32px_32px_16px] [&_>_div]:[padding:0_16px] [&_>_div]:[border-right:1px_solid_var(--primary)] [&_>_div:last-child]:[border-right:0] [&_p]:text-[13px] [&_p]:text-muted-foreground [&_p]:leading-[23px] [&_p]:mt-[10px] [&_small]:block [&_small]:mt-2 [&_small]:text-[10px] [&_small]:text-muted-foreground tablet:px-3 tablet-compact:grid-cols-[1fr_1fr] tablet-compact:gap-y-7">
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
              className="benefit-icon grid place-items-center w-[74px] h-[74px] mb-[10px] rounded-[50%] bg-primary text-background font-bold text-[24px]"
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
          <div className="newsletter flex mt-[14px] text-[13px] [&_input]:min-w-0 [&_input]:w-full [&_input]:[background:#3b250f] [&_input]:[padding:8px] [&_input]:rounded-[5px_0_0_5px] [&_button]:bg-primary [&_button]:text-background [&_button]:rounded-[0_5px_5px_0] [&_button]:[padding:8px_12px] [&_button]:font-semibold">
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
            Receba lançamentos selecionados, histórias de criadores e novidades
            do mercado.
          </p>
          <small>Cadastro de alertas indisponível.</small>
        </div>
      </div>
      <div className="footer-contact grid grid-cols-[repeat(4,_minmax(0,_1fr))] gap-5 items-center [padding:24px_32px] [background:#3a2412] text-[13px] leading-[22px] tablet-compact:text-[11px]">
        <strong>KURIO</strong>
        <span>
          Feito para colecionadores,
          <br />
          criadores e cultura
        </span>
        <span>contato@email.com</span>
        <span>+55 11 4002 8922</span>
      </div>
      <div className="footer-links grid grid-cols-[repeat(4,_minmax(0,_1fr))] gap-6 [padding:30px_32px_32px] bg-card text-[13px] [&_h3]:mb-3 [&_>_div_>_a]:block [&_>_div_>_a]:mt-[10px] [&_>_div_>_span]:block [&_>_div_>_span]:mt-[10px] [&_a:hover]:text-primary [&_a:hover]:underline tablet-compact:grid-cols-[1fr_1fr] tablet-compact:gap-y-7">
        <div>
          <h3>Meu perfil</h3>
          {[
            'Meu perfil',
            'Minha coleção',
            'Atividade',
            'Estúdio do criador',
            'Lista de interesse',
          ].map((text) => (
            <span key={text} aria-disabled="true" title={unavailable}>
              {text}
            </span>
          ))}
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
          {collections
            .filter(([value]) =>
              [
                'arte-digital',
                'fotografia',
                'musica',
                'arte-3d',
                'utilidade',
              ].includes(value),
            )
            .map(([value, label]) => (
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
          <div className="social-icons flex gap-[10px] text-primary [&_span]:grid [&_span]:place-items-center [&_span]:w-8 [&_span]:h-8 [&_span]:shrink-0 [&_span]:[border:1px_solid_var(--primary)] [&_span]:rounded-[4px] [&_svg]:w-4 [&_svg]:h-4">
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
            className="wallet-badge flex items-center justify-between flex-wrap gap-1 [padding:7px_8px] [border:1px_solid_var(--border)] rounded-[4px] text-[10px] text-primary whitespace-nowrap"
            aria-label="Carteiras compatíveis: MetaMask, WalletConnect e Coinbase"
          >
            <span>METAMASK</span>
            <span aria-hidden="true">·</span>
            <span>WALLETCONNECT</span>
            <span aria-hidden="true">·</span>
            <span>COINBASE</span>
          </div>
        </div>
      </div>
      <p className="footer-copyright text-center mt-3 pb-6 text-[13px]">
        © 2026 Kurio. Propriedade digital para todos.
      </p>
    </footer>
  )
}
