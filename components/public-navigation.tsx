'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Building2 } from 'lucide-react'
import ThemeToggle from '@/components/theme-toggle'

export default function PublicNavigation() {
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <Building2 className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">Vermietertools</span>
          </Link>

          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost">
                Anmelden
              </Button>
            </Link>
            <Link href="/register">
              <Button>
                Registrieren
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
