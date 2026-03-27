import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useLogin } from '../hooks/use-login'
import { useAuth } from '../hooks/use-auth'
import { useState } from 'react'
import { AlertCircle } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Geçerli bir email girin'),
  password: z.string().min(1, 'Şifre gerekli'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginForm() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const loginMutation = useLogin()
  const [error, setError] = useState<string | null>(null)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values: LoginFormValues) {
    setError(null)
    loginMutation.mutate(values, {
      onSuccess: (data) => {
        if (data.user.isPlatformAdmin === false) {
          setError('Bu hesap platform admin yetkisine sahip değil.')
          return
        }
        login(data.accessToken, data.refreshToken, data.user)
        navigate('/')
      },
      onError: () => {
        setError('Email veya şifre hatalı.')
      },
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="admin@firma.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Şifre</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? 'Giriş yapılıyor...' : 'Giriş Yap'}
        </Button>
      </form>
    </Form>
  )
}
