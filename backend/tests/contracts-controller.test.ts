import { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getContracts,
  getMyActiveContract,
  patchCloseContract,
  postTransferContract,
  postContract
} from "../src/controllers/contracts.controller";

const listContractsMock = vi.fn();
const createContractMock = vi.fn();
const getContractByIdMock = vi.fn();
const closeContractMock = vi.fn();
const getActiveContractForPlayerMock = vi.fn();
const executePlayerTransferMock = vi.fn();
const getPlayerByIdMock = vi.fn();

vi.mock("../src/services/contracts.service", () => ({
  listContracts: (...args: unknown[]) => listContractsMock(...args),
  createContract: (...args: unknown[]) => createContractMock(...args),
  getContractById: (...args: unknown[]) => getContractByIdMock(...args),
  closeContract: (...args: unknown[]) => closeContractMock(...args),
  updateContract: vi.fn(),
  listExpiringContracts: vi.fn(),
  getActiveContractForPlayer: (...args: unknown[]) => getActiveContractForPlayerMock(...args),
  executePlayerTransfer: (...args: unknown[]) => executePlayerTransferMock(...args)
}));

vi.mock("../src/services/players.service", () => ({
  getPlayerById: (...args: unknown[]) => getPlayerByIdMock(...args)
}));

const createResponse = (): Response => {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe("contracts controller", () => {
  beforeEach(() => {
    listContractsMock.mockReset();
    createContractMock.mockReset();
    getContractByIdMock.mockReset();
    closeContractMock.mockReset();
    getActiveContractForPlayerMock.mockReset();
    executePlayerTransferMock.mockReset();
    getPlayerByIdMock.mockReset();
  });

  it("forces club staff to list contracts for their own club", async () => {
    listContractsMock.mockResolvedValue([]);
    const req = {
      query: {
        clubId: "123e4567-e89b-42d3-a456-556642440000"
      },
      user: {
        id: "u-1",
        email: "staff@example.com",
        role: "club_staff",
        clubId: "123e4567-e89b-42d3-a456-556642440001",
        playerId: null
      }
    } as unknown as Request;
    const res = createResponse();
    const next = vi.fn() as unknown as NextFunction;

    await getContracts(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(listContractsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        clubId: "123e4567-e89b-42d3-a456-556642440001"
      })
    );
  });

  it("blocks club staff from creating contract for another club", async () => {
    const req = {
      body: {
        playerId: "123e4567-e89b-42d3-a456-556642440111",
        clubId: "123e4567-e89b-42d3-a456-556642440000",
        startDate: "2026-01-01",
        endDate: "2026-12-31"
      },
      user: {
        id: "u-1",
        email: "staff@example.com",
        role: "club_staff",
        clubId: "123e4567-e89b-42d3-a456-556642440001",
        playerId: null
      }
    } as unknown as Request;
    const res = createResponse();
    const next = vi.fn() as unknown as NextFunction;

    await postContract(req, res, next);

    expect(createContractMock).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("allows closing contract with non-active target status", async () => {
    getContractByIdMock.mockResolvedValue({
      id: "123e4567-e89b-42d3-a456-556642440900",
      club_id: "123e4567-e89b-42d3-a456-556642440001"
    });
    closeContractMock.mockResolvedValue({
      id: "123e4567-e89b-42d3-a456-556642440900",
      status: "terminated"
    });

    const req = {
      params: { id: "123e4567-e89b-42d3-a456-556642440900" },
      body: {
        status: "terminated",
        terminationReason: "Mutual agreement"
      },
      user: {
        id: "u-1",
        email: "staff@example.com",
        role: "club_staff",
        clubId: "123e4567-e89b-42d3-a456-556642440001",
        playerId: null
      }
    } as unknown as Request;
    const res = createResponse();
    const next = vi.fn() as unknown as NextFunction;

    await patchCloseContract(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(closeContractMock).toHaveBeenCalledWith("123e4567-e89b-42d3-a456-556642440900", {
      status: "terminated",
      terminationReason: "Mutual agreement",
      notes: undefined
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("returns active contract for player user", async () => {
    getActiveContractForPlayerMock.mockResolvedValue({
      id: "123e4567-e89b-42d3-a456-556642440444",
      status: "active"
    });

    const req = {
      user: {
        id: "u-player",
        email: "player@example.com",
        role: "player",
        clubId: null,
        playerId: "123e4567-e89b-42d3-a456-556642440111"
      }
    } as unknown as Request;
    const res = createResponse();
    const next = vi.fn() as unknown as NextFunction;

    await getMyActiveContract(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(getActiveContractForPlayerMock).toHaveBeenCalledWith("123e4567-e89b-42d3-a456-556642440111");
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("blocks club staff transfer when their club is not source or destination", async () => {
    getActiveContractForPlayerMock.mockResolvedValue({
      id: "123e4567-e89b-42d3-a456-556642440444",
      club_id: "123e4567-e89b-42d3-a456-556642440101",
      status: "active"
    });

    const req = {
      body: {
        playerId: "123e4567-e89b-42d3-a456-556642440111",
        toClubId: "123e4567-e89b-42d3-a456-556642440102",
        newStartDate: "2026-08-01",
        newEndDate: "2027-07-31",
        terminationReason: "Transfer"
      },
      user: {
        id: "u-staff",
        email: "staff@example.com",
        role: "club_staff",
        clubId: "123e4567-e89b-42d3-a456-556642440999",
        playerId: null
      }
    } as unknown as Request;
    const res = createResponse();
    const next = vi.fn() as unknown as NextFunction;

    await postTransferContract(req, res, next);

    expect(executePlayerTransferMock).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("transfers player when validation passes", async () => {
    getActiveContractForPlayerMock.mockResolvedValue({
      id: "123e4567-e89b-42d3-a456-556642440444",
      club_id: "123e4567-e89b-42d3-a456-556642440101",
      status: "active"
    });
    executePlayerTransferMock.mockResolvedValue({
      old_contract_id: "123e4567-e89b-42d3-a456-556642440444",
      new_contract_id: "123e4567-e89b-42d3-a456-556642440555",
      player_id: "123e4567-e89b-42d3-a456-556642440111",
      from_club_id: "123e4567-e89b-42d3-a456-556642440101",
      to_club_id: "123e4567-e89b-42d3-a456-556642440102"
    });

    const req = {
      body: {
        playerId: "123e4567-e89b-42d3-a456-556642440111",
        toClubId: "123e4567-e89b-42d3-a456-556642440102",
        newStartDate: "2026-08-01",
        newEndDate: "2027-07-31",
        terminationReason: "Transfer",
        transferNotes: "Summer transfer window",
        enrollmentDate: "2026-08-01"
      },
      user: {
        id: "u-admin",
        email: "admin@example.com",
        role: "admin",
        clubId: null,
        playerId: null
      }
    } as unknown as Request;
    const res = createResponse();
    const next = vi.fn() as unknown as NextFunction;

    await postTransferContract(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(executePlayerTransferMock).toHaveBeenCalledWith({
      playerId: "123e4567-e89b-42d3-a456-556642440111",
      toClubId: "123e4567-e89b-42d3-a456-556642440102",
      newStartDate: "2026-08-01",
      newEndDate: "2027-07-31",
      terminationReason: "Transfer",
      transferNotes: "Summer transfer window",
      enrollmentDate: "2026-08-01",
      changedBy: "u-admin"
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
