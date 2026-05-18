import { getAgentLabel } from '../types'

interface AgentLabelProps {
  agentId: string
  className?: string
}

export function AgentLabel({ agentId, className }: AgentLabelProps) {
  const label = getAgentLabel(agentId)
  return <span className={className}>{label}</span>
}
