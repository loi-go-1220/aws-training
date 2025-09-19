// tests/update.test.js
require('./setup');
const handler = require('../handler');

describe('update handler', () => {
  it('updates an item and returns 200 with updated attributes', async () => {
    const updatedItem = { id: 'test-id', name: 'Updated Item', price: 15.99 };

    const { mockDocumentClient } = require('./setup');
    mockDocumentClient.update.mockReturnValue({ 
      promise: () => Promise.resolve({ Attributes: updatedItem }) 
    });

    const event = {
      pathParameters: { id: 'test-id' },
      body: JSON.stringify({ name: 'Updated Item', price: 15.99 })
    };
    const res = await handler.update(event);
    
    expect(res.statusCode).toBe(200);
    expect(res.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
    
    const body = JSON.parse(res.body);
    expect(body).toEqual(updatedItem);
  });

  it('returns 400 when id is missing from path parameters', async () => {
    const event = {
      pathParameters: {},
      body: JSON.stringify({ name: 'Updated Item' })
    };
    const res = await handler.update(event);
    
    expect(res.statusCode).toBe(400);
    expect(res.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
    
    const body = JSON.parse(res.body);
    expect(body).toHaveProperty('error', 'id required in path');
  });

  it('returns 400 when path parameters is null', async () => {
    const event = {
      body: JSON.stringify({ name: 'Updated Item' })
    };
    const res = await handler.update(event);
    
    expect(res.statusCode).toBe(400);
    expect(res.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
    
    const body = JSON.parse(res.body);
    expect(body).toHaveProperty('error', 'id required in path');
  });

  it('returns 400 when no fields to update', async () => {
    const event = {
      pathParameters: { id: 'test-id' },
      body: JSON.stringify({})
    };
    const res = await handler.update(event);
    
    expect(res.statusCode).toBe(400);
    expect(res.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
    
    const body = JSON.parse(res.body);
    expect(body).toHaveProperty('error', 'no fields to update');
  });

  it('returns 400 when body is empty object', async () => {
    const event = {
      pathParameters: { id: 'test-id' },
      body: JSON.stringify({})
    };
    const res = await handler.update(event);
    
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body).toHaveProperty('error', 'no fields to update');
  });

  it('removes id from body if accidentally sent', async () => {
    const updatedItem = { id: 'test-id', name: 'Updated Item', price: 15.99 };

    const { mockDocumentClient } = require('./setup');
    mockDocumentClient.update.mockReturnValue({ 
      promise: () => Promise.resolve({ Attributes: updatedItem }) 
    });

    const event = {
      pathParameters: { id: 'test-id' },
      body: JSON.stringify({ id: 'different-id', name: 'Updated Item', price: 15.99 })
    };
    const res = await handler.update(event);
    
    expect(res.statusCode).toBe(200);
    
    // Verify that the update was called with the correct parameters
    expect(mockDocumentClient.update).toHaveBeenCalledWith(
      expect.objectContaining({
        Key: { id: 'test-id' },
        UpdateExpression: expect.stringMatching(/SET/),
        ExpressionAttributeNames: expect.objectContaining({ '#k0': 'name', '#k1': 'price' }),
        ExpressionAttributeValues: expect.objectContaining({ ':v0': 'Updated Item', ':v1': 15.99 }),
        ConditionExpression: 'attribute_exists(id)',
        ReturnValues: 'ALL_NEW',
        TableName: 'test-table'
      })
    );
  });

  it('returns 404 when item does not exist', async () => {
    const { mockDocumentClient } = require('./setup');
    const error = new Error('ConditionalCheckFailedException');
    error.code = 'ConditionalCheckFailedException';
    mockDocumentClient.update.mockReturnValue({ 
      promise: () => Promise.reject(error) 
    });

    const event = {
      pathParameters: { id: 'non-existent-id' },
      body: JSON.stringify({ name: 'Updated Item' })
    };
    const res = await handler.update(event);
    
    expect(res.statusCode).toBe(404);
    expect(res.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
    
    const body = JSON.parse(res.body);
    expect(body).toHaveProperty('error', 'item not found');
  });

  it('handles DynamoDB errors gracefully', async () => {
    const { mockDocumentClient } = require('./setup');
    mockDocumentClient.update.mockReturnValue({ 
      promise: () => Promise.reject(new Error('DynamoDB error')) 
    });

    const event = {
      pathParameters: { id: 'test-id' },
      body: JSON.stringify({ name: 'Updated Item' })
    };
    const res = await handler.update(event);
    
    expect(res.statusCode).toBe(500);
    expect(res.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
    
    const body = JSON.parse(res.body);
    expect(body).toHaveProperty('error', 'Internal server error');
  });

  it('handles invalid JSON in body', async () => {
    const event = {
      pathParameters: { id: 'test-id' },
      body: 'invalid json'
    };
    const res = await handler.update(event);
    
    expect(res.statusCode).toBe(500);
    const body = JSON.parse(res.body);
    expect(body).toHaveProperty('error', 'Internal server error');
  });

  it('updates multiple fields correctly', async () => {
    const updatedItem = { 
      id: 'test-id', 
      name: 'Updated Item', 
      price: 15.99, 
      description: 'Updated description',
      category: 'updated-category'
    };

    const { mockDocumentClient } = require('./setup');
    mockDocumentClient.update.mockReturnValue({ 
      promise: () => Promise.resolve({ Attributes: updatedItem }) 
    });

    const event = {
      pathParameters: { id: 'test-id' },
      body: JSON.stringify({ 
        name: 'Updated Item', 
        price: 15.99, 
        description: 'Updated description',
        category: 'updated-category'
      })
    };
    const res = await handler.update(event);
    
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body).toEqual(updatedItem);
  });
});
