import type { UserRole } from '../types/domain'

export interface DashboardKpi {
  id: string
  label: string
  value: number
  trend: string
}

export interface ExpiringContract {
  id: string
  playerName: string
  clubName: string
  endDate: string
}

export interface DashboardShortcut {
  id: string
  label: string
  description: string
  path: string
}

interface DashboardDataset {
  title: string
  description: string
  kpis: DashboardKpi[]
  expiringContracts: ExpiringContract[]
}

export const DASHBOARD_DATA_BY_ROLE: Record<'admin' | 'club_staff', DashboardDataset> = {
  admin: {
    title: 'لوحة تحكم الوزارة',
    description:
      'متابعة اللاعبين والتعاقدات وجاهزية الانتقالات على مستوى جميع الأندية.',
    kpis: [
      { id: 'kpi-players', label: 'إجمالي اللاعبين', value: 1480, trend: '+42 هذا الشهر' },
      { id: 'kpi-active-contracts', label: 'العقود النشطة', value: 1274, trend: '+18 هذا الأسبوع' },
      { id: 'kpi-free-players', label: 'اللاعبون المتاحون', value: 83, trend: '-5 هذا الأسبوع' },
      { id: 'kpi-transfers', label: 'الانتقالات هذا الشهر', value: 26, trend: '+7 مقارنة بالشهر الماضي' },
    ],
    expiringContracts: [
      { id: 'contract-1', playerName: 'Karim Hassan', clubName: 'Al Ahly Club', endDate: '2026-09-03' },
      { id: 'contract-2', playerName: 'Mariam Adel', clubName: 'Al Ahly Club', endDate: '2026-09-09' },
      { id: 'contract-3', playerName: 'Youssef Salah', clubName: 'Zamalek Club', endDate: '2026-09-18' },
      { id: 'contract-4', playerName: 'Omar Nabil', clubName: 'Alex Sharks', endDate: '2026-09-20' },
    ],
  },
  club_staff: {
    title: 'لوحة عمليات النادي',
    description:
      'متابعة قائمة لاعبي النادي والعقود التي تحتاج تجديداً أو قرار انتقال قريباً.',
    kpis: [
      { id: 'kpi-club-players', label: 'لاعبو النادي', value: 132, trend: '+4 هذا الشهر' },
      { id: 'kpi-club-contracts', label: 'العقود النشطة', value: 117, trend: '+1 هذا الأسبوع' },
      { id: 'kpi-club-free', label: 'اللاعبون المتاحون', value: 6, trend: '+1 هذا الأسبوع' },
      { id: 'kpi-club-achievements', label: 'الإنجازات المضافة', value: 14, trend: '+3 هذا الشهر' },
    ],
    expiringContracts: [
      { id: 'contract-5', playerName: 'Hana Sherif', clubName: 'Your Club', endDate: '2026-09-01' },
      { id: 'contract-6', playerName: 'Ali Mostafa', clubName: 'Your Club', endDate: '2026-09-11' },
      { id: 'contract-7', playerName: 'Nour El Din', clubName: 'Your Club', endDate: '2026-09-16' },
    ],
  },
}

export const DASHBOARD_SHORTCUTS: DashboardShortcut[] = [
  {
    id: 'shortcut-players',
    label: 'إدارة اللاعبين',
    description: 'إدارة ملفات اللاعبين وتغييرات الحالة وأهلية الانتقال.',
    path: '/players',
  },
  {
    id: 'shortcut-clubs',
    label: 'الأندية والألعاب',
    description: 'تحديث الأندية وروابط الألعاب من مكان واحد.',
    path: '/clubs',
  },
  {
    id: 'shortcut-contracts',
    label: 'التعاقدات والانتقالات',
    description: 'فتح العقود وإغلاقها وتنفيذ انتقالات اللاعبين.',
    path: '/contracts',
  },
]

export function hasAdminDashboardAccess(role: UserRole): role is 'admin' | 'club_staff' {
  return role === 'admin' || role === 'club_staff'
}
