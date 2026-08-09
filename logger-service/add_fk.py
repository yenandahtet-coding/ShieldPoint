import sys
from sqlalchemy import text
from app.models.database import engine
try:
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE transactions ALTER COLUMN sender_id TYPE uuid USING sender_id::uuid;"))
        conn.execute(text("ALTER TABLE transactions ADD CONSTRAINT fk_transactions_sender FOREIGN KEY (sender_id) REFERENCES profiles (id);"))
        conn.commit()
        print('SUCCESS')
except Exception as e:
    print('ERROR:', e)
