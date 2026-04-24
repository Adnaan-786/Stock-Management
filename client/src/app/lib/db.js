import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: { rejectUnauthorized: false },
});

export const executeQuery = async (query, params = []) => {
  const client = await pool.connect();
  try {
    const res = await client.query(query, params);
    // Return array of arrays like python mysql connector cursor.fetchall()
    // but pg returns objects. Python mysql returned tuples with row[0], row[1]
    // Wait, the Python queries expect row[0], row[1]
    // So we need to return array configuration
    return res.rows;
  } finally {
    client.release();
  }
};

// Use pg's rowMode: 'array' to return an array of values instead of keys
export const executeQueryArrayMode = async (query, params = []) => {
  const client = await pool.connect();
  try {
    const res = await client.query({
      text: query,
      values: params,
      rowMode: 'array'
    });
    return res.rows;
  } finally {
    client.release();
  }
};

export const StandardResponse = (status, data, message, statusCode = 200) => {
  return Response.json(
    { status, data, message },
    { status: statusCode }
  );
};
