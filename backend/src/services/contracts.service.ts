import { supabase } from "../lib/supabase";
import { Contract, ContractStatus } from "../types/contract";
import { HttpError } from "../utils/httpError";

interface ListContractsOptions {
  playerId?: string;
  clubId?: string;
  status?: ContractStatus;
}

interface CreateContractInput {
  playerId: string;
  clubId: string;
  startDate: string;
  endDate: string;
  notes: string | null;
  createdBy: string;
}

interface UpdateContractInput {
  startDate?: string;
  endDate?: string;
  notes?: string | null;
}

interface CloseContractInput {
  status: Exclude<ContractStatus, "active">;
  terminationReason: string;
  notes?: string | null;
}

interface TransferContractInput {
  playerId: string;
  toClubId: string;
  newStartDate: string;
  newEndDate: string;
  terminationReason: string;
  transferNotes: string | null;
  enrollmentDate: string | null;
  changedBy: string;
}

export interface TransferContractResult {
  old_contract_id: string;
  new_contract_id: string;
  player_id: string;
  from_club_id: string;
  to_club_id: string;
}

const contractSelectFields =
  "id, player_id, club_id, start_date, end_date, status, termination_reason, notes, created_by, created_at";

export const getContractById = async (contractId: string): Promise<Contract> => {
  const { data, error } = await supabase
    .from("contracts")
    .select(contractSelectFields)
    .eq("id", contractId)
    .single();

  if (error || !data) {
    throw new HttpError(404, "Contract not found");
  }

  return data as Contract;
};

export const listContracts = async (options: ListContractsOptions): Promise<Contract[]> => {
  let query = supabase.from("contracts").select(contractSelectFields).order("created_at", { ascending: false });

  if (options.playerId) {
    query = query.eq("player_id", options.playerId);
  }
  if (options.clubId) {
    query = query.eq("club_id", options.clubId);
  }
  if (options.status) {
    query = query.eq("status", options.status);
  }

  const { data, error } = await query;
  if (error) {
    throw new HttpError(500, error.message);
  }

  return (data ?? []) as Contract[];
};

export const createContract = async (input: CreateContractInput): Promise<Contract> => {
  const { data: activeContract, error: activeContractError } = await supabase
    .from("contracts")
    .select("id")
    .eq("player_id", input.playerId)
    .eq("status", "active")
    .maybeSingle();

  if (activeContractError) {
    throw new HttpError(500, activeContractError.message);
  }

  if (activeContract) {
    throw new HttpError(409, "Player already has an active contract");
  }

  const { data, error } = await supabase
    .from("contracts")
    .insert({
      player_id: input.playerId,
      club_id: input.clubId,
      start_date: input.startDate,
      end_date: input.endDate,
      status: "active",
      notes: input.notes,
      created_by: input.createdBy
    })
    .select(contractSelectFields)
    .single();

  if (error || !data) {
    throw new HttpError(400, error?.message ?? "Failed to create contract");
  }

  return data as Contract;
};

export const updateContract = async (contractId: string, input: UpdateContractInput): Promise<Contract> => {
  const payload: { start_date?: string; end_date?: string; notes?: string | null } = {};
  if (input.startDate !== undefined) payload.start_date = input.startDate;
  if (input.endDate !== undefined) payload.end_date = input.endDate;
  if (input.notes !== undefined) payload.notes = input.notes;

  const { data, error } = await supabase
    .from("contracts")
    .update(payload)
    .eq("id", contractId)
    .select(contractSelectFields)
    .single();

  if (error || !data) {
    throw new HttpError(400, error?.message ?? "Failed to update contract");
  }

  return data as Contract;
};

export const closeContract = async (contractId: string, input: CloseContractInput): Promise<Contract> => {
  const currentContract = await getContractById(contractId);
  if (currentContract.status !== "active") {
    throw new HttpError(409, "Only active contracts can be closed");
  }

  const { data, error } = await supabase
    .from("contracts")
    .update({
      status: input.status,
      termination_reason: input.terminationReason,
      notes: input.notes ?? currentContract.notes
    })
    .eq("id", contractId)
    .select(contractSelectFields)
    .single();

  if (error || !data) {
    throw new HttpError(400, error?.message ?? "Failed to close contract");
  }

  return data as Contract;
};

export const listExpiringContracts = async (clubId: string | undefined, days: number): Promise<Contract[]> => {
  const now = new Date();
  const limitDate = new Date(now);
  limitDate.setDate(now.getDate() + days);

  const startDate = now.toISOString().slice(0, 10);
  const endDate = limitDate.toISOString().slice(0, 10);

  let query = supabase
    .from("contracts")
    .select(contractSelectFields)
    .eq("status", "active")
    .gte("end_date", startDate)
    .lte("end_date", endDate)
    .order("end_date", { ascending: true });

  if (clubId) {
    query = query.eq("club_id", clubId);
  }

  const { data, error } = await query;
  if (error) {
    throw new HttpError(500, error.message);
  }

  return (data ?? []) as Contract[];
};

export const getActiveContractForPlayer = async (playerId: string): Promise<Contract | null> => {
  const { data, error } = await supabase
    .from("contracts")
    .select(contractSelectFields)
    .eq("player_id", playerId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new HttpError(500, error.message);
  }

  return (data as Contract | null) ?? null;
};

export const executePlayerTransfer = async (
  input: TransferContractInput
): Promise<TransferContractResult> => {
  const { data, error } = await supabase.rpc("execute_player_transfer", {
    p_player_id: input.playerId,
    p_to_club_id: input.toClubId,
    p_new_start_date: input.newStartDate,
    p_new_end_date: input.newEndDate,
    p_termination_reason: input.terminationReason,
    p_transition_notes: input.transferNotes,
    p_enrollment_date: input.enrollmentDate,
    p_changed_by: input.changedBy
  });

  if (error) {
    throw new HttpError(400, error.message);
  }

  const row = Array.isArray(data) ? data[0] : null;
  if (!row) {
    throw new HttpError(500, "Transfer did not return a result");
  }

  return row as TransferContractResult;
};
