/**
 * Helper formatters and CSV exporter tailored for Indonesian Rupiah & Excel
 */

export function formatRupiah(amount: number): string {
  const safeAmount = isNaN(amount) ? 0 : amount;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(safeAmount);
}

export function formatDateIndo(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
}

export function formatDateTimeIndo(dateTimeStr: string): string {
  if (!dateTimeStr) return '-';
  try {
    const date = new Date(dateTimeStr);
    if (isNaN(date.getTime())) return dateTimeStr;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date);
  } catch {
    return dateTimeStr;
  }
}

export function generateTransactionNumber(jenis: 'Uang Masuk' | 'Uang Keluar'): string {
  const prefix = jenis === 'Uang Masuk' ? 'TR-MSK' : 'TR-KLR';
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${year}${month}${day}-${randomSuffix}`;
}

/**
 * Clean & beautiful CSV export for Excel Indonesia:
 * - UTF-8 BOM (\uFEFF)
 * - Semicolon (;) delimiter
 * - Border lines (========================================)
 * - Kop resmi instansi
 */
export function exportToCsvWithBOM(
  filename: string,
  headers: string[],
  rows: (string | number)[][],
  metadataTitle: string,
  uptName: string,
  extraNotes?: string[]
) {
  const delimiter = ';';
  const timestamp = new Date().toLocaleString('id-ID');
  const borderLine = '='.repeat(100);
  const thinLine = '-'.repeat(100);

  const cleanVal = (val: string | number) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const lines: string[] = [
    cleanVal(uptName.toUpperCase()),
    cleanVal(`LAPORAN: ${metadataTitle.toUpperCase()}`),
    cleanVal(`Waktu Cetak: ${timestamp}`),
  ];

  if (extraNotes && extraNotes.length > 0) {
    extraNotes.forEach((note) => lines.push(cleanVal(note)));
  }

  lines.push(cleanVal(borderLine));
  lines.push(headers.map(cleanVal).join(delimiter));
  lines.push(headers.map(() => cleanVal(thinLine.slice(0, 20))).join(delimiter));

  rows.forEach((row) => {
    lines.push(row.map(cleanVal).join(delimiter));
  });

  lines.push(headers.map(() => cleanVal(borderLine.slice(0, 20))).join(delimiter));
  lines.push(cleanVal(`* Dicetak secara otomatis melalui Sistem Informasi Keuangan Warga Binaan (${uptName})`));

  const csvContent = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
