// tests/integration.test.js
require('./setup');
const handler = require('../handler');

describe('Integration Tests - Complete CRUD Flow', () => {
  let { mockDocumentClient } = require('./setup');
  let createdItemId;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should complete full CRUD lifecycle', async () => {
    // 1. CREATE - Create a new item
    const createEvent = {
      body: JSON.stringify({
        name: 'Integration Test Item',
        price: 29.99,
        description: 'A test item for integration testing',
        category: 'test'
      })
    };

    // Mock successful creation
    mockDocumentClient.put.mockReturnValue({
      promise: () => Promise.resolve()
    });

    const createResponse = await handler.create(createEvent);
    expect(createResponse.statusCode).toBe(201);
    
    const createdItem = JSON.parse(createResponse.body);
    expect(createdItem).toHaveProperty('id');
    expect(createdItem.name).toBe('Integration Test Item');
    expect(createdItem.price).toBe(29.99);
    
    createdItemId = createdItem.id;

    // 2. READ - Get the created item
    const getEvent = { pathParameters: { id: createdItemId } };
    
    // Mock successful retrieval
    mockDocumentClient.get.mockReturnValue({
      promise: () => Promise.resolve({ Item: createdItem })
    });

    const getResponse = await handler.get(getEvent);
    expect(getResponse.statusCode).toBe(200);
    
    const retrievedItem = JSON.parse(getResponse.body);
    expect(retrievedItem.id).toBe(createdItemId);
    expect(retrievedItem.name).toBe('Integration Test Item');

    // 3. UPDATE - Update the item
    const updateEvent = {
      pathParameters: { id: createdItemId },
      body: JSON.stringify({
        name: 'Updated Integration Test Item',
        price: 39.99,
        description: 'Updated description'
      })
    };

    const updatedItem = {
      ...createdItem,
      name: 'Updated Integration Test Item',
      price: 39.99,
      description: 'Updated description'
    };

    // Mock successful update
    mockDocumentClient.update.mockReturnValue({
      promise: () => Promise.resolve({ Attributes: updatedItem })
    });

    const updateResponse = await handler.update(updateEvent);
    expect(updateResponse.statusCode).toBe(200);
    
    const updatedItemResponse = JSON.parse(updateResponse.body);
    expect(updatedItemResponse.name).toBe('Updated Integration Test Item');
    expect(updatedItemResponse.price).toBe(39.99);

    // 4. LIST - List all items (including our updated item)
    const mockItems = [updatedItem, { id: 'other-item', name: 'Other Item', price: 10.99 }];
    
    // Mock successful scan
    mockDocumentClient.scan.mockReturnValue({
      promise: () => Promise.resolve({ Items: mockItems })
    });

    const listResponse = await handler.list();
    expect(listResponse.statusCode).toBe(200);
    
    const items = JSON.parse(listResponse.body);
    expect(items).toHaveLength(2);
    expect(items.find(item => item.id === createdItemId)).toBeDefined();

    // 5. DELETE - Delete the item
    const deleteEvent = { pathParameters: { id: createdItemId } };
    
    // Mock successful deletion
    mockDocumentClient.delete.mockReturnValue({
      promise: () => Promise.resolve()
    });

    const deleteResponse = await handler.remove(deleteEvent);
    expect(deleteResponse.statusCode).toBe(204);
    expect(deleteResponse.body).toBe('');

    // 6. VERIFY - Try to get the deleted item (should return 404)
    mockDocumentClient.get.mockReturnValue({
      promise: () => Promise.resolve({ Item: null })
    });

    const getDeletedResponse = await handler.get(getEvent);
    expect(getDeletedResponse.statusCode).toBe(404);
  });

  it('should handle error scenarios gracefully', async () => {
    // Test create with missing name
    const createEvent = { body: JSON.stringify({ price: 10.99 }) };
    const createResponse = await handler.create(createEvent);
    expect(createResponse.statusCode).toBe(400);

    // Test get with missing id
    const getEvent = { pathParameters: {} };
    const getResponse = await handler.get(getEvent);
    expect(getResponse.statusCode).toBe(400);

    // Test update with no fields
    const updateEvent = {
      pathParameters: { id: 'test-id' },
      body: JSON.stringify({})
    };
    const updateResponse = await handler.update(updateEvent);
    expect(updateResponse.statusCode).toBe(400);

    // Test delete with missing id
    const deleteEvent = { pathParameters: {} };
    const deleteResponse = await handler.remove(deleteEvent);
    expect(deleteResponse.statusCode).toBe(400);
  });

  it('should handle DynamoDB errors in sequence', async () => {
    // Mock DynamoDB errors for all operations
    mockDocumentClient.put.mockReturnValue({
      promise: () => Promise.reject(new Error('DynamoDB error'))
    });
    mockDocumentClient.get.mockReturnValue({
      promise: () => Promise.reject(new Error('DynamoDB error'))
    });
    mockDocumentClient.scan.mockReturnValue({
      promise: () => Promise.reject(new Error('DynamoDB error'))
    });
    mockDocumentClient.update.mockReturnValue({
      promise: () => Promise.reject(new Error('DynamoDB error'))
    });
    mockDocumentClient.delete.mockReturnValue({
      promise: () => Promise.reject(new Error('DynamoDB error'))
    });

    // Test all operations return 500 on DynamoDB errors
    const createResponse = await handler.create({ body: JSON.stringify({ name: 'Test' }) });
    expect(createResponse.statusCode).toBe(500);

    const getResponse = await handler.get({ pathParameters: { id: 'test' } });
    expect(getResponse.statusCode).toBe(500);

    const listResponse = await handler.list();
    expect(listResponse.statusCode).toBe(500);

    const updateResponse = await handler.update({ 
      pathParameters: { id: 'test' }, 
      body: JSON.stringify({ name: 'Updated' }) 
    });
    expect(updateResponse.statusCode).toBe(500);

    const deleteResponse = await handler.remove({ pathParameters: { id: 'test' } });
    expect(deleteResponse.statusCode).toBe(500);
  });
});
