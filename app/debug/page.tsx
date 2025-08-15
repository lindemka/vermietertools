'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function DebugPage() {
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasSessionCookie, setHasSessionCookie] = useState<boolean | null>(null)
  const [rawCookies, setRawCookies] = useState<string>('')

  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setSessionInfo(data)
      } else {
        setError('Keine gültige Session gefunden')
      }
    } catch (err) {
      setError('Fehler beim Abrufen der Session')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Access cookies on client only after mount
    try {
      const cookies = document.cookie || ''
      setRawCookies(cookies)
      setHasSessionCookie(cookies.includes('session-token'))
    } catch {
      setRawCookies('')
      setHasSessionCookie(null)
    }
  }, [])

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
      
      if (response.ok) {
        setSessionInfo(null)
        setError('Abgemeldet')
      }
    } catch (err) {
      setError('Fehler beim Abmelden')
    }
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Debug Session</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Session Status</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Lädt...</p>
          ) : error ? (
            <div>
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={checkSession}>Session erneut prüfen</Button>
            </div>
          ) : sessionInfo ? (
            <div>
              <p className="text-green-600 mb-4">✅ Angemeldet</p>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(sessionInfo, null, 2)}
              </pre>
              <Button onClick={handleLogout} className="mt-4">Abmelden</Button>
            </div>
          ) : (
            <p>Keine Session gefunden</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cookies</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Session-Token: {hasSessionCookie === null ? 'Unbekannt' : hasSessionCookie ? 'Gefunden' : 'Nicht gefunden'}
          </p>
          <pre className="bg-gray-100 p-4 rounded text-sm mt-2 overflow-auto">
            {rawCookies || 'Keine Cookies'}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
