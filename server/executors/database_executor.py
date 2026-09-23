"""
Database Executor - Execute database queries.
Supports PostgreSQL, MySQL, and SQLite.
"""

import os
import json
import aiosqlite
from typing import Any
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))


async def execute_database(node_data: dict, input_data: dict) -> dict:
    """Execute a database query node."""
    
    config = node_data.get("config", {})
    db_type = node_data.get("subType", config.get("type", "SQLite"))
    query = config.get("query", "")
    connection_string = config.get("connectionString", "")
    parameters = config.get("parameters", [])
    
    # Template substitution for query
    query = _substitute_variables(query, input_data)
    
    if not query:
        return {"error": "Query is required", "output": None}

    try:
        if db_type == "SQLite":
            return await _execute_sqlite(connection_string, query, parameters)
        elif db_type == "PostgreSQL":
            return await _execute_postgresql(connection_string, query, parameters)
        elif db_type == "MySQL":
            return await _execute_mysql(connection_string, query, parameters)
        else:
            return {"error": f"Unsupported database type: {db_type}", "output": None}
    
    except Exception as e:
        return {"error": str(e), "output": None}


async def _execute_sqlite(connection_string: str, query: str, parameters: list) -> dict:
    """Execute query on SQLite database."""
    
    # Use in-memory database if no connection string provided
    db_path = connection_string or ":memory:"
    
    async with aiosqlite.connect(db_path) as db:
        db.row_factory = aiosqlite.Row
        
        # Determine if it's a SELECT query
        is_select = query.strip().upper().startswith("SELECT")
        
        if is_select:
            async with db.execute(query, parameters) as cursor:
                rows = await cursor.fetchall()
                # Convert rows to list of dicts
                columns = [desc[0] for desc in cursor.description] if cursor.description else []
                results = [dict(zip(columns, row)) for row in rows]
                
                return {
                    "output": results,
                    "row_count": len(results),
                    "columns": columns,
                    "database": "SQLite"
                }
        else:
            await db.execute(query, parameters)
            await db.commit()
            
            return {
                "output": {"success": True},
                "row_count": db.total_changes,
                "database": "SQLite"
            }


async def _execute_postgresql(connection_string: str, query: str, parameters: list) -> dict:
    """Execute query on PostgreSQL database."""
    
    # Check if asyncpg is available
    try:
        import asyncpg
    except ImportError:
        return {
            "error": "asyncpg not installed. Run: pip install asyncpg",
            "output": None
        }
    
    if not connection_string:
        connection_string = os.getenv("DATABASE_URL", "")
    
    if not connection_string:
        return {"error": "PostgreSQL connection string required", "output": None}
    
    try:
        conn = await asyncpg.connect(connection_string)
        
        is_select = query.strip().upper().startswith("SELECT")
        
        if is_select:
            rows = await conn.fetch(query, *parameters)
            results = [dict(row) for row in rows]
            columns = list(results[0].keys()) if results else []
            
            await conn.close()
            return {
                "output": results,
                "row_count": len(results),
                "columns": columns,
                "database": "PostgreSQL"
            }
        else:
            result = await conn.execute(query, *parameters)
            await conn.close()
            
            return {
                "output": {"success": True, "result": result},
                "database": "PostgreSQL"
            }
    
    except Exception as e:
        return {"error": f"PostgreSQL error: {str(e)}", "output": None}


async def _execute_mysql(connection_string: str, query: str, parameters: list) -> dict:
    """Execute query on MySQL database."""
    
    # Check if aiomysql is available
    try:
        import aiomysql
    except ImportError:
        return {
            "error": "aiomysql not installed. Run: pip install aiomysql",
            "output": None
        }
    
    # Parse connection string (mysql://user:pass@host:port/db)
    import urllib.parse
    
    if not connection_string:
        return {"error": "MySQL connection string required", "output": None}
    
    try:
        parsed = urllib.parse.urlparse(connection_string)
        
        conn = await aiomysql.connect(
            host=parsed.hostname or 'localhost',
            port=parsed.port or 3306,
            user=parsed.username or 'root',
            password=parsed.password or '',
            db=parsed.path.lstrip('/') if parsed.path else 'test'
        )
        
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            await cursor.execute(query, parameters)
            
            is_select = query.strip().upper().startswith("SELECT")
            
            if is_select:
                rows = await cursor.fetchall()
                columns = [desc[0] for desc in cursor.description] if cursor.description else []
                
                conn.close()
                return {
                    "output": rows,
                    "row_count": len(rows),
                    "columns": columns,
                    "database": "MySQL"
                }
            else:
                await conn.commit()
                conn.close()
                
                return {
                    "output": {"success": True},
                    "row_count": cursor.rowcount,
                    "database": "MySQL"
                }
    
    except Exception as e:
        return {"error": f"MySQL error: {str(e)}", "output": None}


def _substitute_variables(text: str, data: dict) -> str:
    """Replace {{variable}} patterns with values from data."""
    import re
    
    def replacer(match):
        key = match.group(1)
        value = _get_nested_value(data, key)
        return str(value) if value is not None else match.group(0)
    
    return re.sub(r'\{\{([^}]+)\}\}', replacer, text)


def _get_nested_value(data: dict, key: str) -> Any:
    """Get a nested value using dot notation."""
    keys = key.split('.')
    value = data
    for k in keys:
        if isinstance(value, dict):
            value = value.get(k)
        else:
            return None
    return value
