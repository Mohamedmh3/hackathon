import { NextFunction, Request, Response } from "express";
import {
  closeContract,
  createContract,
  executePlayerTransfer,
  getActiveContractForPlayer,
  getContractById,
  listContracts,
  listExpiringContracts,
  updateContract
} from "../services/contracts.service";
import { getPlayerById } from "../services/players.service";
import { ContractStatus } from "../types/contract";
import { successResponse } from "../utils/apiResponse";
import { HttpError } from "../utils/httpError";
import {
  parseOptionalText,
  parsePositiveInt,
  parseRequiredDate,
  parseRequiredText,
  parseUuid
} from "../utils/validation";

type ClosedContractStatus = Exclude<ContractStatus, "active">;

const parseContractStatus = (value: unknown, fieldName = "status"): ContractStatus => {
  if (value === "active" || value === "expired" || value === "terminated" || value === "transferred") {
    return value;
  }
  throw new HttpError(400, `${fieldName} must be one of: active, expired, terminated, transferred`);
};

const parseClosedContractStatus = (value: unknown): ClosedContractStatus => {
  const status = parseContractStatus(value, "status");
  if (status === "active") {
    throw new HttpError(400, "status must be one of: expired, terminated, transferred");
  }
  return status;
};

const ensureStaffCanAccessClub = (req: Request, clubId: string): void => {
  if (!req.user) {
    throw new HttpError(401, "Unauthorized");
  }
  if (req.user.role === "club_staff" && req.user.clubId !== clubId) {
    throw new HttpError(403, "Forbidden");
  }
};

const ensureStaffCanAccessContract = async (req: Request, contractId: string): Promise<void> => {
  if (!req.user) {
    throw new HttpError(401, "Unauthorized");
  }

  if (req.user.role !== "club_staff") {
    return;
  }

  const contract = await getContractById(contractId);
  if (!req.user.clubId || req.user.clubId !== contract.club_id) {
    throw new HttpError(403, "Forbidden");
  }
};

const ensureStaffCanAccessPlayer = async (req: Request, playerId: string): Promise<void> => {
  if (!req.user) {
    throw new HttpError(401, "Unauthorized");
  }

  if (req.user.role !== "club_staff") {
    return;
  }

  const player = await getPlayerById(playerId);
  if (!req.user.clubId || req.user.clubId !== player.current_club_id) {
    throw new HttpError(403, "Forbidden");
  }
};

export const getContracts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new HttpError(401, "Unauthorized");
    }

    const playerId = req.query.playerId === undefined ? undefined : parseUuid(req.query.playerId, "playerId");
    const status =
      req.query.status === undefined ? undefined : parseContractStatus(req.query.status, "status");

    let clubId = req.query.clubId === undefined ? undefined : parseUuid(req.query.clubId, "clubId");
    if (req.user.role === "club_staff") {
      if (!req.user.clubId) {
        throw new HttpError(403, "Forbidden");
      }
      clubId = req.user.clubId;
    }

    const contracts = await listContracts({
      playerId,
      clubId,
      status
    });

    res.status(200).json(successResponse(contracts));
  } catch (error) {
    next(error);
  }
};

export const postContract = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new HttpError(401, "Unauthorized");
    }

    const playerId = parseUuid(req.body?.playerId, "playerId");
    let clubId = parseUuid(req.body?.clubId, "clubId");
    const startDate = parseRequiredDate(req.body?.startDate, "startDate");
    const endDate = parseRequiredDate(req.body?.endDate, "endDate");
    const notes = parseOptionalText(req.body?.notes, "notes", 1000);

    if (endDate < startDate) {
      throw new HttpError(400, "endDate must be greater than or equal to startDate");
    }

    if (req.user.role === "club_staff") {
      if (!req.user.clubId) {
        throw new HttpError(403, "Forbidden");
      }
      if (clubId !== req.user.clubId) {
        throw new HttpError(403, "club_staff can only create contracts for their own club");
      }
      await ensureStaffCanAccessPlayer(req, playerId);
      clubId = req.user.clubId;
    }

    const contract = await createContract({
      playerId,
      clubId,
      startDate,
      endDate,
      notes,
      createdBy: req.user.id
    });

    res.status(201).json(successResponse(contract));
  } catch (error) {
    next(error);
  }
};

