const apiUrl = process.env.MAILCOW_API_URL?.replace(/\/+$/, "");
const apiKey = process.env.MAILCOW_API_KEY;

export function mailcowEnabled(): boolean {
  return Boolean(apiUrl && apiKey);
}

export function mailDomain(): string {
  return (process.env.MAIL_DOMAIN || "alfabe.co").toLowerCase();
}

async function call(path: string, method: string, body?: unknown): Promise<unknown> {
  const res = await fetch(`${apiUrl}${path}`, {
    method,
    headers: {
      "X-API-Key": apiKey as string,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Mailcow ${method} ${path} -> ${res.status}: ${text.slice(0, 300)}`);
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function createMailbox(
  localPart: string,
  password: string,
  displayName: string,
  quotaMb = 1024
): Promise<void> {
  if (!mailcowEnabled()) {
    console.log(`[MAILCOW] Entegrasyon kapali, posta kutusu olusturulmadi: ${localPart}@${mailDomain()}`);
    return;
  }
  try {
    await call("/api/v1/add/mailbox", "POST", {
      local_part: localPart.toLowerCase(),
      domain: mailDomain(),
      password,
      password2: password,
      quota: quotaMb,
      active: true,
      name: displayName,
    });
    console.log(`[MAILCOW] Posta kutusu olusturuldu: ${localPart}@${mailDomain()}`);
  } catch (e) {
    console.error("[MAILCOW] Posta kutusu olusturulamadi:", e instanceof Error ? e.message : e);
  }
}

export async function deleteMailbox(localPart: string): Promise<void> {
  if (!mailcowEnabled()) return;
  try {
    await call("/api/v1/delete/mailbox", "POST", [
      `${localPart.toLowerCase()}@${mailDomain()}`,
    ]);
  } catch (e) {
    console.error("[MAILCOW] Posta kutusu silinemedi:", e instanceof Error ? e.message : e);
  }
}

export async function updateMailboxPassword(
  localPart: string,
  newPassword: string
): Promise<void> {
  if (!mailcowEnabled()) return;
  try {
    await call(
      `/api/v1/edit/mailbox/${encodeURIComponent(`${localPart}@${mailDomain()}`)}`,
      "POST",
      { password: newPassword, password2: newPassword }
    );
  } catch (e) {
    console.error("[MAILCOW] Sifre guncellenemedi:", e instanceof Error ? e.message : e);
  }
}
