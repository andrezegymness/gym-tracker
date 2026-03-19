# ── Installation (run in Colab) ───────────────────────────────
# !pip install -q selenium webdriver-manager requests beautifulsoup4 pdfplumber \
#              pandas pytesseract pdf2image Pillow pymupdf
# !apt-get update -q
# !apt-get install -y -q wget gnupg2 unzip tesseract-ocr poppler-utils
# !wget -q -O /tmp/chrome.deb https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
# !apt-get install -y -q /tmp/chrome.deb

import requests
from bs4 import BeautifulSoup
import pdfplumber
import pandas as pd
import io
import re
import time
from urllib.parse import urljoin
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeoutError
from pdf2image import convert_from_bytes
import pytesseract
import fitz  # PyMuPDF
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

CATEGORY_URLS = [
    "https://modernforms.com/product-category/downrod-fans/",
    "https://modernforms.com/product-category/flush-mount-fans/"
]

OCR_TIMEOUT_SECS = 60   # give up on OCR after this many seconds
OCR_MAX_PAGES    = 4    # only OCR the first N pages
OCR_DPI          = 150  # lower DPI = faster; still readable for parts lists


# ── Selenium driver ───────────────────────────────────────────

def make_driver():
    opts = Options()
    opts.add_argument("--headless=new")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--disable-gpu")
    opts.add_argument("--window-size=1920,1080")
    opts.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                      "AppleWebKit/537.36")
    service = Service(ChromeDriverManager().install())
    return webdriver.Chrome(service=service, options=opts)


# ── Product link crawling ─────────────────────────────────────

def get_all_product_links(category_url):
    driver = make_driver()
    product_links = []
    try:
        page = 1
        while True:
            paged_url = (category_url if page == 1
                         else f"{category_url.rstrip('/')}/page/{page}/")
            print(f"  Loading page {page}: {paged_url}")
            driver.get(paged_url)

            try:
                WebDriverWait(driver, 10).until(
                    EC.presence_of_element_located(
                        (By.CSS_SELECTOR, "a[href*='/product/']"))
                )
            except Exception:
                print(f"  -> No products on page {page}, stopping.")
                break

            # scroll to trigger lazy-loading
            last_h = driver.execute_script("return document.body.scrollHeight")
            while True:
                driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                time.sleep(2)
                new_h = driver.execute_script("return document.body.scrollHeight")
                if new_h == last_h:
                    break
                last_h = new_h

            soup = BeautifulSoup(driver.page_source, 'html.parser')
            found = []
            for a in soup.find_all('a', href=True):
                href = a['href']
                if '/product/' in href and 'product-category' not in href:
                    if href not in product_links and href not in found:
                        found.append(href)

            if not found:
                print(f"  -> No new fans on page {page}, done.")
                break

            product_links.extend(found)
            print(f"    -> {len(found)} fans (total: {len(product_links)})")

            if not soup.find('a', class_=re.compile(r'next')):
                break
            page += 1
            time.sleep(1)
    finally:
        driver.quit()

    print(f"Total fans in category: {len(product_links)}")
    return product_links


# ── PDF link extraction ───────────────────────────────────────

def get_pdf_link(product_url):
    headers = {'User-Agent': 'Mozilla/5.0'}
    try:
        r = requests.get(product_url, headers=headers, timeout=15)
        soup = BeautifulSoup(r.text, 'html.parser')
        for a in soup.find_all('a', href=True):
            href = a['href'].lower()
            text = a.get_text().lower()
            if '.pdf' in href and ('instruction' in href or 'manual' in href
                                   or 'instruction' in text or 'manual' in text):
                return urljoin(product_url, a['href'])
    except Exception:
        pass
    return None


# ── Text parsing ──────────────────────────────────────────────

PART_NUM_RE = re.compile(
    r'\b([A-Z][A-Z0-9]*-[A-Z0-9][A-Z0-9\-]{3,}(?:-\*\*)?)\b'
)


def parse_column_text(text):
    results = []
    current_num = current_name = None
    current_parts = []

    for line in text.split('\n'):
        line = line.strip()
        if not line:
            continue
        if 'Hardware Bag' in line:
            break

        item_match = re.match(r'^(\d+)\.\s+(.+)', line)
        if item_match:
            if current_name:
                results.append({
                    "Item #": current_num,
                    "Part Name": current_name,
                    "Part Number(s)": ', '.join(current_parts) or "—"
                })
            current_num = item_match.group(1)
            current_name = item_match.group(2).strip()
            current_parts = []
            for p in PART_NUM_RE.findall(current_name):
                current_parts.append(p)
                current_name = current_name.replace(p, '').strip()
        elif current_name:
            for p in PART_NUM_RE.findall(line):
                current_parts.append(p)

    if current_name:
        results.append({
            "Item #": current_num,
            "Part Name": current_name,
            "Part Number(s)": ', '.join(current_parts) or "—"
        })
    return results


# ── Text extraction strategies ────────────────────────────────

