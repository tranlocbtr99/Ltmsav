/**
 * SimulationEngine — Bộ máy mô phỏng mua sắm tài chính chuyên sâu cho LTMsav
 * Hỗ trợ: Trả thẳng 100%, Mua trả góp (có trả trước, kỳ hạn linh hoạt, lãi suất & phí), Tích lũy trước khi mua.
 */

export interface PurchaseOption {
  optionName: string;
  type: 'buy_now' | 'installment' | 'save_first' | 'skip';
  immediatePayment: number; // Tiền phải trả ngay (Trả thẳng hoặc Trả trước)
  monthlyPayment: number;   // Tiền phải trả mỗi tháng
  totalPayment: number;     // Tổng số tiền thực chi
  interestAndFees: number;  // Số tiền lãi & phí chênh lệch so với mua thẳng
  remainingBalanceAfterPayment: number;
  monthsCount: number;
  isAffordable: boolean;
  debtBurdenRatio: number;  // Tỷ lệ tiền góp / Thặng dư hàng tháng (%)
  riskSummary: string;
}

export interface PurchaseSimulationResult {
  itemName: string;
  price: number;
  downPayment: number;
  loanAmount: number;
  installmentMonths: number;
  interestRateYearly: number;
  options: PurchaseOption[];
  recommendation: string;
}

export function formatMoneyVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(amount);
}

