import productRoutes from '../../../src/routes/productRoutes';

describe('Product Routes', () => {
  it('should have GET / route', () => {
    const routes = productRoutes.stack;
    const getAllRoute = routes.find((layer: any) =>
      layer.route?.path === '/' && layer.route?.methods?.get
    );
    expect(getAllRoute).toBeDefined();
  });

  it('should have GET /search route', () => {
    const routes = productRoutes.stack;
    const searchRoute = routes.find((layer: any) =>
      layer.route?.path === '/search' && layer.route?.methods?.get
    );
    expect(searchRoute).toBeDefined();
  });

  it('should have GET /:id route', () => {
    const routes = productRoutes.stack;
    const getByIdRoute = routes.find((layer: any) =>
      layer.route?.path === '/:id' && layer.route?.methods?.get
    );
    expect(getByIdRoute).toBeDefined();
  });

  it('should have POST / route', () => {
    const routes = productRoutes.stack;
    const createRoute = routes.find((layer: any) =>
      layer.route?.path === '/' && layer.route?.methods?.post
    );
    expect(createRoute).toBeDefined();
  });

  it('should have GET /my/products route', () => {
    const routes = productRoutes.stack;
    const myProductsRoute = routes.find((layer: any) =>
      layer.route?.path === '/my/products' && layer.route?.methods?.get
    );
    expect(myProductsRoute).toBeDefined();
  });

  it('should have GET /my route', () => {
    const routes = productRoutes.stack;
    const myRoute = routes.find((layer: any) =>
      layer.route?.path === '/my' && layer.route?.methods?.get
    );
    expect(myRoute).toBeDefined();
  });

  it('should have PUT /:id route', () => {
    const routes = productRoutes.stack;
    const updateRoute = routes.find((layer: any) =>
      layer.route?.path === '/:id' && layer.route?.methods?.put
    );
    expect(updateRoute).toBeDefined();
  });

  it('should have DELETE /:id route', () => {
    const routes = productRoutes.stack;
    const deleteRoute = routes.find((layer: any) =>
      layer.route?.path === '/:id' && layer.route?.methods?.delete
    );
    expect(deleteRoute).toBeDefined();
  });

  it('should export a router', () => {
    expect(productRoutes).toBeDefined();
    expect(typeof productRoutes).toBe('function');
    expect(productRoutes.stack).toBeDefined();
  });

  it('should have 8 routes configured', () => {
    const routes = productRoutes.stack;
    const routeLayers = routes.filter((layer: any) => layer.route);
    expect(routeLayers).toHaveLength(8);
  });
});