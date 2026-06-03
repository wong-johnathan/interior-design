import subprocess, os
with open('/opt/data/.env') as f:
    for line in f:
        s = line.strip()
        if 'GITHUB_TOKEN' in s and '=' in s:
            os.environ['GITHUB_TOKEN'] = s.split('=', 1)[1]
            break
token = os.environ.get('GITHUB_TOKEN', '')
url = f'https://wong-johnathan:{token}@github.com/wong-johnathan/interior-design.git'
os.chdir('/opt/data/interior-design')
subprocess.run(['git', 'add', '-A'])
subprocess.run(['git', 'commit', '-m', 'docs: v2.0 - remove email/password, add WaitlistEntry model, unify versions'])
subprocess.run(['git', 'push', url, 'main'])
subprocess.run(['git', 'remote', 'set-url', 'origin', 'https://github.com/wong-johnathan/interior-design.git'])
