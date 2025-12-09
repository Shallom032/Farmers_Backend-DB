import logisticsRoutes from '../../../src/routes/logisticsRoutes';

describe('Logistics Routes', () => {
  it('should have GET / route', () => {
    const routes = logisticsRoutes.stack;
    const getAllRoute = routes.find((layer: any) =>
      layer.route?.path === '/' && layer.route?.methods?.get
    );
    expect(getAllRoute).toBeDefined();
  });

  it('should have GET /:id route', () => {
    const routes = logisticsRoutes.stack;
    const getByIdRoute = routes.find((layer: any) =>
      layer.route?.path === '/:id' && layer.route?.methods?.get
    );
    expect(getByIdRoute).toBeDefined();
  });

  it('should have POST / route', () => {
    const routes = logisticsRoutes.stack;
    const createRoute = routes.find((layer: any) =>
      layer.route?.path === '/' && layer.route?.methods?.post
    );
    expect(createRoute).toBeDefined();
  });

  it('should have PUT /:id route', () => {
    const routes = logisticsRoutes.stack;
    const updateRoute = routes.find((layer: any) =>
      layer.route?.path === '/:id' && layer.route?.methods?.put
    );
    expect(updateRoute).toBeDefined();
  });

  it('should have DELETE /:id route', () => {
    const routes = logisticsRoutes.stack;
    const deleteRoute = routes.find((layer: any) =>
      layer.route?.path === '/:id' && layer.route?.methods?.delete
    );
    expect(deleteRoute).toBeDefined();
  });

  it('should have POST /assign-order route', () => {
    const routes = logisticsRoutes.stack;
    const assignRoute = routes.find((layer: any) =>
      layer.route?.path === '/assign-order' && layer.route?.methods?.post
    );
    expect(assignRoute).toBeDefined();
  });

  it('should have GET /agent/my-deliveries route', () => {
    const routes = logisticsRoutes.stack;
    const myDeliveriesRoute = routes.find((layer: any) =>
      layer.route?.path === '/agent/my-deliveries' && layer.route?.methods?.get
    );
    expect(myDeliveriesRoute).toBeDefined();
  });

  it('should have PUT /:id/status route', () => {
    const routes = logisticsRoutes.stack;
    const statusRoute = routes.find((layer: any) =>
      layer.route?.path === '/:id/status' && layer.route?.methods?.put
    );
    expect(statusRoute).toBeDefined();
  });

  it('should export a router', () => {
    expect(logisticsRoutes).toBeDefined();
    expect(typeof logisticsRoutes).toBe('function');
    expect(logisticsRoutes.stack).toBeDefined();
  });

  it('should have 8 routes configured', () => {
    const routes = logisticsRoutes.stack;
    const routeLayers = routes.filter((layer: any) => layer.route);
    expect(routeLayers).toHaveLength(8);
  });
});