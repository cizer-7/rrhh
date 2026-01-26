import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">🏢 Mitarbeiter Gehaltsabrechnung</h1>
          <p className="text-xl text-gray-600 mb-8">Modernes Web-Interface für Gehaltsverwaltung</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="text-2xl mb-4">👥</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Mitarbeiterverwaltung</h3>
              <p className="text-gray-600">Stammdaten, Gehälter und Abrechnungen verwalten</p>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="text-2xl mb-4">💰</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Gehaltsabrechnung</h3>
              <p className="text-gray-600">Monats- und Jahresgehälter verwalten</p>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="text-2xl mb-4">📊</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Berichte & Export</h3>
              <p className="text-gray-600">Excel-Export und Analyse-Tools</p>
            </div>
          </div>
          <div className="mt-12 text-center">
            <Link href="/dashboard">
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors">
                Zur Anwendung →
              </button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
