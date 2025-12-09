import cartRoutes from '../../../src/routes/cartRoutes';

describe('Cart Routes', () => {
  it('should have GET / route', () => {
    const routes = cartRoutes.stack;
    const getCartRoute = routes.find((layer: any) =>
      layer.route?.path === '/' && layer.route?.methods?.get
    );
    expect(getCartRoute).toBeDefined();
  });

  it('should have POST / route', () => {
    const routes = cartRoutes.stack;
    const addToCartRoute = routes.find((layer: any) =>
      layer.route?.path === '/' && layer.route?.methods?.post
    );
    expect(addToCartRoute).toBeDefined();
  });

  it('should have PUT / route', () => {
    const routes = cartRoutes.stack;
    const updateRoute = routes.find((layer: any) =>
      layer.route?.path === '/' && layer.route?.methods?.put
    );
    expect(updateRoute).toBeDefined();
  });

  it('should have DELETE /:productId route', () => {
    const routes = cartRoutes.stack;
    const removeRoute = routes.find((layer: any) =>
      layer.route?.path === '/:productId' && layer.route?.methods?.delete
    );
    expect(removeRoute).toBeDefined();
  });

  it('should have DELETE / route', () => {
    const routes = cartRoutes.stack;
    const clearRoute = routes.find((layer: any) =>
      layer.route?.path === '/' && layer.route?.methods?.delete
    );
    expect(clearRoute).toBeDefined();
  });

  it('should have GET /total route', () => {
    const routes = cartRoutes.stack;
    const totalRoute = routes.find((layer: any) =>
      layer.route?.path === '/total' && layer.route?.methods?.get
    );
    expect(totalRoute).toBeDefined();
  });

  it('should export a router', () => {
    expect(cartRoutes).toBeDefined();
    expect(typeof cartRoutes).toBe('function');
    expect(cartRoutes.stack).toBeDefined();
  });

  it('should have 6 routes configured', () => {
    const routes = cartRoutes.stack;
    const routeLayers = routes.filter((layer: any) => layer.route);
    expect(routeLayers).toHaveLength(6);
  });
});