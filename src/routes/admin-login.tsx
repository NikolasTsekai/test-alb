import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Lock } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export const Route = createFileRoute('/admin-login')({
  component: LoginPage,
})

const schema = z.object({
  email:    z.string().email('Email i pavlefshëm'),
  password: z.string().min(6, 'Fjalëkalimi duhet të ketë së paku 6 karaktere'),
})
type FormData = z.infer<typeof schema>

function LoginPage() {
  const { user, loading, signIn } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (!loading && user) {
      navigate({ to: '/admin' })
    }
  }, [user, loading, navigate])

  const onSubmit = async (data: FormData) => {
    setServerError('')
    const { error } = await signIn(data.email, data.password)
    if (error) {
      setServerError('Email ose fjalëkalim i gabuar.')
      return
    }
    navigate({ to: '/admin' })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <Loader2 className="animate-spin text-amber-400" size={32} />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-sm">
        {/* Logo / brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-4">
            <Lock className="text-amber-400" size={24} />
          </div>
          <h1 className="text-2xl font-bold text-white">Albanian Gold</h1>
          <p className="text-sm text-gray-500 mt-1">Paneli i Administratorit</p>
        </div>

        <Card className="bg-gray-900 border-gray-800 shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-lg">Hyrja</CardTitle>
            <CardDescription className="text-gray-400">
              Vendosni kredencialet tuaja për të hyrë
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-gray-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@shembull.com"
                  autoComplete="email"
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-600 focus-visible:ring-amber-500"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-xs text-red-400">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-gray-300">Fjalëkalimi</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-600 focus-visible:ring-amber-500"
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-xs text-red-400">{errors.password.message}</p>
                )}
              </div>

              {serverError && (
                <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-md px-3 py-2">
                  {serverError}
                </p>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold mt-2"
              >
                {isSubmitting ? (
                  <><Loader2 className="animate-spin mr-2" size={16} /> Duke hyrë...</>
                ) : (
                  'Hyr në Panel'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-600 mt-6">
          Vetëm administratorët e autorizuar mund të hyjnë.
        </p>
      </div>
    </div>
  )
}
