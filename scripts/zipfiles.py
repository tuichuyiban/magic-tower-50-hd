"""用文件清单生成 zip：python3 zipfiles.py OUT.zip LIST.txt"""
import sys, zipfile
with zipfile.ZipFile(sys.argv[1], 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
    for line in open(sys.argv[2], encoding='utf-8'):
        line = line.strip()
        if line:
            z.write(line)
