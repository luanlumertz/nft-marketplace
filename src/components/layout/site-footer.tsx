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
    <footer className="site-footer site-container">
      <div className="footer-benefits">
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
            <span className="benefit-icon" aria-hidden="true">
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
          <div className="newsletter">
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
      <div className="footer-contact">
        <strong>KURIO</strong>
        <span>
          Feito para colecionadores,
          <br />
          criadores e cultura
        </span>
        <span>contato@email.com</span>
        <span>+55 11 4002 8922</span>
      </div>
      <div className="footer-links">
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
          <div className="social-icons">
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
            className="wallet-badge"
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
      <p className="footer-copyright">
        © 2026 Kurio. Propriedade digital para todos.
      </p>
    </footer>
  )
}
