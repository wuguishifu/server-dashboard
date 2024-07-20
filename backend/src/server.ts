import bcrypt from 'bcrypt';
import connect from 'connect-sqlite3';
import express from 'express';
import session, { Store } from 'express-session';
import http from 'http';
import path from 'path';
import sqlite3 from 'sqlite3';

const SQLiteStore = connect(session);

sqlite3.verbose();
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run('CREATE TABLE IF NOT EXISTS users (email TEXT PRIMARY KEY, password TEXT)');
});

const app = express();
const server = http.createServer(app);

app.use(express.urlencoded({ extended: false }));
app.use(express.json({ limit: '1mb' }));

app.use(session({
    store: new SQLiteStore({
        db: 'sessions.db',
        dir: './sessions',
    }) as Store,
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.HTTPS === 'true',
        maxAge: 30 * 60 * 1000, // 30 min expiration
    },
}));

app.get('/ping', (_, res) => {
    res.send({
        message: 'pong',
        time: new Date().toISOString(),
    });
});

app.get('/users', async (_, res) => {
    db.all('SELECT email FROM users', [], (error, rows) => {
        if (error) {
            console.error(error);
            res.status(500).send({ error: error.message });
        } else {
            res.send(rows);
        }
    });
});

app.post('/users', async (req, res) => {
    const { email, password } = req.body;

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const stmt = db.prepare('INSERT INTO users (email, password) VALUES (?, ?)');
    stmt.run(
        [email, hash],
        (error) => {
            if (error) {
                if (error.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).send({ error: 'User already exists' });
                } else {
                    console.error(error);
                    return res.status(500).send({ error: error.message });
                }
            }
            return res.status(201).send({ email });
        },
    );
    stmt.finalize();
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    db.get<{ email: string, password: string }>(
        'SELECT * FROM users WHERE email = ?',
        [email],
        async (error, user) => {
            if (error) {
                console.error(error);
                return res.status(500).send({ error: 'database error' });
            }

            if (!user) return res.status(400).send({ error: 'Invalid email or password' });

            const valid = await bcrypt.compare(password, user.password);
            if (!valid) return res.status(400).send({ error: 'Invalid email or password' });

            req.session.user = { email: user.email };
            res.status(200).send({ message: 'logged in' });
        },
    );
});

app.use((req, res, next) => {
    if (req.session.user) return next();
    res.status(401).send({ error: 'Unauthorized' });
});

app.get('/ping/protected', (req, res) => {
    res.send({
        message: 'pong',
        time: new Date().toISOString(),
        user: (req.session as any).user,
    });
});

app.post('/logout', (req, res) => {
    req.session.destroy(error => {
        if (error) {
            console.error(error);
            return res.status(500).send({ error: 'session error' });
        }
        res.status(200).send({ message: 'logged out' });
    });
})

const port = 3000;
server.listen(port, () => {
    console.log('server running on port', port);
});

process.on('SIGINT', () => {
    console.log('Shutting down server');
    server.close(() => {
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('Shutting down server');
    server.close(() => {
        process.exit(0);
    });
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled promise rejection:', error);
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    process.exit(1);
});
