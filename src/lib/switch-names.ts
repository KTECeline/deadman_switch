const TITLE_KEY = (pda: string) => `dms_title_${pda}`;
const BNAME_KEY = (addr: string) => `dms_bname_${addr}`;

export function getSwitchTitle(pda: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  return localStorage.getItem(TITLE_KEY(pda)) ?? fallback;
}

export function setSwitchTitle(pda: string, title: string): void {
  if (typeof window === "undefined") return;
  if (title) localStorage.setItem(TITLE_KEY(pda), title);
}

export function getBeneficiaryName(address: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  return localStorage.getItem(BNAME_KEY(address)) ?? fallback;
}

export function setBeneficiaryName(address: string, name: string): void {
  if (typeof window === "undefined") return;
  if (name) localStorage.setItem(BNAME_KEY(address), name);
}
