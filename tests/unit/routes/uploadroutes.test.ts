import uploadRoutes from '../../../src/routes/uploadRoutes';

describe('Upload Routes', () => {
  it('should have POST /product-image route', () => {
    const routes = uploadRoutes.stack;
    const uploadImageRoute = routes.find((layer: any) =>
      layer.route?.path === '/product-image' && layer.route?.methods?.post
    );
    expect(uploadImageRoute).toBeDefined();
  });

  it('should have DELETE /product-image/:filename route', () => {
    const routes = uploadRoutes.stack;
    const deleteImageRoute = routes.find((layer: any) =>
      layer.route?.path === '/product-image/:filename' && layer.route?.methods?.delete
    );
    expect(deleteImageRoute).toBeDefined();
  });

  it('should export a router', () => {
    expect(uploadRoutes).toBeDefined();
    expect(typeof uploadRoutes).toBe('function');
    expect(uploadRoutes.stack).toBeDefined();
  });

  it('should have 2 routes configured', () => {
    const routes = uploadRoutes.stack;
    const routeLayers = routes.filter((layer: any) => layer.route);
    expect(routeLayers).toHaveLength(2);
  });
});