import orderRoutes from '../../../src/routes/orderRoutes';

describe('Order Routes', () => {
  it('should have POST / route', () => {
    const routes = orderRoutes.stack;
    const createRoute = routes.find((layer: any) =>
      layer.route?.path === '/' && layer.route?.methods?.post
    );
    expect(createRoute).toBeDefined();
  });

  it('should have GET / route', () => {
    const routes = orderRoutes.stack;
    const getAllRoute = routes.find((layer: any) =>
      layer.route?.path === '/' && layer.route?.methods?.get
    );
    expect(getAllRoute).toBeDefined();
  });

  it('should have GET /:id route', () => {
    const routes = orderRoutes.stack;
    const getByIdRoute = routes.find((layer: any) =>
      layer.route?.path === '/:id' && layer.route?.methods?.get
    );
    expect(getByIdRoute).toBeDefined();
  });

  it('should have GET /my/orders route', () => {
    const routes = orderRoutes.stack;
    const myOrdersRoute = routes.find((layer: any) =>
      layer.route?.path === '/my/orders' && layer.route?.methods?.get
    );
    expect(myOrdersRoute).toBeDefined();
  });

  it('should have PUT /:id/status route', () => {
    const routes = orderRoutes.stack;
    const updateStatusRoute = routes.find((layer: any) =>
      layer.route?.path === '/:id/status' && layer.route?.methods?.put
    );
    expect(updateStatusRoute).toBeDefined();
  });

  it('should have GET /logistics/pending route', () => {
    const routes = orderRoutes.stack;
    const pendingRoute = routes.find((layer: any) =>
      layer.route?.path === '/logistics/pending' && layer.route?.methods?.get
    );
    expect(pendingRoute).toBeDefined();
  });

  it('should have GET /farmer route', () => {
    const routes = orderRoutes.stack;
    const farmerRoute = routes.find((layer: any) =>
      layer.route?.path === '/farmer' && layer.route?.methods?.get
    );
    expect(farmerRoute).toBeDefined();
  });

  it('should export a router', () => {
    expect(orderRoutes).toBeDefined();
    expect(typeof orderRoutes).toBe('function');
    expect(orderRoutes.stack).toBeDefined();
  });

  it('should have 7 routes configured', () => {
    const routes = orderRoutes.stack;
    const routeLayers = routes.filter((layer: any) => layer.route);
    expect(routeLayers).toHaveLength(7);
  });
});