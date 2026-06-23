import type { Metadata, Viewport } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://rishtajodo.com'
const SITE_NAME = 'Rishtajodo Matrimony'
const SITE_TAGLINE = 'Dil se Dil ka Milan'
const SITE_DESCRIPTION =
  "India's premium matrimonial platform. Find your perfect life partner with Rishtajodo Matrimony — trusted by millions of families across India."

interface GenerateMetadataOptions {
  title?: string
  description?: string
  image?: string
  noIndex?: boolean
  path?: string
}

/**
 * Generates consistent, SEO-optimized metadata for every page.
 * Defaults to site-level metadata if not provided.
 */
export function generateMetadata({
  title,
  description = SITE_DESCRIPTION,
  image = `${SITE_URL}/og-image.jpg`,
  noIndex = false,
  path = '',
}: GenerateMetadataOptions = {}): Metadata {
  const pageTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — ${SITE_TAGLINE}`
  const canonicalUrl = `${SITE_URL}${path}`

  return {
    title: pageTitle,
    description,
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: pageTitle,
      description,
      url: canonicalUrl,
      siteName: SITE_NAME,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: pageTitle,
        },
      ],
      locale: 'en_IN',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description,
      images: [image],
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true, googleBot: { index: true, follow: true } },
    icons: {
      icon: '/favicon.ico',
      apple: '/apple-touch-icon.png',
    },
    manifest: '/site.webmanifest',
  }
}

/**
 * Standard viewport configuration for all pages.
 * Ensures correct rendering on mobile devices.
 */
export const defaultViewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFFFFF' },
    { media: '(prefers-color-scheme: dark)', color: '#111111' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}
