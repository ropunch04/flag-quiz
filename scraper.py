import requests
from bs4 import BeautifulSoup
import uuid
import json
import os
import time

BASE_URL = "https://geohints.com"

# Regular categories
CATEGORIES = [
    "architecture", "bollards", "followCars", "googleVehicles", "licensePlates",
    "nature", "postBoxes", "rifts", "sceneries", "sidewalks", "signs",
    "trafficLights", "utilityPoles"
]

# Google Vehicles subcategories
GOOGLE_VEHICLES_SUBCATEGORIES = [
    "animals", "atvs", "boats", "cableCars", "cars",
    "motorcycles", "others", "snowmobiles", "trains"
]

# Signs subcategories
SIGNS_SUBCATEGORIES = [
    "backOfSigns", "chevrons", "citySigns", "directions",
    "pedestrian", "roadNumbering", "signPosts", "stop",
    "streetNames", "tramSpeed", "yield"
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"
}

def parse_category_page(html, category, url):
    soup = BeautifulSoup(html, "html.parser")
    results = []

    if category.startswith('signs_'):
        # Special handling for signs pages which group by country
        countries = soup.find_all("span", class_="font-bold text-xl mt-4")
        for country_elem in countries:
            country = country_elem.get_text(strip=True)
            # Get the next div which contains all signs for this country
            signs_container = country_elem.find_next("div", class_="flex flex-wrap justify-center")
            if signs_container:
                for block in signs_container.find_all("div", class_="text-white text-md p-2"):
                    try:
                        img = block.find("img")
                        img_url = img["src"] if img else None
                        if img_url and img_url.startswith("/"):
                            img_url = BASE_URL + img_url

                        map_link = block.find("a", href=True)
                        map_url = map_link["href"] if map_link else ""

                        results.append({
                            "id": str(uuid.uuid4()),
                            "country": country,
                            "region": "",
                            "img_url": img_url,
                            "map_url": map_url,
                            "category": category,
                            "source_page": url
                        })
                    except Exception as e:
                        print(f"⚠️ Error parsing sign for {country}: {e}")
    else:
        # Original handling for other categories
        blocks = soup.select("div.text-white.text-md.p-2")
        for block in blocks:
            try:
                country = block.find("span", class_="font-bold").get_text(strip=True)

                img = block.find("img")
                img_url = img["src"] if img else None
                if img_url and img_url.startswith("/"):
                    img_url = BASE_URL + img_url

                map_link = block.find("a", href=True)
                map_url = map_link["href"] if map_link else ""

                region = ""
                extra_divs = block.find_all("div")
                if extra_divs:
                    region = extra_divs[-1].get_text(strip=True)

                results.append({
                    "id": str(uuid.uuid4()),
                    "country": country,
                    "region": region,
                    "img_url": img_url,
                    "map_url": map_url,
                    "category": category,
                    "source_page": url
                })
            except Exception as e:
                print(f"⚠️ Error parsing one block: {e}")

    return results

def scrape_category(category):
    url = f"{BASE_URL}/meta/{category}"
    try:
        print(f"🔍 Scraping {category} → {url}")
        res = requests.get(url, headers=HEADERS, timeout=30)
        res.raise_for_status()
        return parse_category_page(res.text, category, url)
    except Exception as e:
        print(f"❌ Failed to scrape {category}: {e}")
        return []

def scrape_google_vehicles():
    all_results = []
    for subcat in GOOGLE_VEHICLES_SUBCATEGORIES:
        url = f"{BASE_URL}/meta/googleVehicles/{subcat}"
        try:
            print(f"🔍 Scraping googleVehicles/{subcat} → {url}")
            res = requests.get(url, headers=HEADERS, timeout=30)
            res.raise_for_status()
            results = parse_category_page(res.text, f"googleVehicles_{subcat}", url)
            all_results.extend(results)
        except Exception as e:
            print(f"❌ Failed to scrape googleVehicles/{subcat}: {e}")
    return all_results

def scrape_signs():
    all_results = []
    for subcat in SIGNS_SUBCATEGORIES:
        url = f"{BASE_URL}/meta/signs/{subcat}"
        try:
            print(f"🔍 Scraping signs/{subcat} → {url}")
            res = requests.get(url, headers=HEADERS, timeout=30)
            res.raise_for_status()
            results = parse_category_page(res.text, f"signs_{subcat}", url)
            all_results.extend(results)
        except Exception as e:
            print(f"❌ Failed to scrape signs/{subcat}: {e}")
    return all_results

def main():
    all_data = []

    # Scrape regular categories
    for category in CATEGORIES:
        if category not in ["googleVehicles", "signs"]:  # Skip categories we handle separately
            data = scrape_category(category)
            all_data.extend(data)

    # Scrape Google Vehicles subcategories
    google_vehicles_data = scrape_google_vehicles()
    all_data.extend(google_vehicles_data)

    # Scrape Signs subcategories
    signs_data = scrape_signs()
    all_data.extend(signs_data)

    # Write to geohints-data.js
    js_content = "const geohints_data = " + json.dumps(all_data, indent=2, ensure_ascii=False) + ";"
    
    with open("js/geohints-data.js", "w", encoding="utf-8") as f:
        f.write(js_content)

    print(f"\n✅ Scraped {len(all_data)} total entries and wrote to js/geohints-data.js")

if __name__ == "__main__":
    main()
