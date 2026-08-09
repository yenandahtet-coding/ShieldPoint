import sys
from sqlalchemy import text
from app.models.database import engine
try:
    with engine.connect() as conn:
        res = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='transactions';"))
        cols = [r[0] for r in res]
        print('COLUMNS:', cols)
except Exception as e:
    print('ERROR:', e)
