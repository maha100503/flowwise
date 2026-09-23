import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "flowcraft.db")


import aiosqlite

async def get_connection() -> aiosqlite.Connection:
    """Get an aiosqlite connection with row_factory set."""
    conn = await aiosqlite.connect(DB_PATH)
    conn.row_factory = aiosqlite.Row
    await conn.execute("PRAGMA journal_mode=WAL")
    await conn.execute("PRAGMA foreign_keys=ON")
    return conn


import asyncio

async def init_db_async():
    """Create tables if they don't exist (Async version)."""
    conn = await get_connection()
    try:
        await conn.execute("PRAGMA journal_mode=WAL")
        await conn.execute("PRAGMA foreign_keys=ON")
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS workflows (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                nodes TEXT NOT NULL DEFAULT '[]',
                edges TEXT NOT NULL DEFAULT '[]',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS executions (
                id TEXT PRIMARY KEY,
                workflow_id TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                result TEXT DEFAULT '{}',
                error TEXT,
                started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP,
                FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
            );
        """)
        await conn.commit()
        print(f"✅ Database initialized at {DB_PATH}")
    finally:
        await conn.close()

# No longer needed: sync wrapper that causes event loop issues
# def init_db():
#     asyncio.run(init_db_async())

