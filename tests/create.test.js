// tests/create.test.js
require('./setup');
const handler = require('../handler');

describe('create handler', () => {
  it('creates an item and returns 201 with id', async () => {
    const event = { body: JSON.stringify({ name: 'Test Item', price: 1.23 }) };
    const res = await handler.create(event);
    
    expect(res.statusCode).toBe(201);
    expect(res.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
    
    const body = JSON.parse(res.body);
    expect(body).toHaveProperty('id');
    expect(body.name).toBe('Test Item');
    expect(body.price).toBe(1.23);
  });

  it('returns 400 when name is missing', async () => {
    const event = { body: JSON.stringify({ price: 1.23 }) };
    const res = await handler.create(event);
    
    expect(res.statusCode).toBe(400);
    expect(res.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
    
    const body = JSON.parse(res.body);
    expect(body).toHaveProperty('error', 'name required');
  });

  it('returns 400 when body is empty', async () => {
    const event = { body: JSON.stringify({}) };
    const res = await handler.create(event);
    
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body).toHaveProperty('error', 'name required');
  });

  it('returns 400 when body is invalid JSON', async () => {
    const event = { body: 'invalid json' };
    const res = await handler.create(event);
    
    expect(res.statusCode).toBe(500);
    const body = JSON.parse(res.body);
    expect(body).toHaveProperty('error', 'Internal server error');
  });

  it('handles additional fields correctly', async () => {
    const event = { 
      body: JSON.stringify({ 
        name: 'Test Item', 
        price: 1.23, 
        description: 'A test item',
        category: 'test'
      }) 
    };
    const res = await handler.create(event);
    
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body).toHaveProperty('id');
    expect(body.name).toBe('Test Item');
    expect(body.price).toBe(1.23);
    expect(body.description).toBe('A test item');
    expect(body.category).toBe('test');
  });

  it('handles DynamoDB errors gracefully', async () => {
    const { mockDocumentClient } = require('./setup');
    mockDocumentClient.put.mockReturnValue({ 
      promise: () => Promise.reject(new Error('DynamoDB error')) 
    });

    const event = { body: JSON.stringify({ name: 'Test Item' }) };
    const res = await handler.create(event);
    
    expect(res.statusCode).toBe(500);
    const body = JSON.parse(res.body);
    expect(body).toHaveProperty('error', 'Internal server error');
  });
});
