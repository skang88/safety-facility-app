/**
 * MSSQL configuration helper.
 * Provides a mock pool when MSSQL is not configured/needed,
 * avoiding the need to install the 'mssql' package unless it is actually used.
 */
const getMssqlPool = async () => {
  const host = process.env.MSSQL_HOST;
  const user = process.env.MSSQL_USER;
  const password = process.env.MSSQL_PASSWORD;
  const database = process.env.MSSQL_DATABASE;

  if (!host || !user || !password || !database) {
    // Return a mock pool so that the application doesn't fail or require 'mssql' package.
    return {
      request: () => {
        const reqObj = {
          input: () => reqObj,
          query: async () => ({ recordset: [] })
        };
        return reqObj;
      },
      query: async () => ({ recordset: [] })
    };
  }

  // If environment variables are set, dynamically require 'mssql' and connect
  try {
    const sql = require('mssql');
    const config = {
      server: host,
      user,
      password,
      database,
      options: {
        encrypt: true,
        trustServerCertificate: true
      }
    };
    return new sql.ConnectionPool(config).connect();
  } catch (err) {
    console.error('Failed to load mssql or connect:', err);
    throw err;
  }
};

module.exports = getMssqlPool;
