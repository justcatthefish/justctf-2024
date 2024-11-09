from selenium import webdriver
from selenium.webdriver.chrome.service import Service
import os
import time

def visit_letter(id):
    chromedriver_path = '/bin/chromedriver'

    service = Service(chromedriver_path)
    options = webdriver.ChromeOptions()
    options.add_argument('--headless')
    options.add_argument('--disable-gpu')
    options.add_argument('--no-sandbox')
    options.add_argument('--js-flags=--noexpose_wasm,--jitless')
    driver = webdriver.Chrome(service=service, options=options)
    try:
        driver.get("http://127.0.0.1:5000/")
        driver.add_cookie({'name': 'flag', 'value': os.environ['FLAG'] if 'FLAG' in os.environ else 'justCTF{fake-flag}'})
        driver.get(f"http://127.0.0.1:5000/letter/{id}")
        time.sleep(1)
    finally:
        driver.quit()