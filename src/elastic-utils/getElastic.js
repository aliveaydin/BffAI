// getElastic.js
const { HttpServerError, NotAuthorizedError, BadRequestError, NotFoundError } = require('../utils/errors');
const { client } = require('../../redis');
const { search } = require("../utils/elasticsearch");

const getElastic = async (indexName, indexValue, opts = {}) => {
  try {
    const { byField } = opts;
    let searchQuery;

    if (!byField) {
      searchQuery = {
        query: {
          ids: {
            values: [indexValue]
          }
        }
      };
    } else {
      searchQuery = {
        query: {
          term: {
            [byField]: indexValue
          }
        }
      };
    }


    const result = await search(indexName, searchQuery);

    let allDocs = result?.hits?.hits.map((hit) => hit._source) || [];
    if(!byField) allDocs = allDocs[0];
    return allDocs;
  } catch (error) {
    console.error("getElastic error =>", error);
    throw error;
  }
};

module.exports = getElastic;
