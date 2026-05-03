const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/db');


beforeAll(async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id         SERIAL PRIMARY KEY,
      name       VARCHAR(100)        NOT NULL,
      email      VARCHAR(150) UNIQUE NOT NULL,
      password   VARCHAR(255)        NOT NULL,
      created_at TIMESTAMPTZ         NOT NULL DEFAULT NOW()
    )
  `);
});


afterEach(async () => {
  await pool.query('DELETE FROM users WHERE email LIKE $1', ['%@test.com']);
});


afterAll(async () => {
  await pool.end();
});

describe('POST /users', () => {
  const validUser = {
    name: 'Aawish waseem',
    email: 'Aawish@test.com',
    password: 'Awish9090',
  };

  test('201 - successfully creates a user and stores it in the database', async () => {
    const res = await request(app).post('/users').send(validUser);

    
    expect(res.statusCode).toBe(201);
    expect(res.body.user).toMatchObject({
      name: validUser.name,
      email: validUser.email,
    });
    expect(res.body.user.id).toBeDefined();

    
    const dbResult = await pool.query('SELECT * FROM users WHERE email = $1', [
      validUser.email,
    ]);
    expect(dbResult.rows).toHaveLength(1);
    expect(dbResult.rows[0].name).toBe(validUser.name);
    expect(dbResult.rows[0].email).toBe(validUser.email);
  });

  test('400 - returns error when required fields are missing', async () => {
    const res = await request(app)
      .post('/users')
      .send({ name: 'No Email User' }); 

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test('409 - returns error when email is already taken', async () => {
    
    await request(app).post('/users').send(validUser);

    
    const res = await request(app).post('/users').send(validUser);

    expect(res.statusCode).toBe(409);
    expect(res.body.error).toMatch(/email/i);
  });
});