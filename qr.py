from flask import Flask, request, send_file, render_template_string
import qrcode
import io

app = Flask(__name__)

# Ruta para mostrar el formulario HTML
def cargar_formulario():
    with open('qr_form.html', 'r', encoding='utf-8') as f:
        html = f.read()
    return render_template_string(html)

app.add_url_rule('/', 'formulario', cargar_formulario, methods=['GET'])

# Ruta para procesar el formulario y generar el QR
@app.route('/generar_qr', methods=['POST'])
def generar_qr():
    zona = 'Zona: '+ request.form.get('zona')
    marca = 'Marca: ' +request.form.get('marca')
    centroTrabajo ='Centro de trabajo: '+ request.form.get('centroTrabajo')
    modelo = 'Modelo'+request.form.get('modelo')
    tipoEquipo = 'Tipo de equipo' + request.form.get('tipoEquipo')
    noSerie = 'No. de Serie'+request.form.get('noSerie')
    uso = 'Tipo de uso: '+request.form.get('uso')
    datos = [zona, marca, centroTrabajo, modelo, tipoEquipo, noSerie, uso]


    qr = qrcode.QRCode(
        version=1,
        box_size=10,
        border=4,
    )
    qr.add_data('\n'.join(datos))
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    # Guardar la imagen en memoria y devolverla al usuario
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    return send_file(buffer, mimetype='image/png', as_attachment=True, download_name='qr_code.png')

if __name__ == '__main__':
    app.run(debug=True)