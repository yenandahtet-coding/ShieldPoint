import os
import re

dirs = ['api-service', 'logger-service', 'fraud-service', 'notification-service']
for d in dirs:
    print(f'\n--- {d} ---')
    env_file = os.path.join(d, '.env')
    if os.path.exists(env_file):
        with open(env_file) as f:
            for l in f:
                if l.startswith('PORT=') or l.startswith('CONSUMER_GROUP_ID='):
                    print(l.strip())
    
    for root, _, files in os.walk(d):
        for f in files:
            if f.endswith('.py'):
                path = os.path.join(root, f)
                with open(path, encoding='utf-8') as pf:
                    content = pf.read()
                    topics = re.findall(r'topic[s]?[\"\'\s=:]+[\"\']([^\"\']+)[\"\']', content)
                    if topics:
                        print(f'Topics in {f}: {topics}')
