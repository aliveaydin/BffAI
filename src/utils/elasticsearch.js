const { Client } = require("@elastic/elasticsearch");
const elasticUri = process.env.ELASTIC_URI || "http://localhost:9200";
const elasticUser = process.env.ELASTIC_USER || "elastic";
const elasticPwd = process.env.ELASTIC_PWD || "zci+imLCfkbSC=RxLHjH";

const elasticClient = new Client({
  node: elasticUri,
  requestTimeout: 10000,
  auth: { username: elasticUser, password: elasticPwd },
  tls: {
    ca: process.env.ELASTIC_CERT,
    rejectUnauthorized: false,
  },
});

const checkIndexExists = async function (indexName) {
  return await elasticClient.indices.exists({
    index: indexName,
  });
};

const createIndex = async function (indexName) {
  return await elasticClient.indices.create({
    index: indexName,
  });
};

const mapping = async function (indexName, mapping) {
  return await elasticClient.indices.putMapping({
    index: indexName,
    body: mapping,
  });
};

const search = async function (indexName, searchQuery) {
  return await elasticClient.search({
    index: indexName,
    body: searchQuery,
  });
};

const deleteIndex = async function (indexName) {
  return await elasticClient.indices.delete({
    index: indexName,
  });
};

const createDocument = async function (indexName, body, id) {
  return await elasticClient.index({
    index: indexName,
    body: body,
    id: id,
  });
};

const deleteDocument = async function (indexName, id) {
  return await elasticClient.delete({
    index: indexName,
    id: id,
  });
};

const updateDocument = async function (indexName, id, body) {
  return await elasticClient.update({
    index: indexName,
    id: id,
    body: body,
  });
};

const bulk = async function (indexName, body) {
  return await elasticClient.bulk({
    index: indexName,
    body: body,
  });
};

const allİndices = async function () {
  return await elasticClient.cat.indices({ format: "json" });
};

module.exports = {
  elasticClient,
  search,
  mapping,
  checkIndexExists,
  createIndex,
  deleteIndex,
  deleteDocument,
  updateDocument,
  bulk,
  createDocument,
  allİndices
};
