export type ContractStatus = "active" | "expired" | "terminated" | "transferred";

export interface Contract {
  id: string;
  player_id: string;
  club_id: string;
  start_date: string;
  end_date: string;
  status: ContractStatus;
  termination_reason: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}
