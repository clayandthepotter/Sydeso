import type { TenantDirectoryPort, TenantSettings } from "@desk/domain";

interface TenantRow {
  tenant_id: string;
  time_zone: string;
  confidence_threshold: number;
  invite_address_token: string;
  allowed_senders: string;
}

const toSettings = (row: TenantRow): TenantSettings => ({
  tenantId: row.tenant_id,
  timeZone: row.time_zone,
  confidenceThreshold: row.confidence_threshold,
  inviteAddressToken: row.invite_address_token,
  allowedSenders: JSON.parse(row.allowed_senders) as string[],
});

/** Reads tenant settings from the identity tables. */
export class D1TenantDirectory implements TenantDirectoryPort {
  constructor(private readonly db: D1Database) {}

  async get(tenantId: string): Promise<TenantSettings | null> {
    const row = await this.db.prepare("SELECT * FROM tenants WHERE tenant_id = ?").bind(tenantId).first<TenantRow>();
    return row ? toSettings(row) : null;
  }

  async byInviteToken(token: string): Promise<TenantSettings | null> {
    const row = await this.db
      .prepare("SELECT * FROM tenants WHERE invite_address_token = ?")
      .bind(token)
      .first<TenantRow>();
    return row ? toSettings(row) : null;
  }
}
