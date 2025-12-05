// tests/unit/services/farmerService.test.ts
import * as farmerService from "../../../src/services/farmerServices";
import sql from "../../../src/db/config";

// Mock the `sql.Request` class
jest.mock("../../../src/db/config", () => {
  const mRequest = {
    input: jest.fn().mockReturnThis(),
    query: jest.fn(),
  };
  return {
    Request: jest.fn(() => mRequest),
  };
});

describe("Farmer Service", () => {
  const mockRequest = new sql.Request() as jest.Mocked<any>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("addFarmer should insert a farmer", async () => {
    mockRequest.query.mockResolvedValueOnce({});
    const farmer = {
      FullName: "John Doe",
      PhoneNumber: "1234567890",
      Location: "Nairobi",
      FarmName: "Doe Farms",
    };

    const result = await farmerService.addFarmer(farmer);

    expect(mockRequest.input).toHaveBeenCalledTimes(4);
    expect(mockRequest.query).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO Farmers")
    );
    expect(result).toEqual({ message: "Farmer added successfully" });
  });

  test("getAllFarmers should return all farmers", async () => {
    const recordset = [{ FarmerID: 1, FullName: "John Doe" }];
    mockRequest.query.mockResolvedValueOnce({ recordset });

    const result = await farmerService.getAllFarmers();

    expect(mockRequest.query).toHaveBeenCalledWith("SELECT * FROM Farmers");
    expect(result).toEqual(recordset);
  });

  test("getFarmerById should return a single farmer", async () => {
    const farmer = { FarmerID: 1, FullName: "John Doe" };
    mockRequest.query.mockResolvedValueOnce({ recordset: [farmer] });

    const result = await farmerService.getFarmerById(1);

    expect(mockRequest.input).toHaveBeenCalledWith("FarmerID", 1);
    expect(result).toEqual(farmer);
  });

  test("updateFarmer should update a farmer", async () => {
    mockRequest.query.mockResolvedValueOnce({});
    const farmer = {
      FullName: "Jane Doe",
      PhoneNumber: "9876543210",
      Location: "Kisumu",
      FarmName: "Jane Farms",
    };

    const result = await farmerService.updateFarmer(1, farmer);

    expect(mockRequest.input).toHaveBeenCalledWith("FarmerID", 1);
    expect(mockRequest.query).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE Farmers")
    );
    expect(result).toEqual({ message: "Farmer updated successfully" });
  });

  test("deleteFarmer should delete a farmer", async () => {
    mockRequest.query.mockResolvedValueOnce({});

    const result = await farmerService.deleteFarmer(1);

    expect(mockRequest.input).toHaveBeenCalledWith("FarmerID", 1);
    expect(mockRequest.query).toHaveBeenCalledWith(
      "DELETE FROM Farmers WHERE FarmerID = @FarmerID"
    );
    expect(result).toEqual({ message: "Farmer deleted successfully" });
  });
});
