import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Home, Building2, Euro, ChartNoAxesCombined} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Vermietertools
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Minimalistische Web-App zur Verwaltung Ihrer Mietobjekte und Mieteinnahmen
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center">
            <CardHeader>
              <Building2 className="w-12 h-12 mx-auto text-blue-600 mb-4" />
              <CardTitle>Objektverwaltung</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Erfassen und verwalten Sie Ihre Mietobjekte mit allen wichtigen Details
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Euro className="w-12 h-12 mx-auto text-green-600 mb-4" />
              <CardTitle>Mieteinnahmen</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Übersichtliche Darstellung Ihrer monatlichen und jährlichen Mieteinnahmen
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <ChartNoAxesCombined className="w-12 h-12 mx-auto text-purple-600 mb-4" />
              <CardTitle>Überblick</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Mehr Übersicht über Ihre wichtigsten Zahlen und Mieterinformationen
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <div className="space-x-4">
            <Link href="/login">
              <Button size="lg">
                Anmelden
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" size="lg">
                Registrieren
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
