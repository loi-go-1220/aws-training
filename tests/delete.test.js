// tests/delete.test.js
require('./setup');
const handler = require('../handler');

describe('delete handler', () => {
  it('deletes an item and returns 204', async () => {
    const { mockDocumentClient } = require('./setup');
    mockDocumentClient.delete.mockReturnValue({ 
      promise: () => Promise.resolve() 
    });

    const event = { pathParameters: { id: 'test-id' } };
    const res = await handler.remove(event);
    
    expect(res.statusCode).toBe(204);
    expect(res.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
    expect(res.body).toBe('');
  });

  it('returns 400 when id is missing from path parameters', async () => {
    const event = { pathParameters: {} };
    const res = await handler.remove(event);
    
    expect(res.statusCode).toBe(400);
    expect(res.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
    
    const body = JSON.parse(res.body);
    expect(body).toHaveProperty('error', 'id required in path');
  });

  it('returns 400 when path parameters is null', async () => {
    const event = {};
    const res = await handler.remove(event);
    
    expect(res.statusCode).toBe(400);
    expect(res.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
    
    const body = JSON.parse(res.body);
    expect(body).toHaveProperty('error', 'id required in path');
  });

  it('handles DynamoDB errors gracefully', async () => {
    const { mockDocumentClient } = require('./setup');
    mockDocumentClient.delete.mockReturnValue({ 
      promise: () => Promise.reject(new Error('DynamoDB error')) 
    });

    const event = { pathParameters: { id: 'test-id' } };
    const res = await handler.remove(event);
    
    expect(res.statusCode).toBe(500);
    expect(res.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
    
    const body = JSON.parse(res.body);
    expect(body).toHaveProperty('error', 'Internal server error');
  });

  it('handles empty string id', async () => {
    const event = { pathParameters: { id: '' } };
    const res = await handler.remove(event);
    
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body).toHaveProperty('error', 'id required in path');
  });

  it('handles special characters in id', async () => {
    const { mockDocumentClient } = require('./setup');
    mockDocumentClient.delete.mockReturnValue({ 
      promise: () => Promise.resolve() 
    });

    const event = { pathParameters: { id: 'test-id-123!@#' } };
    const res = await handler.remove(event);
    
    expect(res.statusCode).toBe(204);
    expect(res.body).toBe('');
  });

  it('calls DynamoDB delete with correct parameters', async () => {
    const { mockDocumentClient } = require('./setup');
    mockDocumentClient.delete.mockReturnValue({ 
      promise: () => Promise.resolve() 
    });

    const event = { pathParameters: { id: 'test-id' } };
    await handler.remove(event);
    
    expect(mockDocumentClient.delete).toHaveBeenCalledWith({
      TableName: process.env.TABLE_NAME,
      Key: { id: 'test-id' }
    });
  });

  it('handles very long id', async () => {
    const longId = 'a'.repeat(1000);
    const { mockDocumentClient } = require('./setup');
    mockDocumentClient.delete.mockReturnValue({ 
      promise: () => Promise.resolve() 
    });

    const event = { pathParameters: { id: longId } };
    const res = await handler.remove(event);
    
    expect(res.statusCode).toBe(204);
    expect(res.body).toBe('');
  });
});
