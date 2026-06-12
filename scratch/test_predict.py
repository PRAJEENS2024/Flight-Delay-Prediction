import requests

def test_predict():
    print("Logging in...")
    login_res = requests.post('http://127.0.0.1:8000/api/login', json={'email': 'test2@test.com', 'password': 'password123'})
    token = login_res.json()['access_token']
    headers = {'Authorization': f'Bearer {token}'}

    print("Testing metadata...")
    meta_res = requests.get('http://127.0.0.1:8000/api/metadata')
    print("Metadata:", meta_res.status_code, list(meta_res.json().keys()))

    print("Testing predict...")
    payload = {
        'start_airport': 'Indira Gandhi International Airport (Delhi)',
        'end_airport': 'Chhatrapati Shivaji Maharaj International Airport (Mumbai)',
        'carrier': 'IndiGo',
        'date': '2026-06-15',
        'time': '12:00'
    }
    pred_res = requests.post('http://127.0.0.1:8000/api/predict', json=payload, headers=headers)
    print("Predict response status:", pred_res.status_code)
    print("Predict response body:", pred_res.text)

if __name__ == "__main__":
    test_predict()
