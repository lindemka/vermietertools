import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navigation from '@/components/navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Vermietertools - Immobilienverwaltung',
  description: 'Minimalistische Web-App zur Verwaltung von Mietobjekten und Mieteinnahmen',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <body className={inter.className}>
        <div className="min-h-screen bg-background">
          <Navigation />
          {children}
        </div>
      </body>
    </html>
  )
}
