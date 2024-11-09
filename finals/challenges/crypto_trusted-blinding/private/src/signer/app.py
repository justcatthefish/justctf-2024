#!/usr/bin/env python
# -*- coding: utf-8 -*-


from flask import Flask, request, jsonify
import os


FLAG = os.environ.get("FLAG") or "flag should be here, contact CTF admins"

app = Flask(__name__)


class SignatureMaker:
	def __init__(self):
		self.famous_writers = [
		    "Lord Byron",
		    "Percy Bysshe Shelley",
		    "John Keats",
		    "Victor Hugo",
		    "Walter Scott",
		    "Samuel Taylor Coleridge",
		    "Adam Mickiewicz",
		    "Juliusz Słowacki",
		    "Aubrey Beardsley",
		    "Oscar Wilde",
		    "Alphonse Mucha",
		    "Gustav Klimt",
		    "Émile Gallé",
		    "Stanisław Przybyszewski",
		    "Wacław Berent",
		    "Gabriela Zapolska",
		    "Stanisław Wyspiański",
		    "Kazimierz Przerwa-Tetmajer",
		    "Władysław Reymont"
		]

	def make_signature(self, poem):
		return self.famous_writers[len(poem) % len(self.famous_writers)]

global_signature_maker = SignatureMaker()


@app.route('/sign', methods=['POST'])
def sign():
	if "poem" not in request.json:
		return jsonify({"message": "no poem"}), 400
	poem = request.json["poem"]

	type = None
	if "type" in request.json:
		try:
			type = int(request.json["type"])
		except:
			type = 0			

	try:
		if not type:
			signed_poem = poem + "\n~Anonym"
			return jsonify({"signedPoem": signed_poem, "canPublish": True})
		elif type == 5:
			signed_poem = f"{poem}\n~{global_signature_maker.make_signature(poem)}".format(poem=poem, global_signature_maker=global_signature_maker)
			return jsonify({"signedPoem": signed_poem, "canPublish": False})
		else:
			return jsonify({"signedPoem": "Strange, strange indeed...\n~Gros", "canPublish": True})
	except:
		return jsonify({"message": "cannot sign"}), 400


if __name__ == '__main__':
	PORT = os.environ.get("PORT")
	if not FLAG or not PORT:
		print("ERROR, NO FLAG")
		os.exit(1)

	app.run(host='0.0.0.0', port=PORT)
