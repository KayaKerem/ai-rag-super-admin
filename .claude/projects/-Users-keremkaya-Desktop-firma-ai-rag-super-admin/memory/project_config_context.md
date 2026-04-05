---
name: Company self-service config
description: Companies manage their own API keys and budgets - superadmin panel shows these but the config belongs to the company
type: project
---

Şirketler kendi AI config'lerini (API key, budget, provider, model) kendileri ayarlıyor. Superadmin panelinde bu alanlar görüntülenebilir ve düzenlenebilir ama asıl kullanım şirketin kendi panelinden yapılıyor.

**Why:** Bu bir multi-tenant SaaS — her firma kendi AI provider key'ini ve bütçesini yönetiyor. Superadmin bu config'leri görebilir/düzenleyebilir ama birincil düzenleme noktası şirketin kendi arayüzü.

**How to apply:** Config tab'daki alanları tasarlarken, bu alanların şirket tarafından yönetildiğini göz önünde bulundur. Superadmin panelinde bu alanlara müdahale ederken "şirketin kendi ayarını override ediyorsunuz" gibi bir uyarı düşünülebilir.
