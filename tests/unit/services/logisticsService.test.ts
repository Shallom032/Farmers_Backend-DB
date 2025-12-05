import { logisticsService } from "../../../src/services/logisticsServices";
import { logisticsRepository, Logistics } from "../../../src/repository/logisticsRepository";

jest.mock("../../../src/repository/logisticsRepository");

// Loosen types for Jest mocks
const mockedRepo = logisticsRepository as unknown as {
  getAllLogistics: jest.Mock;
  getLogisticsById: jest.Mock;
  createLogistics: jest.Mock;
  updateLogistics: jest.Mock;
  deleteLogistics: jest.Mock;
};

describe("logisticsService", () => {
  const sampleLogistics: Logistics = {
    logistics_id: 1,
    order_id: 10,
    driver_name: "John Doe",
    status: "pending",
    truck_number: "ABC123",
    delivery_date:new Date("2025-10-11"),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------------
  // getAllLogistics
  // -------------------------------
  test("getAllLogistics should return all logistics records", async () => {
    mockedRepo.getAllLogistics.mockResolvedValue([sampleLogistics]);

    const result = await logisticsService.getAllLogistics();

    expect(mockedRepo.getAllLogistics).toHaveBeenCalledTimes(1);
    expect(result).toEqual([sampleLogistics]);
  });

  // -------------------------------
  // getLogisticsById
  // -------------------------------
  test("getLogisticsById should return a record", async () => {
    mockedRepo.getLogisticsById.mockResolvedValue(sampleLogistics);

    const result = await logisticsService.getLogisticsById(1);

    expect(mockedRepo.getLogisticsById).toHaveBeenCalledWith(1);
    expect(result).toEqual(sampleLogistics);
  });

  // -------------------------------
  // createLogistics
  // -------------------------------
  test("createLogistics should create a record", async () => {
    mockedRepo.createLogistics.mockResolvedValue(sampleLogistics);

    const result = await logisticsService.createLogistics(sampleLogistics);

    expect(mockedRepo.createLogistics).toHaveBeenCalledWith(sampleLogistics);
    expect(result).toEqual(sampleLogistics);
  });

  test("createLogistics should throw error if required fields missing", async () => {
    await expect(
      logisticsService.createLogistics({} as Logistics)
    ).rejects.toThrow("Missing required logistics fields");
  });

  // -------------------------------
  // updateLogistics
  // -------------------------------
  test("updateLogistics should update a record", async () => {
    mockedRepo.getLogisticsById.mockResolvedValue(sampleLogistics);
    mockedRepo.updateLogistics.mockResolvedValue({ ...sampleLogistics, status: "delivered" });

    const result = await logisticsService.updateLogistics(1, { ...sampleLogistics, status: "delivered" });

    expect(mockedRepo.getLogisticsById).toHaveBeenCalledWith(1);
    expect(mockedRepo.updateLogistics).toHaveBeenCalledWith(1, { ...sampleLogistics, status: "delivered" });
    expect(result).toBe("delivered");
  });

  test("updateLogistics should throw error if record not found", async () => {
    mockedRepo.getLogisticsById.mockResolvedValue(null);

    await expect(
      logisticsService.updateLogistics(999, sampleLogistics)
    ).rejects.toThrow("Logistics record not found");
  });

  // -------------------------------
  // deleteLogistics
  // -------------------------------
  test("deleteLogistics should delete a record", async () => {
    mockedRepo.getLogisticsById.mockResolvedValue(sampleLogistics);
    mockedRepo.deleteLogistics.mockResolvedValue(undefined);

    const result = await logisticsService.deleteLogistics(1);

    expect(mockedRepo.getLogisticsById).toHaveBeenCalledWith(1);
    expect(mockedRepo.deleteLogistics).toHaveBeenCalledWith(1);
    expect(result).toBeUndefined();
  });

  test("deleteLogistics should throw error if record not found", async () => {
    mockedRepo.getLogisticsById.mockResolvedValue(null);

    await expect(logisticsService.deleteLogistics(999)).rejects.toThrow(
      "Logistics record not found"
    );
  });
});
