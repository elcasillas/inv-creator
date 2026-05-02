export function parseInvoiceNumber(value: string | null | undefined) {
  if (!value || !/^\d+$/.test(value)) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function getNextInvoiceNumberForCompany(
  invoiceStartNumber: number,
  invoiceNumbers: Array<string | null | undefined>
) {
  const highestExisting = invoiceNumbers.reduce<number | null>((highest, invoiceNumber) => {
    const parsed = parseInvoiceNumber(invoiceNumber);

    if (parsed === null) {
      return highest;
    }

    if (highest === null || parsed > highest) {
      return parsed;
    }

    return highest;
  }, null);

  return String((highestExisting ?? invoiceStartNumber) + 1);
}
