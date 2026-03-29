import { useState } from 'react'
import { useEmailTemplates } from '../hooks/use-email-templates'
import { EmailTemplateTable } from '../components/email-template-table'
import { EmailTemplateEditDialog } from '../components/email-template-edit-dialog'
import type { EmailTemplate } from '@/features/companies/types'

export function EmailTemplatesPage() {
  const { data: templates, isLoading } = useEmailTemplates()
  const [selected, setSelected] = useState<EmailTemplate | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  function handleSelect(template: EmailTemplate) {
    setSelected(template)
    setDialogOpen(true)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold">Email Şablonları</h1>
        <p className="text-sm text-muted-foreground">{templates?.length ?? 0} şablon</p>
      </div>

      <EmailTemplateTable
        data={templates ?? []}
        isLoading={isLoading}
        onSelect={handleSelect}
      />

      <EmailTemplateEditDialog
        template={selected}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  )
}
