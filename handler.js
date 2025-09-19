const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");
const db = new AWS.DynamoDB.DocumentClient();
const TABLE = process.env.TABLE_NAME;

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
};

// Helper function to create response with CORS headers
const createResponse = (statusCode, body, headers = {}) => ({
  statusCode,
  headers: { ...corsHeaders, ...headers },
  body: typeof body === 'string' ? body : JSON.stringify(body)
});

exports.create = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");
    if (!body.name) {
      return createResponse(400, { error: "name required" });
    }
    const item = { id: uuidv4(), ...body };
    await db.put({ TableName: TABLE, Item: item }).promise();
    return createResponse(201, item);
  } catch (error) {
    console.error('Create error:', error);
    return createResponse(500, { error: "Internal server error" });
  }
};

exports.list = async () => {
  try {
    const res = await db.scan({ TableName: TABLE }).promise();
    return createResponse(200, res.Items);
  } catch (error) {
    console.error('List error:', error);
    return createResponse(500, { error: "Internal server error" });
  }
};

exports.get = async (event) => {
  try {
    const { id } = event.pathParameters;
    if (!id) {
      return createResponse(400, { error: "id required in path" });
    }
    const res = await db.get({ TableName: TABLE, Key: { id } }).promise();
    if (!res.Item) return createResponse(404, { error: "not found" });
    return createResponse(200, res.Item);
  } catch (error) {
    console.error('Get error:', error);
    return createResponse(500, { error: "Internal server error" });
  }
};

exports.remove = async (event) => {
  try {
    const { id } = event.pathParameters;
    if (!id) {
      return createResponse(400, { error: "id required in path" });
    }
    await db.delete({ TableName: TABLE, Key: { id } }).promise();
    return createResponse(204, "");
  } catch (error) {
    console.error('Delete error:', error);
    return createResponse(500, { error: "Internal server error" });
  }
};

exports.update = async (event) => {
  try {
    const id = event.pathParameters && event.pathParameters.id;
    if (!id) {
      return createResponse(400, { error: "id required in path" });
    }

    const body = JSON.parse(event.body || "{}");
    // remove id if accidentally sent in body
    delete body.id;

    const keys = Object.keys(body);
    if (keys.length === 0) {
      return createResponse(400, { error: "no fields to update" });
    }

    const ExpressionAttributeNames = {};
    const ExpressionAttributeValues = {};
    const setExpr = keys.map((k, i) => {
      const nameKey = `#k${i}`;
      const valKey = `:v${i}`;
      ExpressionAttributeNames[nameKey] = k;
      ExpressionAttributeValues[valKey] = body[k];
      return `${nameKey} = ${valKey}`;
    }).join(", ");

    const params = {
      TableName: TABLE,
      Key: { id },
      UpdateExpression: "SET " + setExpr,
      ExpressionAttributeNames,
      ExpressionAttributeValues,
      ConditionExpression: "attribute_exists(id)", // prevent creating a new item
      ReturnValues: "ALL_NEW"
    };

    const result = await db.update(params).promise();
    return createResponse(200, result.Attributes);

  } catch (err) {
    // handle the conditional check failure (item doesn't exist)
    if (err && err.code === "ConditionalCheckFailedException") {
      return createResponse(404, { error: "item not found" });
    }
    console.error("update error:", err);
    return createResponse(500, { error: "Internal server error" });
  }
};

// OPTIONS handler for CORS preflight requests
exports.options = async () => {
  return createResponse(200, "");
};