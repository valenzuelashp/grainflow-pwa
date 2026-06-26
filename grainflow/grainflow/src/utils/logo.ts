export function getLogoUrl(logoPath?: string | null): string | null {
  if (!logoPath) return null;
  if (logoPath.startsWith('data:') || logoPath.startsWith('http')) return logoPath;
  return logoPath;
}
