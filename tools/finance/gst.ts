export interface GSTInput {
  amount: number;
  gstRate: number; // 0, 5, 12, 18, 28 or custom
  type: "add" | "remove"; // add GST or remove GST
}

export interface GSTOutput {
  originalAmount: number;
  gstAmount: number;
  totalAmount: number;
  cgstAmount: number;
  sgstAmount: number;
}

export function calculateGST(input: GSTInput): GSTOutput {
  const { amount, gstRate, type } = input;
  const rate = Math.max(0, gstRate);

  if (amount <= 0) {
    return {
      originalAmount: 0,
      gstAmount: 0,
      totalAmount: 0,
      cgstAmount: 0,
      sgstAmount: 0,
    };
  }

  if (type === "add") {
    const gstAmount = (amount * rate) / 100;
    const totalAmount = amount + gstAmount;
    return {
      originalAmount: Math.round(amount),
      gstAmount: Math.round(gstAmount),
      totalAmount: Math.round(totalAmount),
      cgstAmount: Math.round(gstAmount / 2),
      sgstAmount: Math.round(gstAmount / 2),
    };
  } else {
    // remove GST from inclusive total
    const originalAmount = (amount * 100) / (100 + rate);
    const gstAmount = amount - originalAmount;
    return {
      originalAmount: Math.round(originalAmount),
      gstAmount: Math.round(gstAmount),
      totalAmount: Math.round(amount),
      cgstAmount: Math.round(gstAmount / 2),
      sgstAmount: Math.round(gstAmount / 2),
    };
  }
}
