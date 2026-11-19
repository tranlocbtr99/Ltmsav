/**
 * SimulationEngine — Bộ máy mô phỏng mua sắm tài chính cho LTMsav
 * Port từ SimulationEngine.kt với tính toán chính xác VND và đánh giá rủi ro
 */

export interface PurchaseOption {
  optionName: string;
  immediatePayment: number;
  monthlyPayment: number;
  totalPayment: number;
  remainingBalanceAfterPayment: number;
  isAffordable: boolean;
  riskSummary: string;
}

export interface PurchaseSimulationResult {
  itemName: string;
  price: number;
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
  installmentFeePercent: number = 3.0 // Phí chuyển đổi hoặc lãi trả góp (%)
): PurchaseSimulationResult {
  const options: PurchaseOption[] = [];

  // 1. Không mua
  options.push({
    optionName: 'Không mua',
    immediatePayment: 0,
    monthlyPayment: 0,
    totalPayment: 0,
    remainingBalanceAfterPayment: currentLiquidCash,
    isAffordable: true,
    riskSummary: `Bảo toàn số dư sẵn có ${formatMoneyVnd(currentLiquidCash)}. Không phát sinh nghĩa vụ nợ.`
  });

  // 2. Mua ngay (Trả thẳng)
  const balanceAfterBuyNow = currentLiquidCash - price;
  const isBuyNowAffordable = balanceAfterBuyNow >= 0;
  let buyNowRisk = '';
  if (balanceAfterBuyNow < 0) {
    buyNowRisk = `NGUY CƠ CAO: Thiếu hụt ${formatMoneyVnd(Math.abs(balanceAfterBuyNow))}. Số dư khả dụng sẽ về âm!`;
  } else if (balanceAfterBuyNow < 1000000) {
    buyNowRisk = `CẢNH BÁO: Số dư còn lại quá mỏng (${formatMoneyVnd(balanceAfterBuyNow)}), rất dễ mất khả năng chi trả khi có sự cố khẩn cấp.`;
  } else {
    buyNowRisk = `Khả thi. Bạn vẫn giữ được ${formatMoneyVnd(balanceAfterBuyNow)} tiền mặt dự phòng an toàn.`;
  }

  options.push({
    optionName: 'Mua ngay (Trả thẳng)',
    immediatePayment: price,
    monthlyPayment: 0,
    totalPayment: price,
    remainingBalanceAfterPayment: balanceAfterBuyNow,
    isAffordable: isBuyNowAffordable,
    riskSummary: buyNowRisk
  });

  // 3. Mua trả góp N tháng
  const validMonths = Math.max(1, installmentMonths);
  const feeRate = 1.0 + (installmentFeePercent / 100.0);
  const totalInstallment = Math.round(price * feeRate);
  const monthlyPayment = Math.round(totalInstallment / validMonths);
  const balanceAfterFirstMonth = currentLiquidCash - monthlyPayment;
  const isInstallmentAffordable = monthlySurplus > monthlyPayment && balanceAfterFirstMonth > 0;

  let installmentRisk = '';
  if (monthlyPayment > monthlySurplus) {
    installmentRisk = `RỦI RO: Tiền trả góp (${formatMoneyVnd(monthlyPayment)}/tháng) vượt quá mức thặng dư chi tiêu (${formatMoneyVnd(monthlySurplus)}/tháng)!`;
  } else {
    installmentRisk = `Áp lực vừa phải: Mỗi tháng trích ${formatMoneyVnd(monthlyPayment)} trong ${validMonths} tháng. Tổng tiền trả: ${formatMoneyVnd(totalInstallment)}.`;
  }

  options.push({
    optionName: `Trả góp (${validMonths} tháng)`,
    immediatePayment: monthlyPayment,
    monthlyPayment: monthlyPayment,
    totalPayment: totalInstallment,
    remainingBalanceAfterPayment: balanceAfterFirstMonth,
    isAffordable: isInstallmentAffordable,
    riskSummary: installmentRisk
  });

  // 4. Tích lũy trước rồi mua (Save first)
  const effectiveMonthlySavings = monthlySurplus > 0 ? monthlySurplus : 500000;
  const monthsNeeded = Math.max(1, Math.ceil(price / effectiveMonthlySavings));

  options.push({
    optionName: 'Tích lũy trước rồi mua',
    immediatePayment: 0,
    monthlyPayment: effectiveMonthlySavings,
    totalPayment: price,
    remainingBalanceAfterPayment: currentLiquidCash,
    isAffordable: true,
    riskSummary: `Khuyên dùng: Để dành khoảng ${formatMoneyVnd(effectiveMonthlySavings)}/tháng. Sau ${monthsNeeded} tháng mua trọn vẹn, không chịu phí chuyển đổi.`
  });

  // Đưa ra khuyến nghị thông minh nhất
  let bestRecommendation = '';
  if (isBuyNowAffordable && balanceAfterBuyNow > 2000000) {
    bestRecommendation = 'Tài chính của bạn đủ mạnh để mua ngay trả thẳng mà không lo thiếu hụt dòng tiền sinh hoạt.';
  } else if (isInstallmentAffordable) {
    bestRecommendation = `Nếu thiết bị phục vụ công việc/học tập cấp thiết, phương án Trả góp ${validMonths} tháng là hợp lý nhất.`;
  } else {
    bestRecommendation = 'Khuyến nghị: Nên chọn "Tích lũy trước rồi mua" để tránh nguy cơ cạn kiệt tiền sinh hoạt.';
  }

  return {
    itemName,
    price,
    options,
    recommendation: bestRecommendation
  };
}

