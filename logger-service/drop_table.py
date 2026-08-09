import sys
from sqlalchemy import text
from app.models.database import engine
try:
    with engine.connect() as conn:
        conn.execute(text("DROP TABLE IF EXISTS transactions CASCADE;"))
        conn.commit()
        print('Table dropped successfully.')
except Exception as e:
    print('ERROR:', e)
