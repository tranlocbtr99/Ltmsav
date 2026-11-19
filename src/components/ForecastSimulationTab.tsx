import React, { useState, useMemo } from 'react';
import { Account, RecurringRule, DebtOrLoan, AppSettings } from '../types';
import { simulatePurchase, formatMoneyVnd } from '../services/simulationEngine';
import { generateCashflowForecast, ForecastDay } from '../services/forecastEngine';
import { 
  TrendingUp, TrendingDown, AlertTriangle, ShieldCheck, 
  Sparkles, Calendar, ShoppingBag, ArrowRight, CheckCircle2,
  HelpCircle, ChevronRight, AlertCircle, RefreshCw, Banknote,
  PiggyBank, ShieldAlert, Clock, Percent, DollarSign, Wallet,
  CreditCard
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ForecastSimulationTabProps {
  accounts: Account[];
  recurringRules: RecurringRule[];
  debts: DebtOrLoan[];
  settings: AppSettings;
}

export const ForecastSimulationTab: React.FC<ForecastSimulationTabProps> = ({
  accounts,
  recurringRules,
  debts,
  settings
}) => {
  const { t } = useLanguage();
  const [activeSubTab, setActiveSubTab] = useState<'forecast' | 'simulation'>('forecast');

  // Tính toán số dư khả dụng và thặng dư chi tiêu hàng tháng
  const { availableBalance, totalBalance, monthlySurplus } = useMemo(() => {
    let total = 0;
    let savings = 0;
    accounts.forEach(acc => {
      total += acc.balance;
      if (acc.type === 'savings') savings += acc.balance;
    });
    const avail = total - savings;

    // Ước tính thặng dư thu - chi trung bình mỗi tháng
    const userProfile = settings.userProfile || {};
    const baseIncome = (userProfile.monthlyAllowance || 0) + (userProfile.partTimeIncome || 0);
    let recurringIn = 0;
    let recurringOut = 0;
    recurringRules.forEach(r => {
      const mul = r.frequency === 'weekly' ? 4.3 : 1;
      if (r.type === 'income') recurringIn += r.amount * mul;
      else recurringOut += r.amount * mul;
    });

    const estIncome = baseIncome > 0 ? baseIncome + recurringIn : Math.max(3000000, recurringIn);
    const estOut = recurringOut > 0 ? recurringOut : 2000000;
    const surplus = Math.max(0, estIncome - estOut);

    return { availableBalance: avail, totalBalance: total, monthlySurplus: surplus };
  }, [accounts, recurringRules, settings]);

  // Forecast state
  const forecast = useMemo(() => {
    return generateCashflowForecast(
      availableBalance,
      settings.userProfile || {},
      recurringRules,
      debts,
      30
    );
  }, [availableBalance, settings.userProfile, recurringRules, debts]);

  // Simulation state
  const [simItemName, setSimItemName] = useState('Điện thoại / Laptop mới');
  const [simPriceInput, setSimPriceInput] = useState('18000000');
  const [simDownPaymentInput, setSimDownPaymentInput] = useState('0');
  const [simMonths, setSimMonths] = useState(6);
  const [simInterestRateInput, setSimInterestRateInput] = useState('0');

  const simResult = useMemo(() => {
    const rawPrice = parseFloat(simPriceInput.replace(/\D/g, '')) || 0;
    const downPayment = parseFloat(simDownPaymentInput.replace(/\D/g, '')) || 0;
    const interestRate = parseFloat(simInterestRateInput) || 0;

    return simulatePurchase(
      simItemName.trim() || 'Mục tiêu mua sắm',
      rawPrice,
      availableBalance,
      monthlySurplus > 0 ? monthlySurplus : 1500000,
      simMonths,
      downPayment,
      interestRate
    );
  }, [simItemName, simPriceInput, simDownPaymentInput, simMonths, simInterestRateInput, availableBalance, monthlySurplus]);

  const rawPriceNum = parseFloat(simPriceInput.replace(/\D/g, '')) || 0;

  return (
    <div className="space-y-4 pb-20 max-w-3xl mx-auto">
      {/* Sub-tab navigation */}
      <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveSubTab('forecast')}
          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition ${
            activeSubTab === 'forecast' 
              ? 'bg-blue-600 text-white shadow-sm font-bold' 
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>{t('cashflowForecastTitle') || 'Dự báo dòng tiền 30 ngày'}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('simulation')}
          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition ${
            activeSubTab === 'simulation' 
              ? 'bg-purple-600 text-white shadow-sm font-bold' 
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>{t('simulationTitle') || 'Mô phỏng mua sắm'}</span>
        </button>
      </div>

      {activeSubTab === 'forecast' ? (
        <div className="space-y-3.5">
          {/* Hero Forecast Summary Card */}
          <div className="glass-card p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3.5 bg-gradient-to-br from-blue-500/5 via-transparent to-emerald-500/5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t('projectedBalance30Days') || 'Dự báo số dư sau 30 ngày'}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                forecast.endBalance >= forecast.startBalance
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
              }`}>
                {forecast.endBalance >= forecast.startBalance ? '+ Tăng trưởng số dư' : 'Có áp lực chi tiêu'}
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {formatMoneyVnd(forecast.endBalance)}
              </div>
              <div className="text-right text-xs">
                <span className="text-slate-400 text-[10px] block font-medium">Mức thấp nhất</span>
                <span className={`font-extrabold text-sm ${forecast.minBalance < 0 ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}`}>
                  {formatMoneyVnd(forecast.minBalance)}
                </span>
              </div>
            </div>

            {/* Inflow vs Outflow pill */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
              <div className="flex items-center gap-2 bg-emerald-500/10 dark:bg-emerald-500/15 p-2.5 rounded-2xl border border-emerald-500/20">
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Dự kiến thu (+30 ngày)</div>
                  <div className="font-extrabold text-emerald-600 dark:text-emerald-400 truncate">
                    +{formatMoneyVnd(forecast.totalInflow)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-rose-500/10 dark:bg-rose-500/15 p-2.5 rounded-2xl border border-rose-500/20">
                <TrendingDown className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Dự kiến chi (+30 ngày)</div>
                  <div className="font-extrabold text-rose-600 dark:text-rose-400 truncate">
                    -{formatMoneyVnd(forecast.totalOutflow)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Shortage Alerts if any */}
          {forecast.alerts.length > 0 && (
            <div className="p-4 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 space-y-2.5">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-extrabold text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>CẢNH BÁO THIẾU HỤT DÒNG TIỀN ({forecast.alerts.length} ngày rủi ro)</span>
              </div>
              <p className="text-[11px] text-rose-600 dark:text-rose-300/90 leading-relaxed">
                {forecast.alerts[0].reason}
              </p>
              <div className="bg-white/80 dark:bg-slate-900/90 p-3 rounded-2xl space-y-1.5 text-[11px] border border-rose-200/50">
                <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Gợi ý giải pháp ứng phó:</span>
                </div>
                <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-1">
                  {forecast.alerts[0].solutions.map((sol, idx) => (
                    <li key={idx}>{sol}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Timeline of events (30 Days with events) */}
          <div className="glass-card p-4 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span>Lịch trình dòng tiền 30 ngày tới</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-medium">Chỉ hiện ngày có biến động</span>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {forecast.dailyForecasts
                .filter(d => d.notes.length > 0 || d.inflow > 0 || d.outflow > 0)
                .map((day, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-2xl border text-xs flex items-center justify-between gap-3 transition ${
                      day.isShortage
                        ? 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800/80'
                        : 'bg-slate-50/80 dark:bg-slate-900/50 border-slate-200/60 dark:border-slate-800/60'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 dark:text-slate-100">{day.date}</span>
                        {day.isShortage && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500 text-white shadow-sm">
                            Thiếu hụt
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {day.notes.join(' • ')}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-black text-slate-900 dark:text-white text-xs">
                        {formatMoneyVnd(day.projectedBalance)}
                      </div>
                      <div className="text-[10px] font-semibold">
                        {day.inflow > 0 && <span className="text-emerald-500 mr-1.5">+{formatMoneyVnd(day.inflow)}</span>}
                        {day.outflow > 0 && <span className="text-rose-500">-{formatMoneyVnd(day.outflow)}</span>}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      ) : (
        /* Purchase Simulation View (Mô phỏng mua sắm chi tiết) */
        <div className="space-y-4">
          <div className="glass-card p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span>Thiết lập món đồ cần mua</span>
              </h3>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Thặng dư hàng tháng: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{formatMoneyVnd(monthlySurplus)}</strong>
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  Tên sản phẩm / Kế hoạch
                </label>
                <input
                  type="text"
                  value={simItemName}
                  onChange={(e) => setSimItemName(e.target.value)}
                  placeholder="Ví dụ: iPhone 16 Pro Max, Laptop Gaming, Xe máy..."
                  className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    Giá niêm yết (VND)
                  </label>
                  <input
                    type="text"
                    value={rawPriceNum ? rawPriceNum.toLocaleString('vi-VN') : ''}
                    onChange={(e) => setSimPriceInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="18.000.000"
                    className="w-full px-3.5 py-2.5 text-xs font-black rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 tabular-nums"
                  />
                  {/* Preset price buttons */}
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {[5000000, 10000000, 20000000, 35000000].map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setSimPriceInput(p.toString())}
                        className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-purple-500 hover:text-white transition"
                      >
                        {formatMoneyVnd(p)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    Số tiền trả trước (Down payment)
                  </label>
                  <input
                    type="text"
                    value={simDownPaymentInput ? parseInt(simDownPaymentInput.replace(/\D/g, '') || '0', 10).toLocaleString('vi-VN') : '0'}
                    onChange={(e) => setSimDownPaymentInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 text-xs font-bold rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 tabular-nums"
                  />
                  {/* Quick percentage buttons */}
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {[0, 20, 30, 50].map(pct => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setSimDownPaymentInput(Math.round((rawPriceNum * pct) / 100).toString())}
                        className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-purple-500 hover:text-white transition"
                      >
                        {pct}% ({formatMoneyVnd(Math.round((rawPriceNum * pct) / 100))})
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Installment Term & Interest Rate */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    Kỳ hạn trả góp: <strong className="text-purple-600 dark:text-purple-400">{simMonths} tháng</strong>
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[3, 6, 9, 12, 24].map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setSimMonths(m)}
                        className={`py-1.5 text-xs font-bold rounded-xl transition ${
                          simMonths === m
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-purple-400'
                        }`}
                      >
                        {m}T
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    Lãi suất trả góp (%/năm)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={simInterestRateInput}
                    onChange={(e) => setSimInterestRateInput(e.target.value)}
                    placeholder="0"
                    className="w-full px-3.5 py-2 text-xs font-bold rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 tabular-nums"
                  />
                  <div className="flex gap-2 text-[10px] text-slate-400 mt-1">
                    <span onClick={() => setSimInterestRateInput('0')} className="cursor-pointer hover:text-purple-500 underline">0% (Trả góp thẻ tín dụng 0%)</span>
                    <span onClick={() => setSimInterestRateInput('18')} className="cursor-pointer hover:text-purple-500 underline">18% (Vay tiêu dùng)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Smart Advice Banner from AI Engine */}
            <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs space-y-1.5">
              <div className="font-extrabold text-purple-700 dark:text-purple-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" />
                <span>Nhận định & Khuyến nghị từ LTM AI:</span>
              </div>
              <p className="text-[11px] text-purple-950 dark:text-purple-200 leading-relaxed font-medium">
                {simResult.recommendation}
              </p>
            </div>
          </div>

          {/* 4 Detailed Comparison Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {simResult.options.map((opt, idx) => {
              const isPayInFull = opt.type === 'buy_now';
              const isInstallment = opt.type === 'installment';
              const isSaveFirst = opt.type === 'save_first';
              const isDontBuy = opt.type === 'skip';

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-3xl border text-xs space-y-3 transition shadow-sm ${
                    opt.isAffordable
                      ? 'glass-card border-slate-200 dark:border-slate-800 hover:border-purple-500/50'
                      : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isPayInFull && <Banknote className="w-4 h-4 text-emerald-500" />}
                      {isInstallment && <CreditCard className="w-4 h-4 text-purple-500" />}
                      {isSaveFirst && <PiggyBank className="w-4 h-4 text-blue-500" />}
                      {isDontBuy && <ShieldCheck className="w-4 h-4 text-slate-500" />}
                      <span className="font-extrabold text-slate-900 dark:text-white text-xs">
                        {opt.optionName}
                      </span>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      opt.isAffordable
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                    }`}>
                      {opt.isAffordable ? 'Khả thi' : 'Rủi ro'}
                    </span>
                  </div>

                  {/* Key Financial Numbers */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px]">
                    {opt.monthlyPayment > 0 && (
                      <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                        <span>Đóng mỗi tháng:</span>
                        <strong className="text-slate-900 dark:text-white font-bold">
                          {formatMoneyVnd(opt.monthlyPayment)} ({opt.monthsCount} tháng)
                        </strong>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                      <span>Tổng tiền chi thực tế:</span>
                      <strong className="text-slate-900 dark:text-white font-extrabold text-xs">
                        {formatMoneyVnd(opt.totalPayment)}
                      </strong>
                    </div>

                    {opt.interestAndFees > 0 && (
                      <div className="flex justify-between items-center text-amber-600 dark:text-amber-400 font-semibold">
                        <span>Chênh lệch lãi & phí:</span>
                        <span>+{formatMoneyVnd(opt.interestAndFees)}</span>
                      </div>
                    )}

                    {opt.debtBurdenRatio > 0 && (
                      <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                        <span>Tỷ lệ chiếm thặng dư:</span>
                        <span className={`font-bold ${opt.debtBurdenRatio > 50 ? 'text-rose-500' : 'text-emerald-500'}`}>
                          {opt.debtBurdenRatio}% thặng dư/tháng
                        </span>
                      </div>
                    )}

                    {opt.remainingBalanceAfterPayment !== 0 && (
                      <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                        <span>Số dư còn lại sau thanh toán:</span>
                        <span className={`font-bold ${opt.remainingBalanceAfterPayment < 0 ? 'text-rose-500 font-extrabold' : 'text-slate-900 dark:text-slate-200'}`}>
                          {formatMoneyVnd(opt.remainingBalanceAfterPayment)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Summary commentary */}
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800/60 leading-relaxed font-medium">
                    {opt.riskSummary}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
