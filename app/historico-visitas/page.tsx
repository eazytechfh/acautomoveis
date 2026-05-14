"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { SidebarNav } from "@/components/sidebar-nav"
import { HistoricoVisitasTable } from "@/components/historico-visitas-table"

export default function HistoricoVisitas() {
  const router = useRouter()

  useEffect(() => {
    const user = getCurrentUser()
    if (!user) {
      router.push("/")
    }
  }, [router])

  return (
    <div className="flex h-screen bg-gray-50">
      <SidebarNav />

      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          <div className="container mx-auto px-6 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Histórico de Visitas</h1>
              <p className="text-gray-600">Visualize todas as visitas realizadas, reagendadas e não fechadas</p>
            </div>

            <HistoricoVisitasTable />
          </div>
        </main>
      </div>
    </div>
  )
}
