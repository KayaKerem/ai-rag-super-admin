import { Separator } from '@/components/ui/separator'
import { FieldLabel } from '@/components/ui/field-label'
import { ModelSelect } from '@/components/ui/model-select'
import { SYSTEM_MODEL_ROLES, type SystemModelRole, type SystemModels, type PlatformModel } from '../types'

interface SystemModelsGridProps {
  models: PlatformModel[]
  value: SystemModels
  onChange: (role: SystemModelRole, modelId: string) => void
}

interface RoleMeta {
  key: SystemModelRole
  label: string
  hint: string
}

const ROLE_META: RoleMeta[] = [
  { key: 'channel',              label: 'Kanal Mesajı',        hint: 'WhatsApp ve diğer kanal mesajlarına otomatik yanıt modeli' },
  { key: 'quote',                label: 'Teklif Hazırlama',    hint: 'Teklif hazırlama agent modeli' },
  { key: 'retry',                label: 'Guardrail Retry',     hint: 'Boş/format-fix retry sırasında kullanılan model' },
  { key: 'toolStep',             label: 'Tool Sonrası Adım',   hint: 'Tool çağrısı sonrası adım için downgrade modeli. Boş bırakılırsa ana model kalır (downgrade yok)' },
  { key: 'title',                label: 'Konuşma Başlığı',     hint: 'Sohbet başlığı otomatik üretimi (hafif model)' },
  { key: 'summary',              label: 'Doküman Özeti',       hint: 'Doküman AI özeti' },
  { key: 'compaction',           label: 'Konuşma Compaction',  hint: 'Uzun konuşmaların context özeti' },
  { key: 'qualityEval',          label: 'Kalite Değerlendirme', hint: 'Her turn groundedness/relevance ölçen ucuz model (maliyet azaltmak için ekonomik model seçin)' },
  { key: 'autoTag',              label: 'Bilgi AutoTag',       hint: 'Knowledge item otomatik tag + özet üretimi' },
  { key: 'research',             label: 'Research Agent',      hint: 'Web search sonuçlarını özetleyen research agent' },
  { key: 'memoryExtract',        label: 'Bellek Çıkarma',      hint: 'Konuşmadan bellek kayıtlarını çıkaran model' },
  { key: 'freshness',            label: 'İçerik Tazelik',      hint: 'Proactive: URL içerik değişim analizi' },
  { key: 'intentClassification', label: 'Lead Intent',         hint: 'Lead intent / urgency sınıflandırma' },
  { key: 'channelSummary',       label: 'Kanal Özeti',         hint: 'Kanal konuşması bitince CRM için oluşturulan özet' },
  { key: 'languageDetect',       label: 'Dil Tespiti',         hint: 'Kullanıcı mesaj dili tespiti' },
]

if (ROLE_META.length !== SYSTEM_MODEL_ROLES.length) {
  throw new Error(`SystemModelsGrid: ROLE_META has ${ROLE_META.length} entries, expected ${SYSTEM_MODEL_ROLES.length}`)
}

function placeholderFor(role: SystemModelRole): string {
  return role === 'toolStep' ? 'Downgrade yok (primary model)' : 'Chat default kullan'
}

export function SystemModelsGrid({ models, value, onChange }: SystemModelsGridProps) {
  if (models.length === 0) {
    return (
      <div className="col-span-2">
        <Separator className="my-3" />
        <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sistem Modelleri</p>
        <p className="text-xs text-muted-foreground">Platform modelleri yükleniyor...</p>
      </div>
    )
  }

  const setCount = ROLE_META.reduce((acc, { key }) => {
    const v = value[key]
    return acc + (typeof v === 'string' && v.length > 0 ? 1 : 0)
  }, 0)

  return (
    <>
      <div className="col-span-2">
        <Separator className="my-3" />
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sistem Modelleri</p>
          <span className="text-[10px] text-muted-foreground">{setCount}/15 set</span>
        </div>
      </div>
      {ROLE_META.map(({ key, label, hint }) => {
        const currentValue = value[key]
        const stringValue = typeof currentValue === 'string' ? currentValue : ''
        return (
          <div key={key}>
            <FieldLabel label={label} hint={hint} />
            <ModelSelect
              models={models}
              value={stringValue}
              onChange={(v) => onChange(key, v)}
              placeholder={placeholderFor(key)}
            />
          </div>
        )
      })}
    </>
  )
}
