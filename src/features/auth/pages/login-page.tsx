import { LoginForm } from '../components/login-form'

export function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <span className="text-xl font-extrabold text-primary-foreground">S</span>
          </div>
          <h1 className="text-lg font-bold">Super Admin</h1>
          <p className="text-sm text-muted-foreground">Platform yönetim paneli</p>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <h2 className="mb-5 text-base font-semibold">Giriş Yap</h2>
          <LoginForm />
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Platform Admin erişimi gereklidir
        </p>
      </div>
    </div>
  )
}
