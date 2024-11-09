from flask import Flask, request, redirect, render_template
from flask_sqlalchemy import SQLAlchemy
import os
import secrets 
import re
import markdown2
from admin import visit_letter

db = SQLAlchemy()
app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URI')

db.init_app(app)

class Letter(db.Model):
    id = db.Column(db.String(16), primary_key=True)
    title = db.Column(db.String(32))
    recipient = db.Column(db.String(32))
    content = db.Column(db.String(256))

with app.app_context():
    db.create_all()

@app.route("/", methods=["GET"])
def index():
    return render_template("send.html")

@app.route("/letter/<id>", methods=["GET"])
def view_letter(id):
    letter = Letter.query.get(id)
    if not letter:
        return "Letter not found"
    return render_template("view.html", id=letter.id, title=letter.title, recipient=letter.recipient, content=markdown2.markdown(letter.content))

@app.route("/letter/create", methods=["POST"])
def create_letter():
    id = secrets.token_hex(8)
    title = request.form["title"]
    recipient = request.form["recipient"]
    content = request.form["content"]

    if len(title) > 32:
        return "Invalid title"
    
    if len(recipient) > 32:
        return "Invalid recipient"
    
    if len(content) > 256 or not re.match("^[a-zA-Z0-9 \n#_*]+$", content):
        return "Invalid content"
    
    letter = Letter(
        id=id,
        title=title,
        recipient=recipient,
        content=content
    )
    db.session.add(letter)
    db.session.commit()
    return redirect(f"/letter/{id}")
    
@app.route("/letter/<id>/report", methods=["POST"])
def report_letter(id):
    letter = Letter.query.get(id)
    if not letter:
        return "Letter not found"
    visit_letter(id)
    db.session.delete(letter)
    db.session.commit()
    return "Admin reviewed and deleted malicious letter"
    