export function simulatePurchase(
  itemName: string,
  price: number,
  currentLiquidCash: number,
  monthlySurplus: number, // Thặng dư thu nhập - chi phí hàng tháng
  installmentMonths: number = 6,
  downPayment: number = 0, // Số tiền trả trước
  interestRateYearly: number = 12.0 // Lãi suất trả góp %/năm (hoặc phí chuyển đổi)
): PurchaseSimulationResult {
  const options: PurchaseOption[] = [];
  const safeSurplus = Math.max(0, monthlySurplus);

  // 1. Không mua (Bảo toàn số dư)
  options.push({
    optionName: 'Không mua / Trì hoãn',
    type: 'skip',
    immediatePayment: 0,
    monthlyPayment: 0,
    totalPayment: 0,
    interestAndFees: 0,
    remainingBalanceAfterPayment: currentLiquidCash,
    monthsCount: 0,
    isAffordable: true,
    debtBurdenRatio: 0,
    riskSummary: `Bảo toàn 100% dòng tiền sẵn có ${formatMoneyVnd(currentLiquidCash)}. Dành ngân sách cho các mục tiêu tài chính cấp thiết hơn.`
  });

  // 2. Mua ngay (Trả thẳng 100%)
  const balanceAfterBuyNow = currentLiquidCash - price;
  const isBuyNowAffordable = balanceAfterBuyNow >= 0;
  let buyNowRisk = '';
  if (balanceAfterBuyNow < 0) {
    buyNowRisk = `NGUY CƠ CAO: Bạn thiếu ${formatMoneyVnd(Math.abs(balanceAfterBuyNow))}. Số dư tiền mặt sẽ bị âm, rơi vào tình trạng mất thanh khoản!`;
  } else if (balanceAfterBuyNow < 2000000) {
    buyNowRisk = `CẢNH BÁO DÒNG TIỀN: Sau khi mua thẳng bạn chỉ còn ${formatMoneyVnd(balanceAfterBuyNow)} tiền mặt. Quỹ dự phòng quá mỏng, dễ gặp rủi ro nếu có sự cố bất ngờ.`;
  } else {
    buyNowRisk = `TỐI ƯU VỀ GIÁ: Tiết kiệm 100% tiền lãi & phí. Sau khi thanh toán bạn vẫn còn ${formatMoneyVnd(balanceAfterBuyNow)} tiền mặt an toàn.`;
  }

  options.push({
    optionName: 'Trả thẳng 100%',
    type: 'buy_now',
    immediatePayment: price,
    monthlyPayment: 0,
    totalPayment: price,
    interestAndFees: 0,
    remainingBalanceAfterPayment: balanceAfterBuyNow,
    monthsCount: 1,
    isAffordable: isBuyNowAffordable,
    debtBurdenRatio: 0,
    riskSummary: buyNowRisk
  });

  // 3. Mua trả góp (Installment)
  const validMonths = Math.max(1, installmentMonths);
  const actualDownPayment = Math.min(price, Math.max(0, downPayment));
  const loanAmount = Math.max(0, price - actualDownPayment);

  // Tính tiền lãi & tiền góp mỗi tháng (theo chuẩn dư nợ phẳng hoặc niên kim thực tế ngân hàng)
  // Lãi suất tháng = interestRateYearly / 12 / 100
  const monthlyRate = (interestRateYearly / 100) / 12;
  let monthlyInstallment = 0;
  let totalInstallmentPayment = actualDownPayment;
  let totalInterest = 0;

  if (loanAmount > 0) {
    if (monthlyRate > 0) {
      // Công thức trả góp phổ biến tại VN (Gốc chia đều + Lãi phẳng hoặc Niên kim)
      // Gốc mỗi tháng: loanAmount / validMonths
      // Lãi mỗi tháng: loanAmount * monthlyRate
      const monthlyPrincipal = Math.round(loanAmount / validMonths);
      const monthlyInterest = Math.round(loanAmount * monthlyRate);
      monthlyInstallment = monthlyPrincipal + monthlyInterest;
      totalInterest = monthlyInterest * validMonths;
      totalInstallmentPayment = actualDownPayment + (monthlyInstallment * validMonths);
    } else {
      // 0% Lãi suất
      monthlyInstallment = Math.round(loanAmount / validMonths);
      totalInstallmentPayment = price;
    }
  }

  const immediateOutflow = actualDownPayment + monthlyInstallment; // Trả trước + Kỳ đầu
  const balanceAfterFirstMonth = currentLiquidCash - immediateOutflow;
  const debtRatio = safeSurplus > 0 ? Math.round((monthlyInstallment / safeSurplus) * 100) : 100;
  const isInstallmentAffordable = balanceAfterFirstMonth >= 0 && (safeSurplus === 0 || debtRatio <= 80);

  let installmentRisk = '';
  if (debtRatio > 100) {
    installmentRisk = `ÁP LỰC BỘI CHI: Tiền góp (${formatMoneyVnd(monthlyInstallment)}/tháng) vượt quá mức thặng dư thu nhập (${formatMoneyVnd(safeSurplus)}/tháng). Nguy cơ thiếu tiền sinh hoạt!`;
  } else if (debtRatio > 50) {
    installmentRisk = `Áp lực đáng kể: Tiền góp chiếm ${debtRatio}% số tiền thặng dư mỗi tháng. Chênh lệch tiền lãi & phí là ${formatMoneyVnd(totalInterest)}.`;
  } else {
    installmentRisk = `Khả thi: Tiền góp ${formatMoneyVnd(monthlyInstallment)}/tháng trong ${validMonths} tháng, chiếm ${debtRatio}% thặng dư. Chênh lệch lãi/phí: ${formatMoneyVnd(totalInterest)}.`;
  }

  options.push({
    optionName: `Mua trả góp (${validMonths} tháng)`,
    type: 'installment',
    immediatePayment: actualDownPayment,
    monthlyPayment: monthlyInstallment,
    totalPayment: totalInstallmentPayment,
    interestAndFees: totalInterest,
    remainingBalanceAfterPayment: balanceAfterFirstMonth,
    monthsCount: validMonths,
    isAffordable: isInstallmentAffordable,
    debtBurdenRatio: debtRatio,
    riskSummary: installmentRisk
  });

  // 4. Tích lũy trước rồi mua (Save first)
  const monthlySavingsPlan = safeSurplus > 0 ? Math.min(safeSurplus, Math.max(1000000, Math.round(price / 6))) : 1000000;
  const monthsToSave = Math.max(1, Math.ceil(price / monthlySavingsPlan));

  options.push({
    optionName: `Tích lũy trước rồi mua (${monthsToSave} tháng)`,
    type: 'save_first',
    immediatePayment: 0,
    monthlyPayment: monthlySavingsPlan,
    totalPayment: price,
    interestAndFees: 0,
    remainingBalanceAfterPayment: currentLiquidCash,
    monthsCount: monthsToSave,
    isAffordable: true,
    debtBurdenRatio: safeSurplus > 0 ? Math.round((monthlySavingsPlan / safeSurplus) * 100) : 0,
    riskSummary: `Phương án an toàn nhất: Để dành ${formatMoneyVnd(monthlySavingsPlan)}/tháng trong ${monthsToSave} tháng. Mua trọn vẹn, không chịu nợ và tiết kiệm ${formatMoneyVnd(totalInterest)} tiền lãi.`
  });

  // Đưa ra khuyến nghị dựa trên so sánh trực quan
  let bestRecommendation = '';
  if (isBuyNowAffordable && balanceAfterBuyNow >= 3000000) {
    bestRecommendation = 'Khuyên dùng: Bạn có đủ tiền mặt an toàn để "Trả thẳng 100%". Điều này giúp tiết kiệm tối đa tiền lãi và không bị gánh nặng nợ hàng tháng.';
  } else if (isInstallmentAffordable && debtRatio <= 40) {
    bestRecommendation = `Nếu thiết bị phục vụ công việc/học tập cấp thiết ngay, phương án "Trả góp ${validMonths} tháng" là hợp lý vì áp lực tiền góp (${formatMoneyVnd(monthlyInstallment)}/tháng) chỉ chiếm ${debtRatio}% thặng dư.`;
  } else {
    bestRecommendation = `Khuyên dùng: Nên chọn "Tích lũy trước rồi mua (${monthsToSave} tháng)" để bảo toàn quỹ dự phòng khẩn cấp và không phải chịu lãi suất vay tiêu dùng.`;
  }

  return {
    itemName,
    price,
    downPayment: actualDownPayment,
    loanAmount,
    installmentMonths: validMonths,
    interestRateYearly,
    options,
    recommendation: bestRecommendation
  };
}

