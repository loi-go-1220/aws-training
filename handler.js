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
