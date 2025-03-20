from flask import Flask, render_template, request, jsonify, redirect
import json
import random
import os
import requests

app = Flask(__name__)
app.config['SECRET_KEY'] = os.urandom(24)

# Load country data
with open('static/data/countries.json') as f:
    countries = json.load(f)

@app.route('/')
def index():
    return render_template('index.html', countries=countries)

@app.route('/get_random_flag', methods=['GET'])
def get_random_flag():
    country = random.choice(countries)
    return jsonify(country)

@app.route('/proxy_flag/<country_code>')
def proxy_flag(country_code):
    """Proxy for flag images to avoid CORS issues"""
    size = request.args.get('size', '256x192')
    flag_url = f"https://flagcdn.com/{size}/{country_code}.png"
    response = requests.get(flag_url)
    return redirect(flag_url)

if __name__ == '__main__':
    app.run(debug=True) 