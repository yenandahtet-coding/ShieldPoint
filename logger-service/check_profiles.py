import sys
from sqlalchemy import text
from app.models.database import engine
try:
    with engine.connect() as conn:
        res = conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='profiles';"))
        for r in res:
            print(f'{r[0]}: {r[1]}')
except Exception as e:
    print('ERROR:', e)
