const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");
const db = new AWS.DynamoDB.DocumentClient();
const TABLE = process.env.TABLE_NAME;

exports.create = async (event) => {
  const body = JSON.parse(event.body || "{}");
  if (!body.name) {
    return { statusCode: 400, body: JSON.stringify({ error: "name required" }) };
  }
  const item = { id: uuidv4(), ...body };
  await db.put({ TableName: TABLE, Item: item }).promise();
  return { statusCode: 201, body: JSON.stringify(item) };
};

exports.list = async () => {
  const res = await db.scan({ TableName: TABLE }).promise();
  return { statusCode: 200, body: JSON.stringify(res.Items) };
};

exports.get = async (event) => {
  const { id } = event.pathParameters;
  const res = await db.get({ TableName: TABLE, Key: { id } }).promise();
  if (!res.Item) return { statusCode: 404, body: JSON.stringify({ error: "not found" }) };
  return { statusCode: 200, body: JSON.stringify(res.Item) };
};

exports.remove = async (event) => {
  const { id } = event.pathParameters;
  await db.delete({ TableName: TABLE, Key: { id } }).promise();
  return { statusCode: 204, body: "" };
};

exports.update = async (event) => {
  const AWS = require("aws-sdk");
  const db = new AWS.DynamoDB.DocumentClient();
  const TABLE = process.env.TABLE_NAME;

  try {
    const id = event.pathParameters && event.pathParameters.id;
    if (!id) {
      return { statusCode: 400, body: JSON.stringify({ error: "id required in path" }) };
    }

    const body = JSON.parse(event.body || "{}");
    // remove id if accidentally sent in body
    delete body.id;

    const keys = Object.keys(body);
    if (keys.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: "no fields to update" }) };
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
    return { statusCode: 200, body: JSON.stringify(result.Attributes) };

  } catch (err) {
    // handle the conditional check failure (item doesn't exist)
    if (err && err.code === "ConditionalCheckFailedException") {
      return { statusCode: 404, body: JSON.stringify({ error: "item not found" }) };
    }
    console.error("update error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Internal server error" }) };
  }
};