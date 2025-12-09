import buyerRoutes from '../../../src/routes/buyerRoutes';

describe('Buyer Routes', () => {
  it('should have GET / route', () => {
    const routes = buyerRoutes.stack;
    const getAllRoute = routes.find((layer: any) =>
      layer.route?.path === '/' && layer.route?.methods?.get
    );
    expect(getAllRoute).toBeDefined();
  });

  it('should have GET /:id route', () => {
    const routes = buyerRoutes.stack;
    const getByIdRoute = routes.find((layer: any) =>
      layer.route?.path === '/:id' && layer.route?.methods?.get
    );
    expect(getByIdRoute).toBeDefined();
  });

  it('should have PUT /:id route', () => {
    const routes = buyerRoutes.stack;
    const updateRoute = routes.find((layer: any) =>
      layer.route?.path === '/:id' && layer.route?.methods?.put
    );
    expect(updateRoute).toBeDefined();
  });

  it('should have DELETE /:id route', () => {
    const routes = buyerRoutes.stack;
    const deleteRoute = routes.find((layer: any) =>
      layer.route?.path === '/:id' && layer.route?.methods?.delete
    );
    expect(deleteRoute).toBeDefined();
  });

  it('should export a router', () => {
    expect(buyerRoutes).toBeDefined();
    expect(typeof buyerRoutes).toBe('function');
    expect(buyerRoutes.stack).toBeDefined();
  });

  it('should have 4 routes configured', () => {
    const routes = buyerRoutes.stack;
    const routeLayers = routes.filter((layer: any) => layer.route);
    expect(routeLayers).toHaveLength(4);
  });
});