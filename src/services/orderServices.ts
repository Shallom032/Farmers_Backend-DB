// src/services/orderServices.ts
import { orderRepository } from "../repository/orderRepository";
import { getPool } from "../db/config";

export const orderService = {
  createOrderFromCart: async (buyerId: number, deliveryInfo: any) => {
    const pool = await getPool();

    // Get cart items
    const cartResult = await pool
      .request()
      .input("buyer_id", buyerId)
      .query(`
        SELECT c.*, p.price, p.farmer_id, p.name as product_name, p.unit
        FROM cart c
        JOIN products p ON c.product_id = p.product_id
        WHERE c.buyer_id = @buyer_id
      `);

    if (cartResult.recordset.length === 0) {
      throw new Error("Cart is empty");
    }

    // Group items by farmer
    const farmerOrders: { [key: number]: any[] } = {};
    cartResult.recordset.forEach((item: any) => {
      if (!farmerOrders[item.farmer_id]) {
        farmerOrders[item.farmer_id] = [];
      }
      farmerOrders[item.farmer_id].push(item);
    });

    const createdOrders = [];

    // Create orders for each farmer
    for (const farmerId of Object.keys(farmerOrders)) {
      const items = farmerOrders[+farmerId];
      const totalAmount = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

      const orderData = {
        buyer_id: buyerId,
        farmer_id: +farmerId,
        total_amount: totalAmount,
        delivery_address: deliveryInfo.delivery_address,
        delivery_city: deliveryInfo.delivery_city,
        delivery_phone: deliveryInfo.delivery_phone,
        notes: deliveryInfo.notes
      };

      const orderId = await orderRepository.createOrder(orderData);

      // Create order items
      const orderItems = items.map((item: any) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity
      }));

      await orderRepository.createOrderItems(orderId, orderItems);

      createdOrders.push({ orderId, farmerId: +farmerId, totalAmount, items: orderItems });
    }

    // Clear cart
    await pool
      .request()
      .input("buyer_id", buyerId)
      .query("DELETE FROM cart WHERE buyer_id = @buyer_id");

    return createdOrders;
  },

  getAllOrders: async () => await orderRepository.getAllOrders(),

  getOrderById: async (id: number) => {
    const order = await orderRepository.getOrderById(id);
    if (!order || order.length === 0) throw new Error("Order not found");
    return order;
  },

  getOrdersByBuyer: async (buyerId: number) => await orderRepository.getOrdersByBuyer(buyerId),

  getOrdersByFarmer: async (farmerId: number) => await orderRepository.getOrdersByFarmer(farmerId),

  updateOrderStatus: async (id: number, status: string) => {
    const existing = await orderRepository.getOrderById(id);
    if (!existing || existing.length === 0) throw new Error("Order not found");

    await orderRepository.updateOrderStatus(id, status);
    return { message: "Order status updated successfully" };
  },

  getOrdersForLogistics: async () => await orderRepository.getOrdersForLogistics()
};