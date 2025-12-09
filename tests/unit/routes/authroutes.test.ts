import authRoutes from '../../../src/routes/authRoutes';

describe('Auth Routes', () => {
  it('should have POST /register route', () => {
    const routes = authRoutes.stack;
    const registerRoute = routes.find((layer: any) =>
      layer.route?.path === '/register' && layer.route?.methods?.post
    );
    expect(registerRoute).toBeDefined();
  });

  it('should have POST /login route', () => {
    const routes = authRoutes.stack;
    const loginRoute = routes.find((layer: any) =>
      layer.route?.path === '/login' && layer.route?.methods?.post
    );
    expect(loginRoute).toBeDefined();
  });

  it('should have GET /verify-email route', () => {
    const routes = authRoutes.stack;
    const verifyRoute = routes.find((layer: any) =>
      layer.route?.path === '/verify-email' && layer.route?.methods?.get
    );
    expect(verifyRoute).toBeDefined();
  });

  it('should have GET /profile route', () => {
    const routes = authRoutes.stack;
    const profileRoute = routes.find((layer: any) =>
      layer.route?.path === '/profile' && layer.route?.methods?.get
    );
    expect(profileRoute).toBeDefined();
  });

  it('should export a router', () => {
    expect(authRoutes).toBeDefined();
    expect(typeof authRoutes).toBe('function');
    expect(authRoutes.stack).toBeDefined();
  });

  it('should have 4 routes configured', () => {
    const routes = authRoutes.stack;
    const routeLayers = routes.filter((layer: any) => layer.route);
    expect(routeLayers).toHaveLength(4);
  });
});