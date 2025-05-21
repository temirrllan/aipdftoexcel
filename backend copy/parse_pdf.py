import os
import sys
import json
import camelot

# Если нужно, прописываем путь вручную (пример):
# os.environ['PATH'] = r'C:\Program Files\gs\gs9.56.1\bin' + ';' + os.environ['PATH']

def parse_pdf(pdf_path):
    tables = camelot.read_pdf(pdf_path, pages='all')
    all_data = []
    for t in tables:
        df = t.df
        for _, row in df.iterrows():
            all_data.append(row.tolist())
    return all_data

if __name__ == '__main__':
    pdf_path = sys.argv[1]
    try:
        data = parse_pdf(pdf_path)
        print(json.dumps(data))
    except Exception as e:
        print(e, file=sys.stderr)
        sys.exit(1)
