// tests/unit/controllers/logisticsController.test.ts
import { Request, Response } from "express";
import { logisticsController } from "../../../src/controllers/logisticsController";
import { logisticsService } from "../../../src/services/logisticsServices";

// Mock the service
jest.mock("../../../src/services/logisticsServices");

// FIX: remove strict MSSQL recordset typing in tests
const mockService = logisticsService as jest.Mocked<any>;

describe("logisticsController", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockRes = {
      status: statusMock,
      json: jsonMock,
    };

    mockReq = {};
    jest.clearAllMocks();
  });

  const sampleRecord = {
    logistics_id: 1,
    order_id: 101,
    driver_name: "John Doe",
    truck_number: "KBN-123X",
    status: "In Transit",
    delivery_date: new Date("2025-11-18"),
  };

  describe("getAll", () => {
    it("should return all logistics records", async () => {
      mockService.getAllLogistics.mockResolvedValue([sampleRecord]);

      await logisticsController.getAll(mockReq as Request, mockRes as Response);

      expect(mockService.getAllLogistics).toHaveBeenCalledTimes(1);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith([sampleRecord]);
    });

    it("should handle errors", async () => {
      mockService.getAllLogistics.mockRejectedValue(new Error("DB error"));

      await logisticsController.getAll(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: "DB error" });
    });
  });

  describe("getById", () => {
    it("should return a logistics record by ID", async () => {
      mockReq.params = { id: "1" };
      mockService.getLogisticsById.mockResolvedValue(sampleRecord);

      await logisticsController.getById(mockReq as Request, mockRes as Response);

      expect(mockService.getLogisticsById).toHaveBeenCalledWith(1);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(sampleRecord);
    });

    it("should return 404 if not found", async () => {
      mockReq.params = { id: "2" };
      mockService.getLogisticsById.mockResolvedValue(null);

      await logisticsController.getById(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ message: "Logistics not found" });
    });
  });

  describe("create", () => {
    it("should create a logistics record", async () => {
      mockReq.body = sampleRecord;
      mockService.createLogistics.mockResolvedValue(sampleRecord);

      await logisticsController.create(mockReq as Request, mockRes as Response);

      expect(mockService.createLogistics).toHaveBeenCalledWith(sampleRecord);
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(sampleRecord);
    });

    it("should handle errors", async () => {
      mockReq.body = sampleRecord;
      mockService.createLogistics.mockRejectedValue(new Error("Validation error"));

      await logisticsController.create(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: "Validation error" });
    });
  });

  describe("update", () => {
    it("should update a logistics record", async () => {
      mockReq.params = { id: "1" };
      mockReq.body = { status: "Delivered" };

      const updatedRecord = { ...sampleRecord, status: "Delivered" };
      mockService.updateLogistics.mockResolvedValue(updatedRecord);

      await logisticsController.update(mockReq as Request, mockRes as Response);

      expect(mockService.updateLogistics).toHaveBeenCalledWith(1, { status: "Delivered" });
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(updatedRecord);
    });

    it("should handle errors", async () => {
      mockReq.params = { id: "1" };
      mockReq.body = { status: "Delivered" };

      mockService.updateLogistics.mockRejectedValue(new Error("Update failed"));

      await logisticsController.update(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: "Update failed" });
    });
  });

  describe("delete", () => {
    it("should delete a logistics record", async () => {
      mockReq.params = { id: "1" };

      mockService.deleteLogistics.mockResolvedValue({
        message: "Deleted successfully",
      });

      await logisticsController.delete(mockReq as Request, mockRes as Response);

      expect(mockService.deleteLogistics).toHaveBeenCalledWith(1);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ message: "Deleted successfully" });
    });

    it("should handle errors", async () => {
      mockReq.params = { id: "1" };

      mockService.deleteLogistics.mockRejectedValue(new Error("Delete failed"));

      await logisticsController.delete(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: "Delete failed" });
    });
  });
});
