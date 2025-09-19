// tests/get.test.js
require('./setup');
const handler = require('../handler');

describe('get handler', () => {
  it('returns 200 with item when it exists', async () => {
    const mockItem = { id: 'test-id', name: 'Test Item', price: 10.99 };

    const { mockDocumentClient } = require('./setup');
    mockDocumentClient.get.mockReturnValue({ 
      promise: () => Promise.resolve({ Item: mockItem }) 
    });

    const event = { pathParameters: { id: 'test-id' } };
    const res = await handler.get(event);
    
    expect(res.statusCode).toBe(200);
    expect(res.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
    
    const body = JSON.parse(res.body);
    expect(body).toEqual(mockItem);
  });

  it('returns 404 when item does not exist', async () => {
    const { mockDocumentClient } = require('./setup');
    mockDocumentClient.get.mockReturnValue({ 
      promise: () => Promise.resolve({ Item: null }) 
    });

    const event = { pathParameters: { id: 'non-existent-id' } };
    const res = await handler.get(event);
    
    expect(res.statusCode).toBe(404);
    expect(res.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
    
    const body = JSON.parse(res.body);
    expect(body).toHaveProperty('error', 'not found');
  });

  it('returns 400 when id is missing from path parameters', async () => {
    const event = { pathParameters: {} };
    const res = await handler.get(event);
    
    expect(res.statusCode).toBe(400);
    expect(res.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
    
    const body = JSON.parse(res.body);
    expect(body).toHaveProperty('error', 'id required in path');
  });

  it('returns 400 when path parameters is null', async () => {
    const event = {};
    const res = await handler.get(event);
    
    expect(res.statusCode).toBe(400);
    expect(res.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
    
    const body = JSON.parse(res.body);
    expect(body).toHaveProperty('error', 'id required in path');
  });

  it('handles DynamoDB errors gracefully', async () => {
    const { mockDocumentClient } = require('./setup');
    mockDocumentClient.get.mockReturnValue({ 
      promise: () => Promise.reject(new Error('DynamoDB error')) 
    });

    const event = { pathParameters: { id: 'test-id' } };
    const res = await handler.get(event);
    
    expect(res.statusCode).toBe(500);
    expect(res.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
    
    const body = JSON.parse(res.body);
    expect(body).toHaveProperty('error', 'Internal server error');
  });

  it('handles empty string id', async () => {
    const event = { pathParameters: { id: '' } };
    const res = await handler.get(event);
    
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body).toHaveProperty('error', 'id required in path');
  });

  it('handles special characters in id', async () => {
    const mockItem = { id: 'test-id-123!@#', name: 'Special Item', price: 10.99 };

    const { mockDocumentClient } = require('./setup');
    mockDocumentClient.get.mockReturnValue({ 
      promise: () => Promise.resolve({ Item: mockItem }) 
    });

    const event = { pathParameters: { id: 'test-id-123!@#' } };
    const res = await handler.get(event);
    
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body).toEqual(mockItem);
  });
});
