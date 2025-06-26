from flask import Flask
from flask_mail import Mail, Message
import sys

app = Flask(__name__)

app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'sistemaregistrocfe@gmail.com'
app.config['MAIL_PASSWORD'] = 'ytji fwik rftf njxw'  
app.config['MAIL_DEFAULT_SENDER'] = 'sistemaregistrocfe@gmail.com'

mail = Mail(app)

# Lista de usuarios para envío masivo
users = [
    {"email": "rubenclemente221@gmail.com"}, 
    {"email": "jossecou18@gmail.com"}
]

# Función para enviar correos masivos
def send_bulk_emails():

    try:
        with app.app_context():  # Asegurar que estamos dentro del contexto de la aplicación
            with mail.connect() as conn:
                
                for i, user in enumerate(users, 1):
                    
                    message = """holiwis"""
                    subject = "girls de CFE"
                    
                    msg = Message(
                        recipients=[user["email"]],
                        body=message,
                        subject=subject
                    )
                    
                    # with app.open_resource("RESOURCE/RIJ ENE A DIC 2025.pdf") as fp:
                    #     msg.attach("RIJ_ENE_A_DIC_2025.pdf", "application/pdf", fp.read())
                    
                    # Adjuntar imagen
                    with app.open_resource("540a78344991eb51236c9a9dc76f97bd.jpg") as fp:
                        msg.attach("540a78344991eb51236c9a9dc76f97bd.jpg", "image/png", fp.read())
                    
                    # Enviar el mensaje
                    conn.send(msg)
                
    except Exception as e:
        print(f"✗ Error al enviar correos: {str(e)}")
        
if __name__ == '__main__':
    send_bulk_emails()
    
