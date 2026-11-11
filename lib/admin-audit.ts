import { prisma } from '@/lib/prisma'

type AuditValue = Record<string, unknown> | string | number | boolean | null | undefined

function serialize(value: AuditValue) {
  if (value === undefined || value === null) return null
  return typeof value === 'string' ? value : JSON.stringify(value)
}

export async function recordAdminAudit(input: {
  adminId: string
  action: string
  entityType: string
  entityId?: string
  summary: string
  before?: AuditValue
  after?: AuditValue
  metadata?: AuditValue
}) {
  return prisma.adminAuditLog.create({
    data: {
      adminId: input.adminId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      summary: input.summary,
      beforeJson: serialize(input.before),
      afterJson: serialize(input.after),
      metadataJson: serialize(input.metadata),
    },
  })
}
