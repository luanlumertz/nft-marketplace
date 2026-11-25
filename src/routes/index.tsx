import { createFileRoute } from '@tanstack/react-router'
import { NftGrid } from '@/features/nfts/components/nft-grid'

export const Route = createFileRoute('/')({ component: HomePage })

function HomePage() {
  return (
    <>
      <section aria-labelledby="titulo-inicio" className="grid items-center gap-8 pb-14 md:grid-cols-[1.4fr_1fr] md:gap-16">
        <div>
          <p className="mb-5 text-sm tracking-widest">Bem-vindo à Kurio</p>
          <h1 id="titulo-inicio" className="max-w-2xl text-3xl leading-snug font-bold uppercase sm:text-4xl lg:text-5xl">Seja dono do futuro da arte digital</h1>
          <p className="mt-6 max-w-xl text-sm leading-7 text-muted-foreground">Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara e apoie artistas.</p>
          <a href="#colecao" className="mt-8 inline-flex min-h-11 items-center rounded-md bg-primary px-7 font-semibold text-primary-foreground hover:bg-primary/90">Explorar</a>
        </div>
        <img src="/nfts/jungle-green.png" alt="Macaco com óculos e jaqueta verde, arte Emerald Ape" width={450} height={450} fetchPriority="high" className="mx-auto aspect-square w-full max-w-md rounded-3xl object-cover" />
      </section>
      <section id="colecao" aria-labelledby="titulo-colecao" className="scroll-mt-6">
        <h2 id="titulo-colecao" className="mb-7 text-xl font-semibold">Seleção Kurio</h2>
        <NftGrid />
      </section>
    </>
  )
}
