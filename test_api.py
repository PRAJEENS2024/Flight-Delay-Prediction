import requests

def test_auth():
    print("Testing signup...")
    res = requests.post('http://127.0.0.1:8000/api/signup', json={'email': 'test2@test.com', 'password': 'password123'})
    print(res.status_code, res.text)
    
    print("Testing login...")
    res = requests.post('http://127.0.0.1:8000/api/login', json={'email': 'test2@test.com', 'password': 'password123'})
    print(res.status_code, res.text)

if __name__ == "__main__":
    test_auth()
