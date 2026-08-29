import { useEffect } from 'react'

export function useDocumentTitle(title) {
  useEffect(() => {
    const base = 'Classe Ouro'
    document.title = title ? `${title} · ${base}` : base
  }, [title])
}
