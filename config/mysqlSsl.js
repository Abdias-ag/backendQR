'use strict';

const getMysqlSslOptions = () => {
  if (process.env.DB_SSL !== 'true') {
    return undefined;
  }

  const ca = process.env.DB_SSL_CA_BASE64
    ? Buffer.from(process.env.DB_SSL_CA_BASE64, 'base64').toString('utf8')
    : process.env.DB_SSL_CA;

  return {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
    ...(ca ? { ca } : {}),
  };
};

module.exports = { getMysqlSslOptions };