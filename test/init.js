/* istanbul ignore file */
process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1";
const DynamoDB = require("aws-sdk/clients/dynamodb");
const definition = require("../examples/common/definition.json");
const customKeys = require("./definitions/customkeys.json");
const noSortKeys = require("./definitions/nosortkey.json");
const noStringKeys = require("./definitions/nostringkeys.json");
const keyNamesAttributeNames = require("./definitions/keynamesattributenames.json");
const leadingUnderscoreKeys = require("./definitions/leadingunderscorekeys.json");
const localSecondaryIndexes = require("./definitions/localsecondaryindexes.json");
const keysOnly = require("./definitions/keysonly.json");
const castKeys = require("./definitions/castkeys.json");

if (
  typeof process.env.LOCAL_DYNAMO_ENDPOINT !== "string" &&
  !process.env.LOCAL_DYNAMO_ENDPOINT.length
) {
  throw new Error(
    "Tests are only intended to be used against dyanmodb local to prevent needless cost. If you would like to proceed without dynamodb-local, remove this line.",
  );
}

const configuration = {
  endpoint: process.env.LOCAL_DYNAMO_ENDPOINT || "http://localhost:8000",
  region: "us-east-1",
};

const client = new DynamoDB.DocumentClient(configuration);
const dynamodb = new DynamoDB(configuration);

function createTableManager(dynamodb, table) {
  return {
    async exists() {
      let tables = await dynamodb.listTables().promise();
      return !!(tables.TableNames || []).includes(table);
    },
    async drop() {
      return dynamodb.deleteTable({ TableName: table }).promise();
    },
    async create(tableDefinition) {
      return dynamodb
        .createTable({ ...tableDefinition, TableName: table })
        .promise();
    },
  };
}

async function createTable(dynamodb, table, definition) {
  try {
    if (configuration.endpoint !== undefined) {
      let tableManager = createTableManager(dynamodb, table);
      let exists = await tableManager.exists();
      if (exists) {
        await tableManager.drop();
      }
      await tableManager.create(definition);
    } else {
      throw new Error("No table specified");
    }
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
}

async function main() {
  await Promise.all([
    createTable(dynamodb, "electro", definition),
    createTable(dynamodb, "electro_customkeys", customKeys),
    createTable(dynamodb, "electro_nosort", noSortKeys),
    createTable(dynamodb, "electro_nostringkeys", noStringKeys),
    createTable(dynamodb, "electro_keynamesattributenames", keyNamesAttributeNames),
    createTable(dynamodb, "electro_leadingunderscorekeys", leadingUnderscoreKeys),
    createTable(dynamodb, "electro_localsecondaryindex", localSecondaryIndexes),
    createTable(dynamodb, "electro_keysonly", keysOnly),
    createTable(dynamodb, "electro_castkeys", castKeys),
  ]);
}

main().catch(console.log);
