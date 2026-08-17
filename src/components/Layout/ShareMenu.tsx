import { useState } from "react"
import { Check, Link2, MessageCircle } from "lucide-react"
import type { SimulationInputs } from "../../types"
import { useLang } from "../../i18n"
import { buildShareUrl, copyTextToClipboard } from "../../utils/urlState"
import { cn } from "../../utils/cn"

interface SharePanelProps {
  inputs: SimulationInputs
  /** Appelé après chaque action — ferme le menu « ⋯ » qui héberge le panneau. */
  onDone: () => void
}

/**
 * Panneau de partage (refonte header) : les 4 canaux (X, WhatsApp, LinkedIn,
 * copie du lien) vivent désormais dans un sous-panneau du menu « ⋯ ». Chaque
 * lien embarque le scénario pré-rempli (`#s=…` via buildShareUrl) + un
 * paramètre UTM (`utm_source=partage&utm_medium=…`) pour mesurer chaque canal
 * dans GoatCounter. Aucune donnée ne quitte le navigateur : le lien partagé
 * est la seule chose transmise.
 */
export function SharePanel({ inputs, onDone }: SharePanelProps) {
  const { tr } = useLang()
  const [copied, setCopied] = useState(false)

  const base = buildShareUrl(inputs)
  // UTM inséré AVANT le hash : l'état `#s=…` reste intact, GoatCounter voit le
  // canal dans le path (`/?utm_source=partage&utm_medium=x#s=…`).
  const withUtm = (medium: string): string => {
    const idx = base.indexOf("#")
    if (idx === -1) return base
    return `${base.slice(0, idx)}?utm_source=partage&utm_medium=${medium}${base.slice(idx)}`
  }

  const shareText = tr("Ma simulation d'épargne avec Snowball Pro — gratuit, sans inscription, données 100 % locales.")

  const handleCopy = async () => {
    const ok = await copyTextToClipboard(withUtm("copie"))
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const itemClass =
    "w-full text-left inline-flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-bold transition-colors hover:bg-glass-hover"

  return (
    <div className="space-y-1">
      <p className="px-3 pt-1.5 pb-2 text-[10px] text-text-dim font-semibold leading-snug">
        {tr("Votre scénario est pré-rempli dans le lien partagé.")}
      </p>
      <a
        role="menuitem"
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(
          withUtm("x"),
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onDone}
        className={cn(itemClass, "cursor-pointer")}
      >
        <span className="text-[13px] leading-none font-bold shrink-0" aria-hidden>
          𝕏
        </span>
        {tr("Partager sur X (Twitter)")}
      </a>
      <a
        role="menuitem"
        href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${withUtm("whatsapp")}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onDone}
        className={cn(itemClass, "cursor-pointer")}
      >
        <MessageCircle size={13} className="text-[#25d366] shrink-0" aria-hidden />
        {tr("Partager sur WhatsApp")}
      </a>
      <a
        role="menuitem"
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(withUtm("linkedin"))}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onDone}
        className={cn(itemClass, "cursor-pointer")}
      >
        <span
          className="w-3.5 h-3.5 rounded-[3px] bg-[#0a66c2] text-white text-[8px] font-extrabold flex items-center justify-center leading-none shrink-0"
          aria-hidden
        >
          in
        </span>
        {tr("Partager sur LinkedIn")}
      </a>
      <button type="button" role="menuitem" onClick={handleCopy} className={itemClass}>
        {copied ? (
          <Check size={13} className="text-primary shrink-0" aria-hidden />
        ) : (
          <Link2 size={13} className="text-primary shrink-0" aria-hidden />
        )}
        {copied ? tr("Lien copié !") : tr("Copier le lien")}
      </button>
    </div>
  )
}
