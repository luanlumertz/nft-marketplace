import { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { CarouselDots } from '@/components/carousel-dots'
import type { NftDetail } from '../detail-contracts'

export function NftGallery({ nft }: { nft: NftDetail }) {
  const zoomTrigger = useRef<HTMLButtonElement>(null)
  const [active, setActive] = useState(0),
    [zoom, setZoom] = useState(false)
  const image = nft.gallery[active] ?? nft.gallery[0]
  const move = (offset: number) =>
    setActive(
      (value) => (value + offset + nft.gallery.length) % nft.gallery.length,
    )
  return (
    <>
      <div className="grid grid-cols-[100px_minmax(0,1fr)] gap-7 tablet:grid-cols-[64px_minmax(0,1fr)] tablet:gap-3 mobile:block">
        <div
          className="flex flex-col gap-4 mobile:hidden"
          aria-label="Galeria de imagens"
        >
          {nft.gallery.map((image, index) => (
            <button
              key={`${image.url}-${index}`}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Ver imagem ${index + 1}`}
              aria-pressed={index === active}
              className={`overflow-hidden rounded-lg border ${index === active ? 'border-primary' : 'border-transparent'}`}
            >
              <img
                src={image.url}
                alt={image.alt}
                width={100}
                height={100}
                className="aspect-square w-full object-cover"
              />
            </button>
          ))}
        </div>
        <div className="relative flex items-center justify-center rounded-2xl bg-card p-5 mobile:block mobile:bg-transparent mobile:p-0">
          <button
            type="button"
            className="block w-full"
            aria-label="Abrir galeria de imagens"
            onClick={(event) => {
              zoomTrigger.current = event.currentTarget
              setZoom(true)
            }}
          >
            <img
              src={image.url}
              alt={`Arte de ${nft.name}`}
              width={500}
              height={500}
              fetchPriority="high"
              className="aspect-square w-full rounded-3xl object-cover mobile:rounded-[20px]"
            />
          </button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(event) => {
              zoomTrigger.current = event.currentTarget
              setZoom(true)
            }}
            aria-label="Ampliar imagem do NFT"
            className="absolute top-3 right-3 size-8 rounded-full bg-card text-foreground hover:bg-card mobile:hidden"
          >
            <Search className="size-6" />
          </Button>
        </div>
      </div>
      <CarouselDots
        count={nft.gallery.length}
        active={active}
        onSelect={setActive}
        label="Selecionar imagem da galeria"
        buttonLabel="Imagem da galeria"
        className="hidden py-3 mobile:flex"
      />
      <Dialog open={zoom} onOpenChange={setZoom}>
        <DialogContent
          className="fixed top-1/2 left-1/2 z-81 w-[min(780px,calc(100%-32px))] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-border bg-card p-4"
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            zoomTrigger.current?.focus()
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft') move(-1)
            if (event.key === 'ArrowRight') move(1)
          }}
        >
          <DialogTitle className="sr-only">Galeria de {nft.name}</DialogTitle>
          <DialogDescription className="sr-only">
            Use as setas para trocar a imagem e Escape para fechar.
          </DialogDescription>
          <img
            src={image.url}
            alt={image.alt}
            className="mx-auto max-h-[75dvh] rounded-2xl object-contain"
          />
          <DialogClose
            className="absolute top-4 right-4 rounded-full bg-card p-2"
            aria-label="Fechar imagem"
          >
            <X />
          </DialogClose>
          <div className="mt-3 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => move(-1)}
              aria-label="Imagem anterior"
            >
              <ChevronLeft />
            </Button>
            <span className="text-sm">
              {active + 1} / {nft.gallery.length}
            </span>
            <Button
              variant="ghost"
              onClick={() => move(1)}
              aria-label="Próxima imagem"
            >
              <ChevronRight />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
