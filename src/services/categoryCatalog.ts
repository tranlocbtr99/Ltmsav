import { CategoryType, TransactionType } from '../types';
export const categoryTypeFor = (type: TransactionType): CategoryType => type === 'income' ? 'income' : type === 'lend' ? 'lend' : 'expense';
export const CATEGORY_PRESETS: Record<CategoryType, {vi: string; en: string; iconName: string; color: string}[]> = {
  expense: [
    {vi:'Ăn uống',en:'Food',iconName:'Utensils',color:'#F59E0B'},
    {vi:'Di chuyển',en:'Transport',iconName:'Car',color:'#3B82F6'},
    {vi:'Mua sắm',en:'Shopping',iconName:'ShoppingBag',color:'#EC4899'},
    {vi:'Hóa đơn & Tiện ích',en:'Bills & utilities',iconName:'FileText',color:'#EF4444'},
    {vi:'Nhà cửa',en:'Housing',iconName:'Home',color:'#8B5CF6'},
    {vi:'Sức khỏe',en:'Health',iconName:'HeartPulse',color:'#10B981'},
    {vi:'Giáo dục',en:'Education',iconName:'GraduationCap',color:'#6366F1'},
    {vi:'Giải trí',en:'Entertainment',iconName:'Tv',color:'#06B6D4'}
  ],
  income: [
    {vi:'Lương',en:'Salary',iconName:'Briefcase',color:'#10B981'},
    {vi:'Thưởng',en:'Bonus',iconName:'Award',color:'#F59E0B'},
    {vi:'Đầu tư & Sinh lời',en:'Investment',iconName:'TrendingUp',color:'#06B6D4'},
    {vi:'Kinh doanh',en:'Business',iconName:'Store',color:'#3B82F6'},
    {vi:'Thu nhập khác',en:'Other income',iconName:'Coins',color:'#8B5CF6'}
  ],
  lend: [
    {vi:'Gia đình',en:'Family',iconName:'Home',color:'#8B5CF6'},
    {vi:'Bạn bè',en:'Friends',iconName:'Users',color:'#3B82F6'},
    {vi:'Đồng nghiệp',en:'Colleagues',iconName:'Briefcase',color:'#06B6D4'},
    {vi:'Cho vay kinh doanh',en:'Business loan',iconName:'Store',color:'#10B981'},
    {vi:'Cho vay khác',en:'Other loan',iconName:'HandCoins',color:'#F59E0B'}
  ]
};
