import paymentRoutes from '../../../src/routes/paymentRoutes';

describe('Payment Routes', () => {
  it('should have POST / route', () => {
    const routes = paymentRoutes.stack;
    const createRoute = routes.find((layer: any) =>
      layer.route?.path === '/' && layer.route?.methods?.post
    );
    expect(createRoute).toBeDefined();
  });

  it('should have GET / route', () => {
    const routes = paymentRoutes.stack;
    const getAllRoute = routes.find((layer: any) =>
      layer.route?.path === '/' && layer.route?.methods?.get
    );
    expect(getAllRoute).toBeDefined();
  });

  it('should have GET /:id route', () => {
    const routes = paymentRoutes.stack;
    const getByIdRoute = routes.find((layer: any) =>
      layer.route?.path === '/:id' && layer.route?.methods?.get
    );
    expect(getByIdRoute).toBeDefined();
  });

  it('should have GET /order/:orderId route', () => {
    const routes = paymentRoutes.stack;
    const getByOrderRoute = routes.find((layer: any) =>
      layer.route?.path === '/order/:orderId' && layer.route?.methods?.get
    );
    expect(getByOrderRoute).toBeDefined();
  });

  it('should have PUT /:id/approve route', () => {
    const routes = paymentRoutes.stack;
    const approveRoute = routes.find((layer: any) =>
      layer.route?.path === '/:id/approve' && layer.route?.methods?.put
    );
    expect(approveRoute).toBeDefined();
  });

  it('should have PUT /:id/reject route', () => {
    const routes = paymentRoutes.stack;
    const rejectRoute = routes.find((layer: any) =>
      layer.route?.path === '/:id/reject' && layer.route?.methods?.put
    );
    expect(rejectRoute).toBeDefined();
  });

  it('should have GET /pending/approvals route', () => {
    const routes = paymentRoutes.stack;
    const pendingRoute = routes.find((layer: any) =>
      layer.route?.path === '/pending/approvals' && layer.route?.methods?.get
    );
    expect(pendingRoute).toBeDefined();
  });

  it('should export a router', () => {
    expect(paymentRoutes).toBeDefined();
    expect(typeof paymentRoutes).toBe('function');
    expect(paymentRoutes.stack).toBeDefined();
  });

  it('should have 7 routes configured', () => {
    const routes = paymentRoutes.stack;
    const routeLayers = routes.filter((layer: any) => layer.route);
    expect(routeLayers).toHaveLength(7);
  });
});