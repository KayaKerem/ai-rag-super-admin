import { Card, CardContent } from '@/components/ui/card'
import { DocsSectionCard } from '../components/docs-section-card'

interface GuardRow {
  order: number
  name: string
  check: string
  failure: string
}

const GUARD_CHAIN: GuardRow[] = [
  { order: 1, name: 'JwtAuthGuard',       check: 'Authorization header\'daki Bearer token\'ı doğrular.',       failure: '401 unauthorized' },
  { order: 2, name: 'PlatformAdminGuard', check: 'user.isPlatformAdmin === true olduğunu kontrol eder.',       failure: '403 platform_admin_required' },
  { order: 3, name: 'Handler',            check: 'İş mantığı çalışır.',                                         failure: 'Endpoint-özel hata' },
]

interface ErrorRow {
  code: string
  http: number
  meaning: string
}

const ERRORS: ErrorRow[] = [
  { code: 'unauthorized',            http: 401, meaning: 'Token yok veya imza geçersiz' },
  { code: 'token_expired',           http: 401, meaning: 'Token süresi dolmuş — yeniden login gerekli' },
  { code: 'platform_admin_required', http: 403, meaning: 'Kullanıcı platform admin değil' },
]

interface UserEndpointRow {
  method: string
  path: string
  purpose: string
}

const USER_ENDPOINTS: UserEndpointRow[] = [
  { method: 'GET',    path: '/platform/companies/:id/users',             purpose: 'Firmanın aktif kullanıcıları' },
  { method: 'POST',   path: '/platform/companies/:id/users',             purpose: 'Direkt kullanıcı oluştur (hemen aktif)' },
  { method: 'POST',   path: '/platform/companies/:id/users/invite',      purpose: 'Davet mail\'i gönder' },
  { method: 'POST',   path: '/platform/companies/:id/users/bulk-import', purpose: 'CSV ile toplu import (max 500 satır)' },
  { method: 'PATCH',  path: '/platform/companies/:id/users/:userId',     purpose: 'Rol veya bilgi güncelle' },
  { method: 'DELETE', path: '/platform/companies/:id/users/:userId',     purpose: 'Soft delete (deaktif et)' },
]

export function AuthYetkilendirme() {
  return (
    <DocsSectionCard id="auth-yetkilendirme" title="Auth & Yetkilendirme" icon="🔐">
      <p className="text-sm text-muted-foreground">
        Tüm <code className="rounded bg-muted px-1 py-0.5 text-xs">/platform/*</code> endpoint'leri iki guard ile korunur: geçerli JWT token + platform admin flag. Superadmin de normal <code className="rounded bg-muted px-1 py-0.5 text-xs">POST /auth/login</code> endpoint'ini kullanır; response'taki <code className="rounded bg-muted px-1 py-0.5 text-xs">user.isPlatformAdmin: true</code> erişimi açar.
      </p>

      <Card>
        <CardContent className="py-4 text-sm text-muted-foreground">
          <div className="mb-2 font-semibold text-foreground">Auth Header</div>
          <pre className="overflow-x-auto rounded bg-muted px-3 py-2 font-mono text-xs">Authorization: Bearer &lt;accessToken&gt;</pre>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <div className="border-b bg-muted/30 px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground">Guard Zinciri</div>
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/20 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-left">Guard</th>
                <th className="px-3 py-2 text-left">Kontrol</th>
                <th className="px-3 py-2 text-left">Başarısızsa</th>
              </tr>
            </thead>
            <tbody>
              {GUARD_CHAIN.map((g) => (
                <tr key={g.order} className="border-b last:border-b-0">
                  <td className="px-3 py-2 font-mono text-xs">{g.order}</td>
                  <td className="px-3 py-2 font-medium">{g.name}</td>
                  <td className="px-3 py-2 text-muted-foreground">{g.check}</td>
                  <td className="px-3 py-2 font-mono text-xs">{g.failure}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <div className="border-b bg-muted/30 px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground">Auth Hata Kodları</div>
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/20 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Kod</th>
                <th className="px-3 py-2 text-left">HTTP</th>
                <th className="px-3 py-2 text-left">Anlam</th>
              </tr>
            </thead>
            <tbody>
              {ERRORS.map((e) => (
                <tr key={e.code} className="border-b last:border-b-0">
                  <td className="px-3 py-2 font-mono text-xs">{e.code}</td>
                  <td className="px-3 py-2 font-mono text-xs">{e.http}</td>
                  <td className="px-3 py-2 text-muted-foreground">{e.meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="border-violet-500/30 bg-violet-500/5">
        <CardContent className="py-4 text-sm text-muted-foreground">
          <div className="font-semibold text-violet-400">isPlatformAdmin Flag</div>
          <div className="mt-2">
            <code className="rounded bg-muted px-1 py-0.5 text-xs">users</code> tablosundaki boolean kolondur. Veritabanı seviyesinde manuel atanır — UI üzerinden toggle edilmez. Normal admin/member kullanıcılar için her zaman <code className="rounded bg-muted px-1 py-0.5 text-xs">false</code>; yalnızca gerçek platform yöneticilerine <code className="rounded bg-muted px-1 py-0.5 text-xs">true</code> verilir.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <div className="border-b bg-muted/30 px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground">Kullanıcı Yönetimi Endpoint'leri</div>
          <table className="w-full text-sm">
            <tbody>
              {USER_ENDPOINTS.map((e) => (
                <tr key={`${e.method}-${e.path}`} className="border-b last:border-b-0">
                  <td className="px-3 py-2 font-mono text-xs text-violet-400">{e.method}</td>
                  <td className="px-3 py-2 font-mono text-xs">{e.path}</td>
                  <td className="px-3 py-2 text-muted-foreground">{e.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <p className="text-xs italic text-muted-foreground">
        401/403 sorunları için <a href="#sorun-giderme" className="underline hover:text-foreground">Sorun Giderme</a> bölümüne bakın.
      </p>
    </DocsSectionCard>
  )
}
