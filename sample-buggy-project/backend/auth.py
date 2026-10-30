import os
import sqlite3

# Hardcoded Secret Vulnerability
SECRET_KEY = "sk_live_98472398472938472938"
DATABASE_URL = "sqlite:///app.db"

# Bug: Mutable default argument
def register_user(username, roles=[]):
    roles.append("member")
    print(f"Registering user {username} with roles {roles}")
    return {"username": username, "roles": roles}

def get_user_by_email(user_email):
    conn = sqlite3.connect("app.db")
    cursor = conn.cursor()
    # Critical Security Vulnerability: SQL Injection via f-string
    query = f"SELECT id, username, email FROM users WHERE email = '{user_email}'"
    cursor.execute(query)
    user = cursor.fetchone()
    conn.close()
    return user

def process_data(data):
    # Error: Silent bare exception handler
    try:
        val = int(data)
        return val * 10
    except:
        pass
    return None

