import { TierKeys, DayStatus } from '@/types'
import { red, gold, blue, green, purple, geekblue } from '@ant-design/colors';

export const Tier: Record<TierKeys, number> = {
  Manager: 1,
  DayManager: 2,
  Upper: 3,
  Middle: 4,
  Junior: 5,
};

export const Tiers = [Tier.Manager, Tier.DayManager, Tier.Upper, Tier.Middle, Tier.Junior];

export const TierNameMap: { [key: number]: string } = {
  [Tier.Manager]: '店長クラス',
  [Tier.DayManager]: '当日責任者',
  [Tier.Upper]: '優秀層',
  [Tier.Middle]: '一般層',
  [Tier.Junior]: '新人層',
};

export const TierColorMap: Record<number, string[]> = {
  [Tier.Manager]: red,
  [Tier.DayManager]: gold,
  [Tier.Upper]: blue,
  [Tier.Middle]: green,
  [Tier.Junior]: purple,
};

export const DayStatusColorMap: Record<DayStatus, string[]> = {
  closed: geekblue,
  busy: red,
};
