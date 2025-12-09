import farmerRoutes from '../../../src/routes/farmersRoutes';

describe('Farmer Routes', () => {
  it('should have GET / route', () => {
    const routes = farmerRoutes.stack;
    const getAllRoute = routes.find((layer: any) =>
      layer.route?.path === '/' && layer.route?.methods?.get
    );
    expect(getAllRoute).toBeDefined();
  });

  it('should have GET /:id route', () => {
    const routes = farmerRoutes.stack;
    const getByIdRoute = routes.find((layer: any) =>
      layer.route?.path === '/:id' && layer.route?.methods?.get
    );
    expect(getByIdRoute).toBeDefined();
  });

  it('should have PUT /:id route', () => {
    const routes = farmerRoutes.stack;
    const updateRoute = routes.find((layer: any) =>
      layer.route?.path === '/:id' && layer.route?.methods?.put
    );
    expect(updateRoute).toBeDefined();
  });

  it('should have DELETE /:id route', () => {
    const routes = farmerRoutes.stack;
    const deleteRoute = routes.find((layer: any) =>
      layer.route?.path === '/:id' && layer.route?.methods?.delete
    );
    expect(deleteRoute).toBeDefined();
  });

  it('should export a router', () => {
    expect(farmerRoutes).toBeDefined();
    expect(typeof farmerRoutes).toBe('function');
    expect(farmerRoutes.stack).toBeDefined();
  });

  it('should have 4 routes configured', () => {
    const routes = farmerRoutes.stack;
    const routeLayers = routes.filter((layer: any) => layer.route);
    expect(routeLayers).toHaveLength(4);
  });
});