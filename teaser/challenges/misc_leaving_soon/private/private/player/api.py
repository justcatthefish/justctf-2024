from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/api/episodes/<int:episode_id>', methods=['GET'])
def get_episode(episode_id):
    response = {
        "license_server": "https://proxy.uat.widevine.com/proxy",
        "manifest": f"http://catflix.local/media/episode_{episode_id}.mpd"
    }
    return jsonify(response)

if __name__ == '__main__':
    app.run(host="127.0.0.1", port=8000)
