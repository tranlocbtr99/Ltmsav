import React, { useState, useMemo } from 'react';
import { Account, RecurringRule, DebtOrLoan, AppSettings } from '../types';
import { simulatePurchase, formatMoneyVnd } from '../services/simulationEngine';
import { generateCashflowForecast, ForecastDay } from '../services/forecastEngine';
import { 
  TrendingUp, TrendingDown, AlertTriangle, ShieldCheck, 
  Sparkles, Calendar, ShoppingBag, ArrowRight, CheckCircle2,
  HelpCircle, ChevronRight, AlertCircle, RefreshCw
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
  const [simItemName, setSimItemName] = useState('Laptop / Điện thoại mới');
  const [simPriceInput, setSimPriceInput] = useState('15000000');
  const [simMonths, setSimMonths] = useState(6);

  const simResult = useMemo(() => {
    const rawPrice = parseFloat(simPriceInput.replace(/\D/g, '')) || 0;
    return simulatePurchase(
      simItemName.trim() || 'Mục tiêu mua sắm',
      rawPrice,
      availableBalance,
      monthlySurplus > 0 ? monthlySurplus : 1000000,
      simMonths,
      3.0
    );
  }, [simItemName, simPriceInput, simMonths, availableBalance, monthlySurplus]);

  return (
    <div className="space-y-4 pb-20 max-w-3xl mx-auto">
      {/* Sub-tab navigation */}
      <div className="silver-segments" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeSubTab === 'forecast'}
          onClick={() => setActiveSubTab('forecast')}
          className="flex items-center justify-center gap-1.5 text-xs py-2"
        >
          <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
          <span>{t('cashflowForecastTitle') || 'Dự báo dòng tiền 30 ngày'}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeSubTab === 'simulation'}
          onClick={() => setActiveSubTab('simulation')}
          className="flex items-center justify-center gap-1.5 text-xs py-2"
        >
          <ShoppingBag className="w-3.5 h-3.5 text-purple-500" />
          <span>{t('simulationTitle') || 'Mô phỏng mua sắm'}</span>
        </button>
      </div>

      {activeSubTab === 'forecast' ? (
        <div className="space-y-3.5">
          {/* Hero Forecast Summary Card */}
          <div className="glass-card p-4 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {t('projectedBalance30Days') || 'Dự báo số dư sau 30 ngày'}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                forecast.endBalance >= forecast.startBalance
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
              }`}>
                {forecast.endBalance >= forecast.startBalance ? '+ Tăng trưởng' : 'Giảm chi tiêu'}
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {formatMoneyVnd(forecast.endBalance)}
              </div>
              <div className="text-right text-xs">
                <span className="text-slate-400 text-[10px] block">Mức thấp nhất</span>
                <span className={`font-bold ${forecast.minBalance < 0 ? 'text-rose-500 font-extrabold' : 'text-slate-700 dark:text-slate-300'}`}>
                  {formatMoneyVnd(forecast.minBalance)}
                </span>
              </div>
            </div>

            {/* Inflow vs Outflow pill */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
              <div className="flex items-center gap-1.5 bg-emerald-500/5 dark:bg-emerald-500/10 p-2 rounded-xl">
                <TrendingUp className="w-4 h-4 text-emerald-500 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] text-slate-400">Dự kiến thu</div>
                  <div className="font-semibold text-emerald-600 dark:text-emerald-400 truncate">
                    +{formatMoneyVnd(forecast.totalInflow)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-rose-500/5 dark:bg-rose-500/10 p-2 rounded-xl">
                <TrendingDown className="w-4 h-4 text-rose-500 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] text-slate-400">Dự kiến chi</div>
                  <div className="font-semibold text-rose-600 dark:text-rose-400 truncate">
                    -{formatMoneyVnd(forecast.totalOutflow)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Shortage Alerts if any */}
          {forecast.alerts.length > 0 && (
            <div className="p-4 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 space-y-2">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>CẢNH BÁO THIẾU HỤT DÒNG TIỀN ({forecast.alerts.length} ngày rủi ro)</span>
              </div>
              <p className="text-[11px] text-rose-600 dark:text-rose-300/80">
                {forecast.alerts[0].reason}
              </p>
              <div className="bg-white/70 dark:bg-slate-900/80 p-2.5 rounded-xl space-y-1 text-[11px]">
                <div className="font-semibold text-slate-800 dark:text-slate-200">Gợi ý giải pháp ứng phó:</div>
                <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-0.5">
                  {forecast.alerts[0].solutions.map((sol, idx) => (
                    <li key={idx}>{sol}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Timeline of events (30 Days with events) */}
          <div className="glass-card p-4 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2.5">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
              <span>Lịch trình dòng tiền 30 ngày</span>
              <span className="text-[10px] text-slate-400 font-normal">Chỉ hiện ngày có biến động</span>
            </h3>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {forecast.dailyForecasts
                .filter(d => d.notes.length > 0 || d.inflow > 0 || d.outflow > 0)
                .map((day, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-2xl border text-xs flex items-center justify-between gap-2 transition ${
                      day.isShortage
                        ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/60'
                        : 'bg-slate-50/80 dark:bg-slate-900/50 border-slate-200/60 dark:border-slate-800/60'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{day.date}</span>
                        {day.isShortage && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500 text-white">
                            Thiếu hụt
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {day.notes.join(' • ')}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-bold text-slate-900 dark:text-white text-xs">
                        {formatMoneyVnd(day.projectedBalance)}
                      </div>
                      <div className="text-[10px]">
                        {day.inflow > 0 && <span className="text-emerald-500 mr-1">+{formatMoneyVnd(day.inflow)}</span>}
                        {day.outflow > 0 && <span className="text-rose-500">-{formatMoneyVnd(day.outflow)}</span>}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      ) : (
        /* Purchase Simulation View */
        <div className="space-y-3.5">
          <div className="glass-card p-4 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-purple-500" />
              <span>Thiết lập món đồ cần mua sắm</span>
            </h3>

            <div className="space-y-2.5">
              <div>
                <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                  Tên món đồ / Kế hoạch
                </label>
                <input
                  type="text"
                  value={simItemName}
                  onChange={(e) => setSimItemName(e.target.value)}
                  placeholder="Ví dụ: iPhone 16, Laptop, Xe máy..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                    Giá tiền (VND)
                  </label>
                  <input
                    type="number"
                    value={simPriceInput}
                    onChange={(e) => setSimPriceInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                    Kỳ hạn trả góp ({simMonths} tháng)
                  </label>
                  <select
                    value={simMonths}
                    onChange={(e) => setSimMonths(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value={3}>3 tháng</option>
                    <option value={6}>6 tháng</option>
                    <option value={9}>9 tháng</option>
                    <option value={12}>12 tháng</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Smart Advice Banner */}
            <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs space-y-1">
              <div className="font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Lời khuyên từ LTM AI:</span>
              </div>
              <p className="text-[11px] text-purple-900 dark:text-purple-200 leading-relaxed">
                {simResult.recommendation}
              </p>
            </div>
          </div>

          {/* 4 Comparison Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {simResult.options.map((opt, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-2xl border text-xs space-y-2 transition ${
                  opt.isAffordable
                    ? 'glass-card border-slate-200 dark:border-slate-800 hover:border-purple-500/40'
                    : 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white text-xs">
                    {opt.optionName}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                    opt.isAffordable
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  }`}>
                    {opt.isAffordable ? 'Khả thi' : 'Rủi ro'}
                  </span>
                </div>

                <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800/60 text-[11px]">
                  {opt.monthlyPayment > 0 && (
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span>Trả mỗi tháng:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {formatMoneyVnd(opt.monthlyPayment)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Tổng tiền chi:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {formatMoneyVnd(opt.totalPayment)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Số dư sau khi trả:</span>
                    <span className={`font-bold ${opt.remainingBalanceAfterPayment < 0 ? 'text-rose-500' : 'text-slate-800 dark:text-slate-200'}`}>
                      {formatMoneyVnd(opt.remainingBalanceAfterPayment)}
                    </span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-500 dark:text-slate-400 pt-1 leading-normal">
                  {opt.riskSummary}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
