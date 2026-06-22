/** Trigger a browser download for a Blob (used by CSV export, NFR-5). */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoke on the next tick so the click has been handled.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
