const express = require('express');
const { Pool } = require('pg');
const redis = require('redis');

const app = express();
const port = 3000;

// PostgreSQL 연결
const pool = new Pool({
    host: process.env.DB_HOST || 'db',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'mydatabase',
    user: process.env.DB_USERNAME || 'myuser',
    password: process.env.DB_PASSWORD || 'mypassword',
});

// Redis 연결
const redisClient = redis.createClient({
    socket: {
        host: process.env.REDIS_HOST || 'redis',
        port: process.env.REDIS_PORT || 6379,
    }
});
redisClient.connect().catch(console.error);

app.use(express.json());

// 기본 라우트
app.get('/', async (req, res) => {
    res.json({ message: 'Hello from Node.js service!' });
});

// 사용자 조회 API (Redis 캐싱 적용)
app.get('/users/:id', async (req, res) => {
    const userId = req.params.id;
    try {
        const cachedUser = await redisClient.get(`user:${userId}`);
        if (cachedUser) {
            return res.json(JSON.parse(cachedUser));
        }
        
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        await redisClient.setEx(`user:${userId}`, 60, JSON.stringify(result.rows[0]));
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 사용자 추가 API
app.post('/users', async (req, res) => {
    const { name, email } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
            [name, email]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 서버 시작
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
