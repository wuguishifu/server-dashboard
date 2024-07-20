import { Request } from 'express';
import { Database } from 'sqlite3';

declare global {
    namespace Express {
        interface Request {
            db: Database;
        }
    }
}
