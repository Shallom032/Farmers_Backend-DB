import userRoutes from '../../../src/routes/usersRoutes';

describe('User Routes', () => {
  it('should have GET / route', () => {
    const routes = userRoutes.stack;
    const getAllRoute = routes.find((layer: any) =>
      layer.route?.path === '/' && layer.route?.methods?.get
    );
    expect(getAllRoute).toBeDefined();
  });

  it('should have GET /:id route', () => {
    const routes = userRoutes.stack;
    const getByIdRoute = routes.find((layer: any) =>
      layer.route?.path === '/:id' && layer.route?.methods?.get
    );
    expect(getByIdRoute).toBeDefined();
  });

  it('should have PUT /:id route', () => {
    const routes = userRoutes.stack;
    const updateRoute = routes.find((layer: any) =>
      layer.route?.path === '/:id' && layer.route?.methods?.put
    );
    expect(updateRoute).toBeDefined();
  });

  it('should have DELETE /:id route', () => {
    const routes = userRoutes.stack;
    const deleteRoute = routes.find((layer: any) =>
      layer.route?.path === '/:id' && layer.route?.methods?.delete
    );
    expect(deleteRoute).toBeDefined();
  });

  it('should export a router', () => {
    expect(userRoutes).toBeDefined();
    expect(typeof userRoutes).toBe('function');
    expect(userRoutes.stack).toBeDefined();
  });

  it('should have 4 routes configured', () => {
    const routes = userRoutes.stack;
    const routeLayers = routes.filter((layer: any) => layer.route);
    expect(routeLayers).toHaveLength(4);
  });
});