export const patchContract = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const contractId = parseUuid(req.params.id, "id");
    await ensureStaffCanAccessContract(req, contractId);
    const existingContract = await getContractById(contractId);

    const startDate = req.body?.startDate === undefined ? undefined : parseRequiredDate(req.body.startDate, "startDate");
    const endDate = req.body?.endDate === undefined ? undefined : parseRequiredDate(req.body.endDate, "endDate");
    const notes = req.body?.notes === undefined ? undefined : parseOptionalText(req.body.notes, "notes", 1000);

    const finalStartDate = startDate ?? existingContract.start_date;
    const finalEndDate = endDate ?? existingContract.end_date;
    if (finalEndDate < finalStartDate) {
      throw new HttpError(400, "endDate must be greater than or equal to startDate");
    }

    if (startDate === undefined && endDate === undefined && notes === undefined) {
      throw new HttpError(400, "At least one field is required: startDate, endDate, notes");
    }

    const contract = await updateContract(contractId, {
      startDate,
      endDate,
      notes
    });

    res.status(200).json(successResponse(contract));
  } catch (error) {
    next(error);
  }
};

export const patchCloseContract = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const contractId = parseUuid(req.params.id, "id");
    await ensureStaffCanAccessContract(req, contractId);

    const status = parseClosedContractStatus(req.body?.status);
    const terminationReason = parseRequiredText(req.body?.terminationReason, "terminationReason", 3, 500);
    const notes = req.body?.notes === undefined ? undefined : parseOptionalText(req.body.notes, "notes", 1000);

    const contract = await closeContract(contractId, {
      status,
      terminationReason,
      notes
    });

    res.status(200).json(successResponse(contract));
  } catch (error) {
    next(error);
  }
};

export const getExpiringContracts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new HttpError(401, "Unauthorized");
    }

    const days = parsePositiveInt(req.query.days, "days", 30, 365);

    let clubId = req.query.clubId === undefined ? undefined : parseUuid(req.query.clubId, "clubId");
    if (req.user.role === "club_staff") {
      if (!req.user.clubId) {
        throw new HttpError(403, "Forbidden");
      }
      clubId = req.user.clubId;
    } else if (clubId) {
      ensureStaffCanAccessClub(req, clubId);
    }

    const contracts = await listExpiringContracts(clubId, days);
    res.status(200).json(successResponse(contracts));
  } catch (error) {
    next(error);
  }
};

export const getMyActiveContract = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user || req.user.role !== "player" || !req.user.playerId) {
      throw new HttpError(403, "Forbidden");
    }

    const contract = await getActiveContractForPlayer(req.user.playerId);
    res.status(200).json(successResponse(contract));
  } catch (error) {
    next(error);
  }
};

export const postTransferContract = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new HttpError(401, "Unauthorized");
    }

    const playerId = parseUuid(req.body?.playerId, "playerId");
    const toClubId = parseUuid(req.body?.toClubId, "toClubId");
    const newStartDate = parseRequiredDate(req.body?.newStartDate, "newStartDate");
    const newEndDate = parseRequiredDate(req.body?.newEndDate, "newEndDate");
    const terminationReason = parseRequiredText(req.body?.terminationReason, "terminationReason", 3, 500);
    const transferNotes = parseOptionalText(req.body?.transferNotes, "transferNotes", 1000);
    const enrollmentDate = req.body?.enrollmentDate === undefined
      ? null
      : parseRequiredDate(req.body?.enrollmentDate, "enrollmentDate");

    if (newEndDate < newStartDate) {
      throw new HttpError(400, "newEndDate must be greater than or equal to newStartDate");
    }

    const activeContract = await getActiveContractForPlayer(playerId);
    if (!activeContract) {
      throw new HttpError(409, "Player has no active contract to transfer");
    }

    if (activeContract.club_id === toClubId) {
      throw new HttpError(409, "Destination club must be different from current club");
    }

    if (req.user.role === "club_staff") {
      if (!req.user.clubId) {
        throw new HttpError(403, "Forbidden");
      }

      const staffClubId = req.user.clubId;
      if (staffClubId !== activeContract.club_id && staffClubId !== toClubId) {
        throw new HttpError(403, "club_staff can transfer only when their club is source or destination");
      }
    }

    const result = await executePlayerTransfer({
      playerId,
      toClubId,
      newStartDate,
      newEndDate,
      terminationReason,
      transferNotes,
      enrollmentDate,
      changedBy: req.user.id
    });

    res.status(200).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};
