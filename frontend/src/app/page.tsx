import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">🏢 Nómina de Empleados</h1>
          <p className="text-xl text-gray-600 mb-8">Interfaz web moderna para gestión de nóminas</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="text-2xl mb-4">👥</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Gestión de Empleados</h3>
              <p className="text-gray-600">Gestionar datos maestros, salarios y nóminas</p>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="text-2xl mb-4">💰</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Procesamiento de Nómina</h3>
              <p className="text-gray-600">Gestionar nóminas mensuales y anuales</p>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="text-2xl mb-4">📊</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Informes y Exportación</h3>
              <p className="text-gray-600">Exportación a Excel y herramientas de análisis</p>
            </div>
          </div>
          <div className="mt-12 text-center">
            <Link href="/dashboard">
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors">
                Ir a la aplicación →
              </button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
