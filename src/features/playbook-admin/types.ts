export interface RecomputePlaybookRequest {
  playbookId?: string
  companyId?: string
}

export interface RecomputePlaybookSyncResponse {
  playbookId: string
  sectionStatuses: Record<string, string>
}

export interface RecomputePlaybookAsyncResponse {
  triggerRunId: string
}

export type RecomputePlaybookResponse =
  | RecomputePlaybookSyncResponse
  | RecomputePlaybookAsyncResponse

export interface SeedPlaybookResponse {
  message: string
}

export function isSyncRecomputeResponse(
  r: RecomputePlaybookResponse,
): r is RecomputePlaybookSyncResponse {
  return 'playbookId' in r && 'sectionStatuses' in r
}
