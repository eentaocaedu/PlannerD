import Sidebar from '@/components/Sidebar'

export default function InternalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex relative overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <main className="flex-1 lg:ml-64 min-h-screen relative">
        <div className="p-6 md:p-12 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
