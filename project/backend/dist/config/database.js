"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
exports.testConnection = testConnection;
const pg_1 = require("pg");
const dotenv = __importStar(require("dotenv"));
// Load env vars immediately
dotenv.config();
// Construct connection string from individual variables if DATABASE_URL is missing
const getConnectionString = () => {
    if (process.env.DATABASE_URL)
        return process.env.DATABASE_URL;
    const user = process.env.DB_USER || process.env.PGUSER || 'postgres';
    const password = process.env.DB_PASSWORD || process.env.PGPASSWORD || 'postgres';
    const host = process.env.DB_HOST || process.env.PGHOST || 'localhost';
    const port = process.env.DB_PORT || process.env.PGPORT || '5432';
    const database = process.env.DB_NAME || process.env.PGDATABASE || 'bitcoin_ira';
    return `postgresql://${user}:${password}@${host}:${port}/${database}`;
};
const connectionString = getConnectionString();
console.log('📡 Database Configuration:');
console.log(`   Connection String: ${connectionString.replace(/:[^@]*@/, ':****@')}`);
console.log(`   Method: ${process.env.DATABASE_URL ? 'DATABASE_URL' : 'Individual Variables'}`);
if (!connectionString) {
    console.error('❌ ERROR: Database configuration is missing');
    throw new Error('DATABASE_URL or individual DB_* environment variables are required');
}
const pool = new pg_1.Pool({
    connectionString,
    ssl: {
        rejectUnauthorized: false, // Required for Railway SSL
    },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000, // Increased from 2000 to 10 seconds
});
// Fix TypeScript error: explicitly type 'err'
pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});
exports.db = pool;
async function testConnection() {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        client.release();
        console.log('✅ Database connected successfully at', result.rows[0].now);
        return true;
    }
    catch (error) {
        console.error('❌ Database connection failed:', error);
        return false;
    }
}
//# sourceMappingURL=database.js.map