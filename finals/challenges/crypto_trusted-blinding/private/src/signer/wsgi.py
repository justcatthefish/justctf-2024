from app import app
import os

if __name__ == "__main__":
    PORT = os.environ.get("PORT")
    if not PORT:
        print("ERROR, NO PORT")
        os.exit(1)
    app.run(host='0.0.0.0', port=PORT, debug=False)
