// tests/unit/controllers/farmerController.test.ts
import { Request, Response } from "express";
import * as farmerController from "../../../src/controllers/farmerController";
import { FarmerRepository } from "../../../src/repository/farmerRepository";

// Mock FarmerRepository
jest.mock("../../../src/repository/farmerRepository");

describe("Farmer Controller", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockRepoInstance: jest.Mocked<any>; // FIX: remove strict typing

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    // FIX: allow mocking freely without type errors
    mockRepoInstance = new (FarmerRepository as any)() as jest.Mocked<any>;

    // Inject mocked instance into controller if controller uses new FarmerRepository()
    (FarmerRepository as jest.Mock).mockReturnValue(mockRepoInstance);

    jest.clearAllMocks();
  });

  // FIX: full Farmer object to match interface
  const sampleFarmer = {
    FarmerID: 1,
    FullName: "John Doe",
    PhoneNumber: "0712345678",
    Location: "Nairobi",
    FarmName: "Green Farm",
  };

  test("getAllFarmers should return all farmers", async () => {
    mockRepoInstance.getAllFarmers.mockResolvedValue([sampleFarmer]);

    await farmerController.getAllFarmers(
      mockReq as Request,
      mockRes as Response
    );

    expect(mockRepoInstance.getAllFarmers).toHaveBeenCalled();
    expect(mockRes.json).toHaveBeenCalledWith([sampleFarmer]);
  });

  test("addFarmer should add a farmer and return 201", async () => {
    mockReq.body = sampleFarmer;

    mockRepoInstance.addFarmer.mockResolvedValue(undefined); // FIX

    await farmerController.addFarmer(mockReq as Request, mockRes as Response);

    expect(mockRepoInstance.addFarmer).toHaveBeenCalledWith(sampleFarmer);
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.send).toHaveBeenCalledWith("Farmer added successfully");
  });

  test("getFarmerById should return farmer if found", async () => {
    mockReq.params = { id: "1" };
    mockRepoInstance.getFarmerById.mockResolvedValue(sampleFarmer);

    await farmerController.getFarmerById(
      mockReq as Request,
      mockRes as Response
    );

    expect(mockRepoInstance.getFarmerById).toHaveBeenCalledWith(1);
    expect(mockRes.json).toHaveBeenCalledWith(sampleFarmer);
  });

  test("getFarmerById should return 404 if farmer not found", async () => {
    mockReq.params = { id: "1" };
    mockRepoInstance.getFarmerById.mockResolvedValue(null);

    await farmerController.getFarmerById(
      mockReq as Request,
      mockRes as Response
    );

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.send).toHaveBeenCalledWith("Farmer not found");
  });

  test("updateFarmer should update farmer", async () => {
    mockReq.params = { id: "1" };
    mockReq.body = { FullName: "Updated Name" };

    mockRepoInstance.updateFarmer.mockResolvedValue(undefined); // FIX

    await farmerController.updateFarmer(
      mockReq as Request,
      mockRes as Response
    );

    expect(mockRepoInstance.updateFarmer).toHaveBeenCalledWith(1, mockReq.body);
    expect(mockRes.send).toHaveBeenCalledWith("Farmer updated successfully");
  });

  test("deleteFarmer should delete farmer", async () => {
    mockReq.params = { id: "1" };

    mockRepoInstance.deleteFarmer.mockResolvedValue(undefined); // FIX

    await farmerController.deleteFarmer(
      mockReq as Request,
      mockRes as Response
    );

    expect(mockRepoInstance.deleteFarmer).toHaveBeenCalledWith(1);
    expect(mockRes.send).toHaveBeenCalledWith("Farmer deleted successfully");
  });
});
