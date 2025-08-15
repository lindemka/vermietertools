export default function PublicFooter() {
  return (
    <footer className="bg-gray-50 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Vermietertools</h3>
            <p className="text-gray-600 mb-4">
              Die minimalistische Web-App zur Verwaltung Ihrer Mietobjekte und Mieteinnahmen. 
              Einfach, übersichtlich und sicher.
            </p>
            <div className="flex space-x-4">
              <span className="text-sm text-gray-500">© 2024 Vermietertools</span>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Produkt</h4>
            <ul className="space-y-2">
              <li><a href="/features" className="text-sm text-gray-600 hover:text-gray-900">Features</a></li>
              <li><a href="/pricing" className="text-sm text-gray-600 hover:text-gray-900">Preise</a></li>
              <li><a href="/demo" className="text-sm text-gray-600 hover:text-gray-900">Demo</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Support</h4>
            <ul className="space-y-2">
              <li><a href="/help" className="text-sm text-gray-600 hover:text-gray-900">Hilfe</a></li>
              <li><a href="/contact" className="text-sm text-gray-600 hover:text-gray-900">Kontakt</a></li>
              <li><a href="/privacy" className="text-sm text-gray-600 hover:text-gray-900">Datenschutz</a></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  )
}
