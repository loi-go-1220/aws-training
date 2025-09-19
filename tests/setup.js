// tests/setup.js
// Set up environment variables for testing
process.env.TABLE_NAME = 'test-table';
process.env.AWS_REGION = 'us-east-1';

// Mock AWS DynamoDB DocumentClient
const mockDocumentClient = {
  put: jest.fn(),
  get: jest.fn(),
  scan: jest.fn(),
  delete: jest.fn(),
  update: jest.fn()
};

// Mock the entire AWS SDK module
jest.mock('aws-sdk', () => ({
  DynamoDB: {
    DocumentClient: jest.fn(() => mockDocumentClient)
  }
}));

// Set up default mock implementations
beforeAll(() => {
  mockDocumentClient.put.mockReturnValue({ promise: () => Promise.resolve() });
  mockDocumentClient.get.mockReturnValue({ promise: () => Promise.resolve({ Item: null }) });
  mockDocumentClient.scan.mockReturnValue({ promise: () => Promise.resolve({ Items: [] }) });
  mockDocumentClient.delete.mockReturnValue({ promise: () => Promise.resolve() });
  mockDocumentClient.update.mockReturnValue({ promise: () => Promise.resolve({ Attributes: {} }) });
});

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  
  // Reset to default mock implementations
  mockDocumentClient.put.mockReturnValue({ promise: () => Promise.resolve() });
  mockDocumentClient.get.mockReturnValue({ promise: () => Promise.resolve({ Item: null }) });
  mockDocumentClient.scan.mockReturnValue({ promise: () => Promise.resolve({ Items: [] }) });
  mockDocumentClient.delete.mockReturnValue({ promise: () => Promise.resolve() });
  mockDocumentClient.update.mockReturnValue({ promise: () => Promise.resolve({ Attributes: {} }) });
});

// Export the mock for use in individual test files
module.exports = { mockDocumentClient };
