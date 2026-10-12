import { useEffect, useState } from 'react'

import { fetchPlans } from '@/lib/api'
import type { Plan } from '@/lib/api'

interface PlansState {
  plans: Plan[]
  loading: boolean
  error: string | null
}

export function usePlans(): PlansState {
  const [state, setState] = useState<PlansState>({
    plans: [],
    loading: true,
    error: null,
  })

  useEffect(() => {
    let mounted = true

    fetchPlans()
      .then((plans) => {
        if (mounted) setState({ plans, loading: false, error: null })
      })
      .catch((error: unknown) => {
        if (mounted) {
          setState({
            plans: [],
            loading: false,
            error: error instanceof Error ? error.message : 'Não foi possível carregar os planos agora.',
          })
        }
      })

    return () => {
      mounted = false
    }
  }, [])

  return state
}
