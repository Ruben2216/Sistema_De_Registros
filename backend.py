from flask import Flask, render_template, request, jsonify
from flask_cors import CORS #INSTALAR -- pip install Flask-CORS (dentro de env)
import mysql.connector #INSTALAR -- pip install mysql-connector-python (dentro de env)
from mysql.connector import Error

app = Flask(__name__,
            static_folder='Resource', 
            template_folder='TEMPLATES')
CORS(app)

# --- configuración a la base de datos ---
DB_CONFIG = {
    'host': 'localhost',      
    'user': 'root',  
    'password': 'josseline', 
    'database': 'sistema_registro' 
}

# conectar a la base de datos
def get_db_connection():
    """Crea y devuelve una conexión a la base de datos MySQL."""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        return conn
    except Error as e:
        print(f"Error al conectar a MySQL: {e}")
        return None

@app.route('/')
def pagina_principal():
    # Sirve el formulario de cómputo cuando se visita la raíz
    return render_template('Mantenimiento/computo.html')

@app.route('/mantenimiento/computo')
def pagina_computo():
    return render_template('Mantenimiento/computo.html')

# ruta de la API para buscar un equipo por número de serie
@app.route('/buscar_equipo')
def buscar_equipo():
    numero_serie = request.args.get('serie', '')

    if not numero_serie:
        return jsonify({'error': 'Número de serie no proporcionado'}), 400

    conn = get_db_connection()
    if conn is None:
        return jsonify({'error': 'No se pudo conectar a la base de datos'}), 500

    equipo = None
    try:
        cursor = conn.cursor(dictionary=True)
        
        query = "SELECT * FROM prueba_datos WHERE Numero_Serie = %s"
        cursor.execute(query, (numero_serie,)) 
        
        equipo = cursor.fetchone() # fetchone() obtiene el primer (y único) resultado
    
    except Error as e:
        print(f"Error en la consulta: {e}")
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

    if equipo is None:
        # si no se encuentra, devolvemos un JSON vacío
        return jsonify({})
    else:
        # si se encuentra, se devuelve como JSON
        datos_para_frontend = {
            'numero_inventario': equipo.get('Numero_Inventario'),
            'nombre_responsable': equipo.get('Nombre_Responsable'),
            'marca': equipo.get('Marca'),
            'modelo': equipo.get('Modelo'),
            'nombre_division': equipo.get('Nombre_Division'),
            'centro_trabajo': equipo.get('Centro_Trabajo'),
            'tipo_uso': equipo.get('Tipo_Uso')
        }
        return jsonify(datos_para_frontend)

if __name__ == '__main__':
    app.run(debug=True)