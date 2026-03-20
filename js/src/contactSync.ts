/**
 * Helpers for CRM ↔ SMSv contact sync (normalize phones, diff, import plan).
 * Works with `SmsvClient.listContacts` / `importContacts` response shapes.
 */

/** Minimal contact row from your CRM */
export interface CrmContactInput {
  phone: string;
  name?: string;
  email?: string;
  /** Your stable id (stored in SMSv metadata if you use it) */
  externalId?: string;
}

/** Minimal SMSv contact as returned by list (fields vary by API version) */
export interface SmsvContactLike {
  id: string;
  phone?: string | null;
  phoneNumber?: string | null;
  name?: string | null;
  email?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface ContactDiffResult {
  /** CRM rows with no matching SMSv phone */
  onlyInCrm: CrmContactInput[];
  /** SMSv contacts whose normalized phone is not in CRM */
  onlyInSmsv: SmsvContactLike[];
  /** Pairs that share the same normalized phone (id + CRM row) */
  inBoth: Array<{ smsv: SmsvContactLike; crm: CrmContactInput }>;
}

export interface ImportPlanRow {
  phone: string;
  name?: string;
  email?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Normalize to E.164-ish `+` prefix for comparison.
 * @param defaultCountryDigits — when local digits (e.g. ML), prefix with this ITU country code (default `223`).
 */
export function normalizeContactPhone(input: string, defaultCountryDigits = "223"): string {
  let cleaned = String(input).replace(/[\s\-().]/g, "");
  if (!cleaned) return "";

  if (cleaned.startsWith("+")) {
    return "+" + cleaned.slice(1).replace(/\D/g, "");
  }
  if (cleaned.startsWith("00")) {
    cleaned = cleaned.slice(2);
  }
  const digits = cleaned.replace(/\D/g, "");
  if (!digits) return "";

  // Heuristic: short or leading 6–8 → treat as local (Mali-style)
  if (digits.length <= 8 || /^[678]/.test(digits)) {
    return `+${defaultCountryDigits}${digits}`;
  }
  return `+${digits}`;
}

function smsvPhone(c: SmsvContactLike): string {
  return normalizeContactPhone(String(c.phone ?? c.phoneNumber ?? ""));
}

/**
 * Compare CRM contacts with an SMSv contact list (by normalized phone).
 */
export function diffContactsByPhone(
  crm: CrmContactInput[],
  smsv: SmsvContactLike[],
): ContactDiffResult {
  const byPhone = new Map<string, SmsvContactLike>();
  for (const c of smsv) {
    const k = smsvPhone(c);
    if (k) byPhone.set(k, c);
  }

  const onlyInCrm: CrmContactInput[] = [];
  const inBoth: Array<{ smsv: SmsvContactLike; crm: CrmContactInput }> = [];
  const matchedSmsv = new Set<string>();

  for (const row of crm) {
    const k = normalizeContactPhone(row.phone);
    if (!k) {
      onlyInCrm.push(row);
      continue;
    }
    const s = byPhone.get(k);
    if (s) {
      matchedSmsv.add(k);
      inBoth.push({ smsv: s, crm: row });
    } else {
      onlyInCrm.push(row);
    }
  }

  const onlyInSmsv: SmsvContactLike[] = [];
  for (const [k, c] of byPhone) {
    if (!matchedSmsv.has(k)) onlyInSmsv.push(c);
  }

  return { onlyInCrm, onlyInSmsv, inBoth };
}

/**
 * Build `contacts` payload for `POST /apps/:appId/contacts/import`.
 */
export function buildImportPayload(rows: CrmContactInput[]): ImportPlanRow[] {
  return rows.map((r) => ({
    phone: normalizeContactPhone(r.phone),
    ...(r.name ? { name: r.name } : {}),
    ...(r.email ? { email: r.email } : {}),
    ...(r.externalId
      ? { metadata: { externalId: r.externalId, source: "crm" } }
      : { metadata: { source: "crm" } }),
  }));
}

/**
 * Map SMSv contacts to CRM-friendly rows (export path).
 */
export function smsvContactsToCrmExport(contacts: SmsvContactLike[]): CrmContactInput[] {
  return contacts.map((c) => {
    const meta = c.metadata && typeof c.metadata === "object" ? c.metadata : {};
    const ext =
      typeof meta.externalId === "string"
        ? meta.externalId
        : typeof meta.external_id === "string"
          ? meta.external_id
          : undefined;
    return {
      phone: normalizeContactPhone(String(c.phone ?? c.phoneNumber ?? "")),
      name: c.name ?? undefined,
      email: c.email ?? undefined,
      externalId: ext,
    };
  });
}
