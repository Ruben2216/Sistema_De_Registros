from flask import Flask, send_from_directory
import os

# Rutas absolutas a las carpetas en el proyecto, preferentemente si se mueven los carchivos, checar aqui las rutas haber si no cambian y se rompen
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATES_FOLDER = os.path.join(BASE_DIR, 'TEMPLATES')
MANTENIMIENTO_FOLDER = os.path.join(TEMPLATES_FOLDER, 'Mantenimiento')
RESOURCE_FOLDER = os.path.join(BASE_DIR, 'RESOURCE')

app = Flask(__name__, static_url_path='', static_folder=TEMPLATES_FOLDER)

# aqui se define la ruta principal con el archivo HTML que se va a desplegar como por ejemplo menu.html
@app.route('/')
def index():
    return send_from_directory(TEMPLATES_FOLDER, 'menu.html')

@app.route('/TEMPLATES/<path:filename>')
def templates_root(filename):
    return send_from_directory(TEMPLATES_FOLDER, filename)

# Archivos dentro de /TEMPLATES/Mantenimiento/
@app.route('/TEMPLATES/Mantenimiento/<path:filename>')
def mantenimiento(filename):
    return send_from_directory(MANTENIMIENTO_FOLDER, filename)

# Archivos dentro de /RESOURCE/ para obtener los archivos js,css o  imagenes
@app.route('/RESOURCE/<path:filename>')
def resource_files(filename):
    return send_from_directory(RESOURCE_FOLDER, filename)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
