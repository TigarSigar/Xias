import sqlite3
import shutil
import os

src = os.path.expanduser('~') + r'\AppData\Local\Google\Chrome\User Data\Default\Network\Cookies'
dst = r'C:\Users\Egor\Desktop\XIAS\mcp-server\temp_cookies.db'

try:
    shutil.copy2(src, dst)
    con = sqlite3.connect(dst)
    cur = con.cursor()
    cur.execute("SELECT host_key, name, path, is_secure, is_httponly FROM cookies WHERE host_key LIKE '%kemsu%'")
    rows = cur.fetchall()
    print('Found cookies count:', len(rows))
    for r in rows:
        print(r)
    con.close()
    os.remove(dst)
except Exception as e:
    print('Error:', e)
