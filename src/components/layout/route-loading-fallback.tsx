import { Loader2 } from 'lucide-react'

export function RouteLoadingFallback() {
  return (
    <div className="flex h-full min-h-[50vh] w-full items-center justify-center text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span className="ml-2 text-sm">Yükleniyor...</span>
    </div>
  )
}
