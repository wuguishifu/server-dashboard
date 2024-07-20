import connect from 'connect-sqlite3';
import cors from 'cors';
import express from 'express';
import session, { Store } from 'express-session';
import http from 'http';
import path from 'path';

import apiRouter from './routes/api';

const SQLiteStore = connect(session);

const app = express();
const server = http.createServer(app);

app.use(express.urlencoded({ extended: false }));
app.use(express.json({ limit: '1mb' }));

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
}));

app.use(session({
    store: new SQLiteStore({
        db: 'sessions.db',
        dir: '.',
    }) as Store,
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.HTTPS === 'true',
        maxAge: 30 * 60 * 1000, // 30 min expiration
    },
}));

app.use('/api', apiRouter);

app.use(express.static('/app/backend/public'));
app.use(express.static('/app/backend/public/assets'));

app.get('*', (_, res) => {
    res.sendFile(path.resolve('/app/backend/public/index.html'));
});

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
