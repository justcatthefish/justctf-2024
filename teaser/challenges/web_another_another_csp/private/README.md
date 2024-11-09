# Another Another CSP by [@terjanq](https://twitter.com/terjanq)

![image](https://gist.github.com/assets/11320896/d5c9997c-d785-4763-a55f-4b40b529f970)

## Background

This year I created a copycat challenge of [another-csp](https://github.com/dicegang/dicectf-quals-2024-challenges/tree/main/web/another-csp) from DiceCTF Quals 2024. It was only solved by 1 team, [DiceGang](https://x.com/dicegangctf).
Although the challenge looked almost identical, the solutions should be strictly different.

The intended solution of the original challenge was to leak one bit of information per admin visit based on crashing the browser renderer process with malicious CSS. (The below snippet was crashing the browser, but currently it's fixed)

```css
<style>h1[data-token^="${guess}"] {
 --c1: color-mix(in srgb, blue 50%, red);
 --c2: srgb(from var(--c1) r g b);
  background-color: var(--c2);
}</style>
```

You can read about the original solution in this great [writeup](https://blog.huli.tw/2024/02/12/en/dicectf-2024-writeup/) from [Huli](https://x.com/aszx87410).

## Differences

The core of my challenge (Another Another CSP) can be visualized by the following snippet.

```html
<meta
  http-equiv="Content-Security-Policy"
  content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'"
/>
<script>
  function randomToken() {
    const token = crypto
      .getRandomValues(new Uint8Array(20))
      .reduce((a, b) => BigInt(256) * a + BigInt(b), BigInt(0))
      .toString(36)
      .padStart(31, "0");
    localStorage.setItem("token", token);
    return token;
  }
  console.log(randomToken());

  function insertIframe(code) {
    iframeContent.textContent = "";
    const token = randomToken();
    const iframe = document.createElement("iframe");
    iframe.srcdoc = `<h1 data-token="${token}">${token}</h1>${code}`;
    iframe.sandbox = "";
    iframe.csp = "script-src 'none'";
    iframeContent.appendChild(iframe);
  }

  window.onmessage = (e) => {
    if (e.data.get_flag) {
      const token = localStorage.getItem("token");
      if (e.data.token === token) {
        const flag = localStorage.getItem("flag") || "justCTF{example_flag}";
        e.source.postMessage({ flag }, "*");
      }
    } else if (e.data.code) {
      insertIframe(e.data.code);
    }
  };

  document.getElementById("form").onsubmit = (e) => {
    e.preventDefault();
    insertIframe(document.getElementById("code").value);
  };
</script>
```

The differences towards the original challenge are:

- Token is much longer and it refreshes with every render.
- Admin visits a user-controlled URL instead of a reflected & length-limited `code` parameter.
- A player can make multiple attempts at "guessing" the token instead of having only one chance.

The rest of the challenge is the same.

## Challenge's goal

The CSP inside the sandboxed iframe is super strict - it only allows for inline styles.
The challenge's goal was to use conditional styles to leak all the characters from the
token. Because recursive styles would not be possible, and the token refreshes with every render, 
all the leaking had to be done in a single injection point.

## Solution

The leaking technique goes back to 2019 when I presented a "single injection point CSS" challenge for the first time
([Ugliest Website](https://github.com/justcatthefish/justctf-2019/tree/master/challenges/web_ugly-website)). The idea is to
leak all letter pairs and then recover a secret from it (e.g. from `DO OM MI IN NO` puzzles you can recover the `DOMINO` word by
overlapping matching pairs). In CSS language leaking all 2-letter pairs translates to the following snippet.

```css
[data-token*="aa"]{
 <leak>
}
[data-token*="ab"]{
 <leak>
}
<...>
[data-token*="99"]{
 <leak>
}
```

Because of the very strict CSP, it wasn't possible to leak it via `background-image` or other similar techniques.

Instead, it's possible to leak it via XS-Leaks! I used `<object name="$PAIR">` elements to make them conditionally
visible, then I was able to see their presence through window reference: `window_reference[0][$PAIR]`. Objects
are only parsed when they're visible, but they'll only create a window context (which is detectable cross-origin) if they
point to a document. Because of the CSP, players couldn't point them to an external website, but because `about:blank` is not covered
by the strict CSP, players could use it as the object source.

```html
    <object name="w_$PAIR" data="about:blank" style="display: none"></object>
```

By combining it with a CSS selector it would only create a named window context if the selector matches the token.

```css
[data-token*="$PAIR"] ~ [name="w_$PAIR"]{
    display: block!important;
}
```

Steps to solve the challenge:

1. Open a window to the challenge page - https://another-another-csp.terjanq.me/
2. Send the exploit through postMessage that checks for all the 36\*36 letter pairs.
3. After some timeout, try to access `window_reference[0][PAIR]` for every pair and store all the accessible pairs.
4. From the pairs, recover all possible tokens (there could be hundreds of possibilities).
5. Through postMessage send every potential token, on match the page responds with a flag.

You can see the exploit in action:
[https://terjanq.me/solutions/justctf24-aacsp-92351235.html](https://terjanq.me/solutions/justctf24-aacsp-92351235.html)