export function createTaxService(sharedState) {
  return {
    computeLine(rate, quantity, gstRate, discount = 0) {
      const taxableValue = rate * quantity - discount;
      const gstAmount = (taxableValue * gstRate) / 100;
      return {
        taxableValue,
        gstAmount,
        cgst: gstAmount / 2,
        sgst: gstAmount / 2,
        igst: 0,
        cess: 0,
      };
    },

    computeTotals(lines, sellerStateCode, buyerStateCode) {
      const isInterState = sellerStateCode !== buyerStateCode;
      let subtotal = 0;
      let cgst = 0;
      let sgst = 0;
      let igst = 0;
      let cess = 0;

      for (const line of lines) {
        const lineTotals = this.computeLine(line.rate, line.quantity, line.gstRate, line.discount);
        subtotal += lineTotals.taxableValue;
        if (isInterState) {
          igst += lineTotals.gstAmount;
        } else {
          cgst += lineTotals.cgst;
          sgst += lineTotals.sgst;
        }
        cess += lineTotals.cess;
      }

      const grandTotal = subtotal + cgst + sgst + igst + cess;
      return { subtotal, cgst, sgst, igst, cess, grandTotal };
    },

    getRate(hsnCode) {
      const RATES = { '0': 0, '5': 5, '12': 12, '18': 18, '28': 28 };
      return RATES[hsnCode] ?? 18;
    },
  };
}