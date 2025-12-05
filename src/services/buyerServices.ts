// src/services/buyerService.ts
import { buyerRepository } from "../repository/buyerRepository";

export const buyerService = {
  getAllBuyers: async () => await buyerRepository.getAll(),

  getBuyerById: async (id: number) => {
    const buyer = await buyerRepository.getById(id);
    if (!buyer) throw new Error("Buyer not found");
    return buyer;
  },

  updateBuyer: async (id: number, data: any) => {
    const existing = await buyerRepository.getById(id);
    if (!existing) throw new Error("Buyer not found");

    const updateData = {
      location: data.location || existing.location,
      produce_purchased: data.produce_purchased || existing.produce_purchased,
      quantity: data.quantity ?? existing.quantity,
      delivery_status: data.delivery_status || existing.delivery_status
    };

    await buyerRepository.update(id, updateData);
    return { message: "Buyer updated successfully" };
  },

  deleteBuyer: async (id: number) => {
    const existing = await buyerRepository.getById(id);
    if (!existing) throw new Error("Buyer not found");

    await buyerRepository.delete(id);
    return { message: "Buyer deleted successfully" };
  }
};
