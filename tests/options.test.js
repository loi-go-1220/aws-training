// tests/options.test.js
require('./setup');
const handler = require('../handler');

describe('options handler', () => {
  it('returns 200 with CORS headers for preflight requests', async () => {
    const res = await handler.options();
    
    expect(res.statusCode).toBe(200);
    expect(res.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
    expect(res.headers).toHaveProperty('Access-Control-Allow-Headers', 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token');
    expect(res.headers).toHaveProperty('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    expect(res.body).toBe('');
  });

  it('handles multiple calls correctly', async () => {
    const res1 = await handler.options();
    const res2 = await handler.options();
    
    expect(res1.statusCode).toBe(200);
    expect(res2.statusCode).toBe(200);
    expect(res1).toEqual(res2);
  });
});