def extract_with_pdfplumber(pdf_bytes):
    """Strategy 1: pdfplumber with column split."""
    parts = []
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for page in pdf.pages:
            full_text = page.extract_text() or ""
            if "Package Contents" not in full_text and "RPL-" not in full_text:
                continue
            mid = page.width / 2
            for bbox in [(0, 0, mid, page.height),
                         (mid, 0, page.width, page.height)]:
                col_text = page.crop(bbox).extract_text() or ""
                parts.extend(parse_column_text(col_text))
    return parts


def extract_with_pymupdf(pdf_bytes):
    """Strategy 2: PyMuPDF — handles more PDF types than pdfplumber."""
    parts = []
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    for page in doc:
        text = page.get_text("text")
        if "Package Contents" in text or "RPL-" in text:
            parts.extend(parse_column_text(text))
    doc.close()
    return parts


def _ocr_worker(pdf_bytes):
    """Runs in a thread so we can apply a wall-clock timeout."""
    full_text = ""
    images = convert_from_bytes(
        pdf_bytes,
        dpi=OCR_DPI,
        first_page=1,
        last_page=OCR_MAX_PAGES,
    )
    for img in images:
        full_text += pytesseract.image_to_string(img) + "\n"
    return full_text


def extract_with_ocr(pdf_bytes):
    """Strategy 3: OCR with timeout guard."""
    print(f"    -> Trying OCR (max {OCR_MAX_PAGES} pages, "
          f"{OCR_DPI} DPI, timeout {OCR_TIMEOUT_SECS}s)...")
    with ThreadPoolExecutor(max_workers=1) as ex:
        future = ex.submit(_ocr_worker, pdf_bytes)
        try:
            text = future.result(timeout=OCR_TIMEOUT_SECS)
        except FuturesTimeoutError:
            print("    -> OCR timed out, skipping.")
            return []
        except Exception as e:
            print(f"    -> OCR error: {e}")
            return []
    return parse_column_text(text)


# ── Main PDF parser ───────────────────────────────────────────

def extract_parts_from_pdf(pdf_url):
    headers = {'User-Agent': 'Mozilla/5.0'}
    try:
        response = requests.get(pdf_url, headers=headers, timeout=30)
        pdf_bytes = response.content
    except Exception as e:
        return [{"Item #": "Error", "Part Name": f"Download failed: {e}",
                 "Part Number(s)": ""}]

    # Strategy 1 – pdfplumber
    try:
        parts = extract_with_pdfplumber(pdf_bytes)
        if parts:
            return _dedup(parts)
    except Exception as e:
        print(f"    pdfplumber error: {e}")

    # Strategy 2 – PyMuPDF (faster + wider format support)
    try:
        parts = extract_with_pymupdf(pdf_bytes)
        if parts:
            print("    -> PyMuPDF extracted text.")
            return _dedup(parts)
    except Exception as e:
        print(f"    PyMuPDF error: {e}")

    # Strategy 3 – OCR (slow, last resort, time-limited)
    parts = extract_with_ocr(pdf_bytes)
    if parts:
        return _dedup(parts)

    return [{"Item #": "N/A", "Part Name": "No parts found in PDF",
             "Part Number(s)": ""}]


def _dedup(parts):
    seen, unique = set(), []
    for p in parts:
        key = (p["Item #"], p["Part Name"])
        if key not in seen:
            seen.add(key)
            unique.append(p)
    return unique


# ── Entry point ───────────────────────────────────────────────

def main():
    print("Starting full fan scraper...\n")
    master_list = []

    for category in CATEGORY_URLS:
        print(f"\n{'='*60}")
        print(f"Category: {category}")
        fan_urls = get_all_product_links(category)

        for i, url in enumerate(fan_urls, 1):
            fan_name = url.strip('/').split('/')[-1].replace('-', ' ').title()
            print(f"\n[{i}/{len(fan_urls)}] {fan_name}")
            pdf_link = get_pdf_link(url)

            if pdf_link:
                print(f"  -> PDF: {pdf_link}")
                parts = extract_parts_from_pdf(pdf_link)
                print(f"  -> {len(parts)} parts found")
                for part in parts:
                    master_list.append({
                        "Fan Model":      fan_name,
                        "Product URL":    url,
                        "Item #":         part["Item #"],
                        "Part Name":      part["Part Name"],
                        "Part Number(s)": part["Part Number(s)"]
                    })
            else:
                print("  -> No PDF found.")
                master_list.append({
                    "Fan Model": fan_name, "Product URL": url,
                    "Item #": "", "Part Name": "No PDF found",
                    "Part Number(s)": ""
                })
            time.sleep(1)

    df = pd.DataFrame(master_list)

    def combine(group):
        return '\n'.join(
            f"{r['Item #']}. {r['Part Name']}  |  {r['Part Number(s)']}"
            for _, r in group.iterrows()
        )

    df_out = (
        df.groupby(['Fan Model', 'Product URL'], sort=False)
          .apply(combine)
          .reset_index(names=['Fan Model', 'Product URL', 'Parts List'])
    )
    df_out.to_csv('WAC_ModernForms_Parts.csv', index=False)
    print(f"\n{'='*60}")
    print(f"Done! {len(df_out)} fans -> WAC_ModernForms_Parts.csv")


if __name__ == "__main__":
    main()
