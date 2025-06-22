from flask import Flask, render_template
import datetime
import requests
import msal

app = Flask(__name__, template_folder='TEMPLATES')

CLIENT_ID = 'b0e347ef-bf6b-4c8e-aca0-7e9b36cd4424'
AUTHORITY = 'https://login.microsoftonline.com/common'  # para cuentas personales y organizacionales
SCOPES = ['Files.Read.All', 'User.Read']  # permisos delegados

CARPETA_ONEDRIVE = 'Mensajes_Kilometro_Vida_2025'  # Carpeta donde están tus imágenes

def obtener_token():
    app_msal = msal.PublicClientApplication(CLIENT_ID, authority=AUTHORITY)
    accounts = app_msal.get_accounts()
    if accounts:
        result = app_msal.acquire_token_silent(SCOPES, account=accounts[0])
    else:
        flow = app_msal.initiate_device_flow(scopes=SCOPES)
        if "user_code" not in flow:
            print("Error en flujo dispositivo:", flow)
            raise Exception("No se pudo iniciar flujo de dispositivo.")
        print(flow["message"])  # Te pedirá abrir microsoft.com/devicelogin y poner un código
        result = app_msal.acquire_token_by_device_flow(flow)
    if "access_token" in result:
        print("Token obtenido correctamente.")
        return result["access_token"]
    else:
        print("Error obteniendo token:", result)
        return None

def listar_archivos(token):
    headers = {'Authorization': f'Bearer {token}'}
    url = f"https://graph.microsoft.com/v1.0/me/drive/root:/{CARPETA_ONEDRIVE}:/children"
    respuesta = requests.get(url, headers=headers)
    print("Status code listado carpeta:", respuesta.status_code)
    if respuesta.status_code == 200:
        datos = respuesta.json()
        archivos = [item['name'] for item in datos.get('value', [])]
        print(f"Archivos en la carpeta {CARPETA_ONEDRIVE}:")
        for archivo in archivos:
            print("-", archivo)
        return archivos
    else:
        print("Error al listar carpeta:", respuesta.text)
        return []

def buscar_imagen_por_fecha(token, fecha_str):
    headers = {'Authorization': f'Bearer {token}'}
    nombre_archivo = f"{fecha_str}.jpg"
    archivos = listar_archivos(token)
    if nombre_archivo not in archivos:
        print(f"No se encontró el archivo {nombre_archivo} en la carpeta {CARPETA_ONEDRIVE}.")
        return None
    url = f"https://graph.microsoft.com/v1.0/me/drive/root:/{CARPETA_ONEDRIVE}/{nombre_archivo}:/content"
    respuesta = requests.get(url, headers=headers, allow_redirects=False)
    print(f"Intentando archivo '{nombre_archivo}' -> Status code: {respuesta.status_code}")
    if respuesta.status_code in (302, 200):
        return respuesta.headers.get('Location', url)
    return None

@app.route("/")
def index():
    token = obtener_token()
    if not token:
        return "Autenticación fallida"
    hoy = datetime.date.today().strftime('%d-%m-%Y')
    imagen_url = buscar_imagen_por_fecha(token, hoy)
    return render_template("formato_RIJ2.html", imagen_url=imagen_url)

if __name__ == "__main__":
    app.run(port=8000, debug=True)
