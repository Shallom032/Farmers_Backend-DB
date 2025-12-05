// src/services/farmerService.ts
import { farmersRepository, FarmerUpdateData } from "../repository/farmersRepository";

export const farmerService = {
  getAllFarmers: async () => await farmersRepository.getAll(),

  getFarmerById: async (id: number) => {
    const farmer = await farmersRepository.getById(id);
    if (!farmer) throw new Error("Farmer not found");
    return farmer;
  },

  updateFarmer: async (id: number, data: FarmerUpdateData) => {
    const existing = await farmersRepository.getById(id);
    if (!existing) throw new Error("Farmer not found");

    const updateData: FarmerUpdateData = {
      location: typeof data.location === "string" ? data.location.trim() : existing.location,
      product: typeof data.product === "string" ? data.product.trim() : existing.product,
    };

    await farmersRepository.update(id, updateData);
    return { message: "Farmer updated successfully" };
  },

  deleteFarmer: async (id: number) => {
    const existing = await farmersRepository.getById(id);
    if (!existing) throw new Error("Farmer not found");

    await farmersRepository.delete(id);
    return { message: "Farmer deleted successfully" };
  }
};
