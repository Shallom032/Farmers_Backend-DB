// src/services/logisticsService.ts
import { logisticsRepository } from "../repository/logisticsRepository";

export const logisticsService = {
  getAllLogistics: async () => await logisticsRepository.getAll(),

  getLogisticsById: async (id: number) => {
    const delivery = await logisticsRepository.getById(id);
    if (!delivery) throw new Error("Delivery not found");
    return delivery;
  },

  updateLogistics: async (id: number, data: any) => {
    const existing = await logisticsRepository.getById(id);
    if (!existing) throw new Error("Delivery not found");

    const updateData = {
      pickup_location: data.pickup_location || existing.pickup_location,
      dropoff_location: data.dropoff_location || existing.dropoff_location,
      delivery_status: data.delivery_status || existing.delivery_status,
      delivery_date: data.delivery_date || existing.delivery_date
    };

    await logisticsRepository.update(id, updateData);
    return { message: "Delivery updated successfully" };
  },

  deleteLogistics: async (id: number) => {
    const existing = await logisticsRepository.getById(id);
    if (!existing) throw new Error("Delivery not found");

    await logisticsRepository.delete(id);
    return { message: "Delivery deleted successfully" };
  }
};
