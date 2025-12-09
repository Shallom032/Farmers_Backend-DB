// tests/unit/controllers/farmersController.test.ts
import { Request, Response } from "express";
import { farmerController } from "../../../src/controllers/farmersController";
import { farmerService } from "../../../src/services/farmersServices";

// Mock farmerService
jest.mock("../../../src/services/farmersServices");

const mockFarmerService = farmerService as jest.Mocked<typeof farmerService>;

describe("Farmer Controller", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    jest.clearAllMocks();
  });

  const sampleFarmer = {
    farmer_id: 1,
    user_id: 1,
    location: "Nairobi",
    product: "Maize"
  };

  test("getAllFarmers should return all farmers", async () => {
    mockFarmerService.getAllFarmers.mockResolvedValue([sampleFarmer] as any);

    await farmerController.getAllFarmers(
      mockReq as Request,
      mockRes as Response
    );

    expect(mockFarmerService.getAllFarmers).toHaveBeenCalled();
    expect(mockRes.json).toHaveBeenCalledWith([sampleFarmer]);
  });

  test("getFarmerById should return farmer if found", async () => {
    mockReq.params = { id: "1" };
    mockFarmerService.getFarmerById.mockResolvedValue(sampleFarmer as any);

    await farmerController.getFarmerById(
      mockReq as Request,
      mockRes as Response
    );

    expect(mockFarmerService.getFarmerById).toHaveBeenCalledWith(1);
    expect(mockRes.json).toHaveBeenCalledWith(sampleFarmer);
  });

  test("getFarmerById should return 404 if farmer not found", async () => {
    mockReq.params = { id: "1" };
    mockFarmerService.getFarmerById.mockRejectedValue(new Error("Farmer not found"));

    await farmerController.getFarmerById(
      mockReq as Request,
      mockRes as Response
    );

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({ message: "Farmer not found" });
  });

  test("updateFarmer should update farmer", async () => {
    mockReq.params = { id: "1" };
    mockReq.body = { location: "Updated Location" };

    mockFarmerService.updateFarmer.mockResolvedValue({ message: "Farmer updated successfully" } as any);

    await farmerController.updateFarmer(
      mockReq as Request,
      mockRes as Response
    );

    expect(mockFarmerService.updateFarmer).toHaveBeenCalledWith(1, { location: "Updated Location" });
    expect(mockRes.json).toHaveBeenCalledWith({ message: "Farmer updated successfully" });
  });

  test("updateFarmer should return 400 if no fields provided", async () => {
    mockReq.params = { id: "1" };
    mockReq.body = {};

    await farmerController.updateFarmer(
      mockReq as Request,
      mockRes as Response
    );

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ message: "At least one field (location or product) is required" });
  });

  test("deleteFarmer should delete farmer", async () => {
    mockReq.params = { id: "1" };

    mockFarmerService.deleteFarmer.mockResolvedValue({ message: "Farmer deleted successfully" } as any);

    await farmerController.deleteFarmer(
      mockReq as Request,
      mockRes as Response
    );

    expect(mockFarmerService.deleteFarmer).toHaveBeenCalledWith(1);
    expect(mockRes.json).toHaveBeenCalledWith({ message: "Farmer deleted successfully" });
  });
});
