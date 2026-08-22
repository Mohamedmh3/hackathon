export interface DashboardOverview {
  totalPlayers: number;
  totalClubs: number;
  activeContracts: number;
  contractsExpiringSoon: number;
}

export interface LabeledCount {
  key: string;
  label: string;
  count: number;
}
