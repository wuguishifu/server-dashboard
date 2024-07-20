import bcrypt from 'bcrypt';
import { Router } from 'express';
import path from 'path';
import sqlite3 from 'sqlite3';

sqlite3.verbose();
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run('CREATE TABLE IF NOT EXISTS users (email TEXT PRIMARY KEY, password TEXT)');
});

const apiRouter = Router();

apiRouter.use('*', (req, _, next) => {
    console.log(req.method, req.url, new Date().toLocaleString());
    req.db = db;
    next();
});

apiRouter.get('/auth/users', async (req, res) => {
    req.db.all('SELECT email FROM users', [], (error, rows) => {
        if (error) {
            console.error(error);
            res.status(500).send({ error: error.message });
        } else {
            res.send(rows);
        }
    });
});

apiRouter.post('/auth/users', async (req, res) => {
    const { email, password } = req.body;

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const stmt = req.db.prepare('INSERT INTO users (email, password) VALUES (?, ?)');
    stmt.run(
        [email.toLowerCase(), hash],
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

apiRouter.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;

    req.db.get<{ email: string, password: string }>(
        'SELECT * FROM users WHERE email = ?',
        [email.toLowerCase()],
        async (error, user) => {
            if (error) {
                console.error(error);
                return res.status(500).send({ error: 'database error' });
            }

            if (!user) return res.status(400).send({ error: 'Invalid email or password' });

            const valid = await bcrypt.compare(password, user.password);
            if (!valid) return res.status(400).send({ error: 'Invalid email or password' });

            req.session.user = { email: user.email };
            res.status(200).send({ message: 'logged in', user: req.session.user });
        },
    );
});

apiRouter.use('*', (req, res, next) => {
    if (req.session.user) return next();
    res.status(401).send({ error: 'Unauthorized' });
});

apiRouter.get('/auth/session', (req, res) => {
    if (req.session.user) {
        res.status(200).send({ user: req.session.user });
    } else {
        res.status(401).send({ error: 'Unauthorized' });
    }
});

apiRouter.post('/auth/logout', (req, res) => {
    req.session.destroy(error => {
        if (error) {
            console.error(error);
            return res.status(500).send({ error: 'session error' });
        }
        res.status(200).send({ message: 'logged out' });
    });
});

export default apiRouter;
