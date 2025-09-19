// tests/list.test.js
require('./setup');
const handler = require('../handler');

describe('list handler', () => {
  it('returns 200 with empty array when no items exist', async () => {
    const { mockDocumentClient } = require('./setup');
    mockDocumentClient.scan.mockReturnValue({ 
      promise: () => Promise.resolve({ Items: [] }) 
    });

    const res = await handler.list();
    
    expect(res.statusCode).toBe(200);
    expect(res.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
    
    const body = JSON.parse(res.body);
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(0);
  });

  it('returns 200 with items when they exist', async () => {
    const mockItems = [
      { id: '1', name: 'Item 1', price: 10.99 },
      { id: '2', name: 'Item 2', price: 20.99 }
    ];

    const { mockDocumentClient } = require('./setup');
    mockDocumentClient.scan.mockReturnValue({ 
      promise: () => Promise.resolve({ Items: mockItems }) 
    });

    const res = await handler.list();
    
    expect(res.statusCode).toBe(200);
    expect(res.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
    
    const body = JSON.parse(res.body);
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(2);
    expect(body[0]).toEqual(mockItems[0]);
    expect(body[1]).toEqual(mockItems[1]);
  });

  it('handles DynamoDB errors gracefully', async () => {
    const { mockDocumentClient } = require('./setup');
    mockDocumentClient.scan.mockReturnValue({ 
      promise: () => Promise.reject(new Error('DynamoDB error')) 
    });

    const res = await handler.list();
    
    expect(res.statusCode).toBe(500);
    expect(res.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
    
    const body = JSON.parse(res.body);
    expect(body).toHaveProperty('error', 'Internal server error');
  });

  it('handles large number of items', async () => {
    const mockItems = Array.from({ length: 100 }, (_, i) => ({
      id: `item-${i}`,
      name: `Item ${i}`,
      price: i * 10.99
    }));

    const { mockDocumentClient } = require('./setup');
    mockDocumentClient.scan.mockReturnValue({ 
      promise: () => Promise.resolve({ Items: mockItems }) 
    });

    const res = await handler.list();
    
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body).toHaveLength(100);
  });
});
