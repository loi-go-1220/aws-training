// tests/create.test.js
const AWS = require('aws-sdk');
const handler = require('../handler'); // your handler.js

// Mock the DocumentClient.put method to avoid real AWS calls
beforeAll(() => {
  AWS.DynamoDB.DocumentClient.prototype.put = jest.fn(() => ({ promise: () => Promise.resolve() }));
});

describe('create handler', () => {
  it('creates an item and returns 201 with id', async () => {
    const event = { body: JSON.stringify({ name: 'Test Item', price: 1.23 }) };
    const res = await handler.create(event);
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body).toHaveProperty('id');
    expect(body.name).toBe('Test Item');
  });

  it('returns 400 when name missing', async () => {
    const event = { body: JSON.stringify({}) };
    const res = await handler.create(event);
    expect(res.statusCode).toBe(400);
  });
});
