import pg from 'pg';
import dotenv from 'dotenv';
import { createUserTableQuery } from '../models/userModel.js';

dotenv.config();

const { Pool } = pg;

const pool=new Pool({
    connectionString: process.env.DATABASE_URL,
})

export const connectPostgres = async () => {
    try{
        const client = await pool.connect();
        console.log('Connected to PostgreSQL database');
        await client.query(createUserTableQuery);
        console.log('User table created or already exists');
        client.release();
    }catch(error){
        console.error('Error connecting to PostgreSQL database:', error.message);
    }
}

export default pool;