import type { Metadata, Viewport } from 'next'
import { ThemeProvider } from '@/providers/theme-provider'
import { generateMetadata as generateSiteMetadata, defaultViewport } from '@/lib/seo/metadata'
import './globals.css'
import { createClient } from '@/lib/supabase/server'
import { ImpersonationBanner } from '@/components/impersonation-banner'
import { cookies } from 'next/headers'

export const metadata: Metadata = generateSiteMetadata()
export const viewport: Viewport = defaultViewport

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let impersonatedData: { userName: string; adminId: string } | null = null

  try {
    const cookieStore = await cookies()
    if (cookieStore.has('impersonated_user_id')) {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.user_metadata?.is_impersonated) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', user.id)
          .single()

        impersonatedData = {
          userName: profile ? `${profile.first_name} ${profile.last_name}` : 'Client',
          adminId: user.user_metadata.admin_user_id || 'Admin'
        }
      }
    }
  } catch (e) {
    console.error('Error fetching impersonation session in layout:', e)
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {impersonatedData && (
            <ImpersonationBanner
              userName={impersonatedData.userName}
              adminId={impersonatedData.adminId}
            />
          )}
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
