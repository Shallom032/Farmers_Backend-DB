// src/services/logisticsServices.ts
import { logisticsRepository } from "../repository/logisticsRepository";
import { orderService } from "./orderServices";

export const logisticsService = {
  getAllLogistics: async () => await logisticsRepository.getAll(),

  getLogisticsById: async (id: number) => {
    const delivery = await logisticsRepository.getById(id);
    if (!delivery) throw new Error("Delivery not found");
    return delivery;
  },

  createLogistics: async (data: any) => {
    const logisticsId = await logisticsRepository.create(data);
    return { logisticsId, message: "Logistics entry created successfully" };
  },

  assignOrderToAgent: async (orderId: number, agentId: number, logisticsData: any) => {
    // Verify order exists and is pending or confirmed
    console.log('Assigning order to agent - Order ID:', orderId, 'Agent ID:', agentId);
    const order = await orderService.getOrderById(orderId);
    console.log('Order found:', order);
    if (!order) {
      console.log('Order not found');
      throw new Error("Order not found");
    }
    console.log('Order status:', order[0].status);
    if (order[0].status !== 'pending' && order[0].status !== 'confirmed') {
      console.log('Order status not ready:', order[0].status);
      throw new Error("Order not ready for logistics assignment. Status: " + order[0].status);
    }

    // Check if logistics already exists for this order
    const existingLogistics = await logisticsRepository.getByOrderId(orderId);
    if (existingLogistics) {
      throw new Error("Logistics already assigned to this order");
    }

    const logisticsDataWithOrder = {
      order_id: orderId,
      delivery_agent_id: agentId,
      pickup_location: logisticsData.pickup_location || order[0].farmer_location,
      dropoff_location: logisticsData.dropoff_location || order[0].delivery_address,
      delivery_status: 'pending',
      delivery_date: logisticsData.delivery_date,
      estimated_delivery: logisticsData.estimated_delivery,
      notes: logisticsData.notes
    };

    const logisticsId = await logisticsRepository.create(logisticsDataWithOrder);

    // Update order status to shipped
    await orderService.updateOrderStatus(orderId, 'shipped');

    return { logisticsId, message: "Order assigned to delivery agent successfully" };
  },

  getDeliveriesByAgent: async (agentId: number) => {
    console.log('Getting deliveries for agent ID:', agentId);
    const deliveries = await logisticsRepository.getByAgentId(agentId);
    console.log('Deliveries found:', deliveries);
    return deliveries;
  },

  updateDeliveryStatus: async (id: number, status: string, notes?: string) => {
    const existing = await logisticsRepository.getById(id);
    if (!existing) throw new Error("Delivery not found");

    const updateData: any = { delivery_status: status };
    if (notes) updateData.notes = notes;
    if (status === 'delivered') {
      updateData.actual_delivery = new Date();
      // Update order status to delivered
      if (existing.order_id) {
        await orderService.updateOrderStatus(existing.order_id, 'delivered');
      }
    }

    await logisticsRepository.update(id, updateData);
    return { message: "Delivery status updated successfully" };
  },

  updateLogistics: async (id: number, data: any) => {
    const existing = await logisticsRepository.getById(id);
    if (!existing) throw new Error("Delivery not found");

    const updateData = {
      pickup_location: data.pickup_location || existing.pickup_location,
      dropoff_location: data.dropoff_location || existing.dropoff_location,
      delivery_status: data.delivery_status || existing.delivery_status,
      delivery_date: data.delivery_date || existing.delivery_date,
      estimated_delivery: data.estimated_delivery || existing.estimated_delivery,
      actual_delivery: data.actual_delivery || existing.actual_delivery,
      tracking_number: data.tracking_number || existing.tracking_number,
      notes: data.notes || existing.notes
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
