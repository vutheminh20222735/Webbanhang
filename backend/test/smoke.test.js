test('smoke: environment', () => {
  expect(process.env.NODE_ENV || 'development').toBeDefined();
});
