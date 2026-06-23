'use client'

import { useEffect } from 'react'

interface UseDocumentTitleOptions {
  prefix?: string
}

/**
 * Sets the browser document title on mount.
 * @param title - The page title
 */
export function useDocumentTitle(
  title: string,
  { prefix = 'Rishtajodo Matrimony' }: UseDocumentTitleOptions = {}
) {
  useEffect(() => {
    const previous = document.title
    document.title = `${title} | ${prefix}`
    return () => {
      document.title = previous
    }
  }, [title, prefix])
}
