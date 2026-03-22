import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type AuthMeResponse } from '../api/client'
import { tokenStore } from './tokenStore'

interface AuthContextValue {
  token: string | null
  user: AuthMeResponse | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (token: string, user?: AuthMeResponse | null) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const [token, setToken] = useState<string | null>(() => tokenStore.get())

  useEffect(() => {
    const unsubscribe = tokenStore.subscribe(setToken)
    return unsubscribe
  }, [])

  const {
    data: user,
    isLoading,
    isError,
  } = useQuery<AuthMeResponse>({
    queryKey: ['me'],
    queryFn: api.authMe,
    enabled: Boolean(token),
    retry: 1,
  })

  useEffect(() => {
    if (!token) {
      queryClient.removeQueries({ queryKey: ['me'] })
    }
  }, [token, queryClient])

  useEffect(() => {
    if (token && isError && !isLoading) {
      tokenStore.clear()
      queryClient.removeQueries({ queryKey: ['me'] })
    }
  }, [token, isError, isLoading, queryClient])

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user: user ?? null,
      isAuthenticated: Boolean(token),
      isLoading,
      login: (nextToken: string, nextUser?: AuthMeResponse | null) => {
        tokenStore.set(nextToken)
        if (nextUser) {
          queryClient.setQueryData(['me'], nextUser)
        }
      },
      logout: () => {
        tokenStore.clear()
        queryClient.removeQueries({ queryKey: ['me'] })
      },
    }),
    [token, user, isLoading, queryClient],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
