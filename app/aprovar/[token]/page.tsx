import { getPublicPlanByToken } from '@/app/actions/plans'
import PublicPlanClient from './PublicPlanClient'
import { Metadata } from 'next'

export const dynamic = "force-dynamic"
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Aprovação de Planejamento | Planner D',
  description: 'Visualize e aprove seu planejamento mensal de conteúdo.',
}

type PageProps = {
  params: Promise<{ token: string }>
}

export default async function PublicPlanPage({ params }: PageProps) {
  const { token } = await params
  const plan = await getPublicPlanByToken(token)

  if (!plan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 text-center">
        <div className="space-y-4">
          <div className="text-6xl">🔍</div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tighter">Planejamento não encontrado</h1>
          <p className="text-gray-400 font-medium italic">O link pode estar expirado ou o token é inválido.</p>
        </div>
      </div>
    )
  }

  return <PublicPlanClient initialPlan={plan} token={token} />
}
