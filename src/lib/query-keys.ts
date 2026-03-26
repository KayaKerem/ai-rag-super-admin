export const queryKeys = {
  companies: {
    all: ['companies'] as const,
    detail: (id: string) => ['companies', id] as const,
    config: (id: string) => ['companies', id, 'config'] as const,
    toolConfig: (id: string) => ['companies', id, 'tool-config'] as const,
    users: (id: string) => ['companies', id, 'users'] as const,
    usage: (id: string, months: number) => ['companies', id, 'usage', months] as const,
    usageCurrent: (id: string) => ['companies', id, 'usage', 'current'] as const,
  },
  platform: {
    summary: (months: number) => ['platform', 'summary', months] as const,
    defaults: ['platform', 'defaults'] as const,
    models: ['platform', 'models'] as const,
    toolPlans: ['platform', 'tool-plans'] as const,
  },
}
