# 🚀 GUÍA COMPLETA DE DESPLIEGUE EN PYTHONANYWHERE

## 📋 PASOS PARA DESPLEGAR TU SISTEMA

### **PASO 1: CREAR CUENTA EN PYTHONANYWHERE**
1. Ve a https://www.pythonanywhere.com/
2. Crea una cuenta gratuita (Beginner account)
3. Tu usuario será algo como: `tuusuario` (anótalo, lo necesitarás)

### **PASO 2: SUBIR TU CÓDIGO (DETALLADO)**

#### **2.1 Acceder al Administrador de Archivos**
1. En el dashboard de PythonAnywhere, busca la pestaña **"Files"**
2. Haz clic en **"Files"** - esto te llevará al explorador de archivos web
3. Verás que estás en `/home/tuusuario/` (donde tuusuario es tu nombre de usuario)

#### **2.2 Crear la Estructura de Carpetas**
1. **Crear carpeta principal del proyecto:**
   - Haz clic en **"New directory"** (botón verde)
   - Escribe: `Sistema_Registros` (sin espacios, tal como aparece)
   - Presiona Enter o haz clic en ✓
   - Ahora tendrás la carpeta `/home/tuusuario/Sistema_Registros/`

2. **Entrar a la carpeta creada:**
   - Haz clic en la carpeta `Sistema_Registros` para entrar
   - La ruta debe mostrar: `/home/tuusuario/Sistema_Registros/`

#### **2.3 Subir Archivos Principales (UNO POR UNO)**
**Sube estos archivos en el siguiente orden:**

1. **Subir ejecutable.py:**
   - Clic en **"Upload a file"** (botón azul)
   - Selecciona `ejecutable.py` desde tu computadora
   - Espera a que se complete la subida (verás una barra de progreso)
   - ✅ Verificar que aparezca en la lista

2. **Subir wsgi.py:**
   - Clic en **"Upload a file"**
   - Selecciona `wsgi.py`
   - ✅ Verificar subida completa

3. **Subir requirements.txt:**
   - Clic en **"Upload a file"**
   - Selecciona `requirements.txt`
   - ⚠️ **IMPORTANTE**: Este archivo contiene TODAS las dependencias necesarias:
     - Flask y extensiones (Flask-Mail, Flask-CORS)
     - MySQL connector
     - Google APIs (para Google Drive)
     - PyMuPDF (para PDFs)
     - Pillow (para imágenes)
     - Todas las dependencias adicionales
   - ✅ Verificar subida completa

4. **Subir .env.production:**
   - Clic en **"Upload a file"**
   - Selecciona `.env.production`
   - ⚠️ **MUY IMPORTANTE**: Este archivo contiene contraseñas
   - ✅ Verificar subida completa

5. **Subir database_setup.sql:**
   - Clic en **"Upload a file"**
   - Selecciona `database_setup.sql`
   - ✅ Verificar subida completa

6. **Subir kilometro_vida.py:**
   - Clic en **"Upload a file"**
   - Selecciona `kilometro_vida.py`
   - ✅ Verificar subida completa

#### **2.4 Crear y Subir Carpeta TEMPLATES**
1. **Crear carpeta TEMPLATES:**
   - Dentro de `/home/tuusuario/Sistema_Registros/`
   - Clic en **"New directory"**
   - Escribe: `TEMPLATES`
   - Presiona Enter

2. **Entrar a la carpeta TEMPLATES:**
   - Clic en la carpeta `TEMPLATES` para entrar
   - Ruta: `/home/tuusuario/Sistema_Registros/TEMPLATES/`

3. **Subir archivos HTML:**
   - Sube **UNO POR UNO** estos archivos:
     - `menu.html`
     - `login.html` 
     - `formato_RIJ.html`
     - `camara.html`
   - Para cada uno: **"Upload a file"** → Seleccionar → Esperar

4. **Crear subcarpeta Mantenimiento (si existe):**
   - Dentro de TEMPLATES, clic **"New directory"**
   - Nombre: `Mantenimiento`
   - Subir archivos de mantenimiento si los tienes

#### **2.5 Crear y Subir Carpeta RESOURCE**
1. **Volver a la carpeta principal:**
   - Clic en `Sistema_Registros` en la ruta de navegación
   - O navega a `/home/tuusuario/Sistema_Registros/`

2. **Crear carpeta RESOURCE:**
   - Clic en **"New directory"**
   - Nombre: `RESOURCE`
   - Enter para crear

3. **Entrar a RESOURCE y crear subcarpetas:**
   - Entra a la carpeta `RESOURCE`
   - Crear subcarpeta **"CSS"**: New directory → `CSS`
   - Crear subcarpeta **"JS"**: New directory → `JS` 
   - Crear subcarpeta **"IMG"**: New directory → `IMG`

4. **Subir archivos CSS:**
   - Entra a la carpeta `CSS`
   - Sube archivos uno por uno:
     - `index.css`
     - `login.css`
     - `menu.css`
     - `camara.css`
     - `visor_pdf.css`
     - Todos los demás archivos .css

5. **Subir archivos JavaScript:**
   - Volver a RESOURCE, entrar a carpeta `JS`
   - Sube archivos .js uno por uno:
     - `autoguardado_camara.js`
     - Todos los demás archivos .js

6. **Subir imágenes:**
   - Volver a RESOURCE, entrar a carpeta `IMG`
   - Sube todas las imágenes:
     - `camara-RIJ.png`
     - `fondo-cfe.png`
     - `SIG.jpeg`
     - Todas las demás imágenes

#### **2.6 Subir Carpeta de Credenciales (CRÍTICO PARA GOOGLE DRIVE)**
1. **Volver a carpeta principal** `/home/tuusuario/Sistema_Registros/`
2. **Crear carpeta credenciales:**
   - New directory → `credenciales`
3. **Subir archivos de credenciales:**
   - ⚠️ **MUY IMPORTANTE**: Tu sistema usa Google Drive para buscar imágenes
   - Sube `service_account.json` (archivo de credenciales de Google)
   - Este archivo es NECESARIO para que funcione `kilometro_vida.py`
   - Sin este archivo, las funciones de Google Drive fallarán

#### **2.6.1 Configurar Service Account de Google (Si No Lo Tienes)**
Si no tienes el archivo `service_account.json`, necesitas:

1. **Ir a Google Cloud Console:**
   - https://console.cloud.google.com/

2. **Crear o seleccionar proyecto**

3. **Habilitar APIs necesarias:**
   - Google Drive API
   - Google Sheets API (si usas hojas de cálculo)

4. **Crear Service Account:**
   - IAM & Admin → Service Accounts
   - Create Service Account
   - Descargar archivo JSON
   - Renombrar a `service_account.json`

5. **Dar permisos a la carpeta de Drive:**
   - Compartir la carpeta `Mensajes_Seguridad_2025` con el email del service account

#### **2.7 Verificación Final de Archivos Subidos**
Al terminar, tu estructura debe verse así:
```
/home/tuusuario/Sistema_Registros/
├── ejecutable.py ✅
├── wsgi.py ✅
├── requirements.txt ✅
├── .env.production ✅
├── database_setup.sql ✅
├── kilometro_vida.py ✅
├── TEMPLATES/ ✅
│   ├── menu.html
│   ├── login.html
│   ├── formato_RIJ.html
│   ├── camara.html
│   └── Mantenimiento/ (si existe)
├── RESOURCE/ ✅
│   ├── CSS/
│   │   ├── index.css
│   │   ├── login.css
│   │   └── ...otros css
│   ├── JS/
│   │   ├── autoguardado_camara.js
│   │   └── ...otros js
│   └── IMG/
│       ├── camara-RIJ.png
│       └── ...otras imágenes
└── credenciales/ ✅ (opcional)
    └── service_account.json
```

#### **2.8 Consejos Importantes para Subir Archivos**
- ✅ **Sube de uno en uno** - No intentes subir múltiples archivos juntos
- ✅ **Espera la confirmación** - Cada archivo debe mostrar "Upload complete"
- ✅ **Verifica el tamaño** - Plan gratuito tiene límite de 100MB total
- ✅ **Mantén nombres exactos** - Respeta mayúsculas y minúsculas
- ❌ **No subas carpetas comprimidas** - Sube archivo por archivo
- ❌ **No subas la carpeta __pycache__** - Se genera automáticamente
- ❌ **No subas env/** - Es el entorno virtual local

### **PASO 3: CONFIGURAR BASE DE DATOS MYSQL (DETALLADO)**

#### **3.1 Acceder a la Configuración de Base de Datos**
1. En el dashboard principal de PythonAnywhere
2. Busca y haz clic en la pestaña **"Databases"**
3. Verás la sección "Set up a MySQL password"

#### **3.2 Crear Contraseña MySQL**
1. **Establecer contraseña:**
   - En el campo "Password", escribe una contraseña segura
   - Ejemplo: `MiPassword123!`
   - ⚠️ **ANOTA ESTA CONTRASEÑA** - La necesitarás para `.env.production`
   - Haz clic en **"Set MySQL password"**

2. **Verificar datos de conexión:**
   - **Host**: `tuusuario.mysql.pythonanywhere-services.com`
   - **Usuario**: `tuusuario` (tu nombre de usuario)
   - **Base de datos**: `tuusuario$default` (se crea automáticamente)
   - **Contraseña**: La que acabas de crear

#### **3.3 Acceder a la Consola MySQL**
1. **Abrir consola MySQL:**
   - En la misma página de Databases
   - Busca "Start a MySQL console"
   - Haz clic en **"Start a MySQL console"**
   - Se abrirá una nueva pestaña con la terminal MySQL

2. **Verificar conexión:**
   ```sql
   SHOW DATABASES;
   ```
   - Debes ver `tuusuario$default` en la lista

3. **Seleccionar tu base de datos:**
   ```sql
   USE tuusuario$default;
   ```

#### **3.4 Ejecutar Script de Base de Datos**
1. **Copiar contenido del archivo database_setup.sql:**
   - Ve a Files → `Sistema_Registros` → `database_setup.sql`
   - Haz clic en el archivo para abrirlo
   - Selecciona TODO el contenido (Ctrl+A)
   - Copia el contenido (Ctrl+C)

2. **Modificar el script antes de ejecutar:**
   - Reemplaza `TU_USUARIO$default` por `tuusuario$default`
   - Ejemplo: Si tu usuario es `rubencfe`, cambia por `rubencfe$default`

3. **Ejecutar en consola MySQL:**
   - Pega el contenido modificado en la consola MySQL
   - Presiona Enter para ejecutar
   - Verás mensajes de "Query OK" para cada tabla creada

4. **Verificar tablas creadas:**
   ```sql
   SHOW TABLES;
   ```
   - Debes ver las tablas: usuarios, equipos, registros_rij, etc.

#### **3.5 Configurar Variables de Entorno**
1. **Editar archivo .env.production:**
   - Ve a Files → `Sistema_Registros` → `.env.production`
   - Haz clic en el archivo para editarlo
   - Reemplaza los valores de ejemplo:

   ```env
   # ANTES (ejemplo):
   DB_HOST=TU_USUARIO.mysql.pythonanywhere-services.com
   DB_USER=TU_USUARIO
   DB_PASSWORD=TU_PASSWORD_MYSQL
   DB_NAME=TU_USUARIO$default

   # DESPUÉS (con tus datos reales):
   DB_HOST=rubencfe.mysql.pythonanywhere-services.com
   DB_USER=rubencfe
   DB_PASSWORD=MiPassword123!
   DB_NAME=rubencfe$default
   ```

2. **Guardar cambios:**
   - Haz clic en **"Save"** (botón verde)
   - ✅ Verificar que los cambios se guardaron

### **PASO 4: CONFIGURAR VARIABLES DE ENTORNO**
1. Edita el archivo `.env.production` con tus datos reales:
```env
DB_HOST=tuusuario.mysql.pythonanywhere-services.com
DB_USER=tuusuario
DB_PASSWORD=tu_password_mysql
DB_NAME=tuusuario$default
FLASK_SECRET_KEY=clave_super_secreta_unica_123456789
```

### **PASO 5: INSTALAR DEPENDENCIAS (DETALLADO)**

#### **5.1 Abrir Terminal Bash**
1. **Acceder a la consola:**
   - En el dashboard de PythonAnywhere
   - Busca la pestaña **"Consoles"**
   - Haz clic en **"Consoles"**

2. **Iniciar nueva consola Bash:**
   - En la página de Consolas, verás varias opciones
   - En la sección **"Otro:"** (NO en "Pitón:")
   - Haz clic en **"Bash"** 
   - ⚠️ **MUY IMPORTANTE**: NO hagas clic en las consolas Python (3.13, 3.12, etc.)
   - Se abrirá una terminal negra con prompt: `~ $`

#### **5.2 Navegar al Proyecto**
1. **Verificar ubicación actual:**
   ```bash
   pwd
   ```
   - Debe mostrar: `/home/tuusuario`

2. **Ir a la carpeta del proyecto:**
   ```bash
   cd Sistema_Registros
   ```

3. **Verificar que estás en el lugar correcto:**
   ```bash
   ls -la
   ```
   - Debes ver: ejecutable.py, wsgi.py, requirements.txt, etc.

#### **5.3 Instalar Dependencias**
1. **Verificar contenido de requirements.txt:**
   ```bash
   cat requirements.txt
   ```
   - Verifica que veas todas estas dependencias críticas:
     - Flask==3.1.1
     - mysql-connector-python==9.3.0
     - google-api-python-client==2.108.0 (para Google Drive)
     - google-auth==2.23.4 (para autenticación Google)
     - PyMuPDF==1.24.13 (para manejar PDFs)
     - Pillow==10.4.0 (para imágenes)
     - Flask-Mail==0.9.1 (para correos)

2. **Instalar paquetes de Python:**
   ```bash
   pip3.10 install --user -r requirements.txt
   ```
   
   **⏳ Este proceso toma 3-7 minutos** (Google APIs son pesadas)
   - Verás mensajes de "Installing..." para cada paquete
   - Las librerías de Google pueden tomar más tiempo
   - Al final debe decir "Successfully installed..."

3. **Verificar instalación de dependencias críticas:**
   ```bash
   pip3.10 list --user | grep -E "(Flask|mysql|google|PyMuPDF|Pillow)"
   ```
   - Debes ver todas las librerías principales instaladas

#### **5.4 Probar Importaciones Críticas**
1. **Abrir Python en la terminal:**
   ```bash
   python3.10
   ```

2. **Probar importaciones una por una:**
   ```python
   # Dependencias básicas
   import flask
   print("✅ Flask OK")
   
   import mysql.connector
   print("✅ MySQL OK")
   
   # Google APIs (críticas para kilometro_vida.py)
   from google.oauth2 import service_account
   print("✅ Google Auth OK")
   
   from googleapiclient.discovery import build
   print("✅ Google API Client OK")
   
   # Otras dependencias importantes
   import fitz  # PyMuPDF
   print("✅ PyMuPDF OK")
   
   from PIL import Image
   print("✅ Pillow OK")
   
   from flask_mail import Mail
   print("✅ Flask-Mail OK")
   
   exit()
   ```

3. **Si alguna falla:**
   - Instalar individualmente: `pip3.10 install --user nombre_libreria`
   - Verificar que requirements.txt tiene la versión correcta

#### **5.5 Configurar Permisos (Importante)**
1. **Dar permisos de ejecución:**
   ```bash
   chmod +x ejecutable.py
   chmod +x wsgi.py
   ```

2. **Verificar estructura final:**
   ```bash
   find . -name "*.py" -type f
   ```
   - Debe mostrar todos tus archivos .py

### **PASO 6: CONFIGURAR LA WEB APP (PASO A PASO)**

#### **6.1 Crear Nueva Web App**
1. **Ir a la sección Web:**
   - En el dashboard, clic en **"Web"**
   - Verás "You don't have any web apps yet"

2. **Iniciar creación:**
   - Haz clic en **"Add a new web app"** (botón grande)
   - Te preguntará sobre el dominio, haz clic **"Next"**

3. **Seleccionar configuración manual:**
   - Verás opciones como Django, Flask, etc.
   - ⚠️ **IMPORTANTE**: Selecciona **"Manual configuration"**
   - NO selecciones Flask framework (usaremos configuración manual)

4. **Elegir versión de Python:**
   - Selecciona **"Python 3.10"**
   - Haz clic **"Next"**

#### **6.2 Configurar Archivos del Proyecto**

1. **Configurar Source code:**
   - En la página de configuración de tu web app
   - Busca la sección **"Code"**
   - En **"Source code"** escribe:
   ```
   /home/tuusuario/Sistema_Registros
   ```
   - Reemplaza `tuusuario` por tu nombre de usuario real

2. **Configurar Working directory:**
   - En **"Working directory"** escribe la misma ruta:
   ```
   /home/tuusuario/Sistema_Registros
   ```

#### **6.3 Configurar Archivo WSGI**
1. **Ubicar WSGI configuration file:**
   - En la sección "Code"
   - Verás algo como: `/var/www/tuusuario_pythonanywhere_com_wsgi.py`
   - Haz clic en ese enlace (se abrirá el editor)

2. **Reemplazar TODO el contenido del archivo WSGI:**
   - Selecciona todo el contenido (Ctrl+A)
   - Borra todo
   - Pega este código (cambiando `tuusuario` por tu usuario real):

   ```python
   import sys
   import os

   # Añadir el directorio del proyecto al path de Python
   project_home = '/home/tuusuario/Sistema_Registros'
   if project_home not in sys.path:
       sys.path.insert(0, project_home)

   # Configurar variables de entorno
   os.environ['FLASK_ENV'] = 'production'
   os.environ['FLASK_DEBUG'] = 'False'

   # Importar la aplicación Flask
   from ejecutable import app as application

   # Para debugging (opcional)
   if __name__ == "__main__":
       application.run()
   ```

3. **Guardar el archivo:**
   - Haz clic en **"Save"** (botón verde)

#### **6.4 Configurar Variables de Entorno (OPCIONAL)**

⚠️ **IMPORTANTE**: Esta sección es **OPCIONAL**. Muchas cuentas de PythonAnywhere NO muestran la sección "Environment variables" en la configuración de Web App, y esto es completamente normal.

**Si ves la sección "Environment variables":**
1. **En la misma página de configuración de Web App**
2. **Buscar sección "Environment variables"** (puede estar al final de la página)
3. **Añadir variables importantes:**

   | Name | Value |
   |------|-------|
   | `FLASK_ENV` | `production` |
   | `PYTHONPATH` | `/home/tuusuario/Sistema_Registros` |

4. **Clic en ✓ para guardar cada variable**

**Si NO ves la sección "Environment variables":**
- ✅ **No te preocupes, es normal**
- ✅ **Tu archivo `.env.production` es suficiente**
- ✅ **Continúa con el siguiente paso**

#### **6.5 Primer Intento de Carga**
1. **Hacer reload de la aplicación:**
   - En la parte superior de la configuración
   - Haz clic en el botón grande **"Reload"** (verde)
   - Espera 10-15 segundos

2. **Probar la aplicación:**
   - Haz clic en el enlace de tu aplicación: `https://tuusuario.pythonanywhere.com`
   - Si funciona: ¡Perfecto! ✅
   - Si no funciona: continúa con troubleshooting

#### **6.6 Troubleshooting Inicial**
1. **Si ves Error 500:**
   - En la configuración de Web App
   - Busca **"Error log"**
   - Haz clic para ver el log de errores
   - Los errores más comunes:
     - Import error: Verifica que todos los archivos estén subidos
     - Database error: Verifica `.env.production`
     - Path error: Verifica las rutas en wsgi.py

2. **Verificar archivos críticos:**
   ```bash
   # En la consola Bash:
   cd Sistema_Registros
   ls -la ejecutable.py wsgi.py .env.production
   ```
   - Todos deben existir y tener contenido

---

## **❓ PREGUNTAS FRECUENTES ANTES DE CONTINUAR**

### **Variables de Entorno**
**P: No veo la sección "Environment variables" en mi Web App**
- **R**: ✅ Es completamente normal. No todas las cuentas de PythonAnywhere la tienen.
- **R**: ✅ Tu archivo `.env.production` es suficiente y se carga automáticamente.
- **R**: ✅ Continúa con el paso siguiente sin preocuparte.

**P: ¿Necesito configurar variables de entorno manualmente?**
- **R**: No. El archivo `.env.production` que creamos se carga automáticamente desde `ejecutable.py`.

**P: ¿Mi aplicación funcionará sin la sección "Environment variables"?**
- **R**: Sí, perfectamente. Hemos configurado todo en el código para que funcione sin esa sección.

---

## **🔧 SOLUCIÓN DE PROBLEMAS (TROUBLESHOOTING)**

### **ERROR 500 - Internal Server Error**

#### **Diagnóstico Paso a Paso:**
1. **Revisar Error Log:**
   - Web App → **"Error log"**
   - Buscar el error más reciente
   - Los errores comunes son:

**Error de Importación:**
```
ImportError: No module named 'ejecutable'
```
**Solución:**
- Verificar que `ejecutable.py` esté en la carpeta correcta
- Revisar el WSGI file, debe tener la ruta correcta
- Verificar permisos: `chmod +x ejecutable.py`

**Error de Base de Datos:**
```
mysql.connector.errors.DatabaseError: 2003: Can't connect to MySQL server
```
**Solución:**
- Verificar `.env.production` tiene datos correctos
- Probar conexión manual en consola MySQL
- Verificar que la contraseña MySQL esté configurada

**Error de Variables de Entorno:**
```
KeyError: 'DB_HOST'
```
**Solución:**
- Verificar que `.env.production` existe y tiene todas las variables
- Verificar que el archivo se llama exactamente `.env.production`

#### **2. Pasos de Debugging:**
```bash
# En consola Bash:
cd Sistema_Registros

# Verificar archivos existen:
ls -la ejecutable.py wsgi.py .env.production

# Probar importación manual:
python3.10 -c "from ejecutable import app; print('OK')"

# Verificar variables de entorno:
python3.10 -c "
import os
from dotenv import load_dotenv
load_dotenv('.env.production')
print('DB_HOST:', os.getenv('DB_HOST'))
"
```

### **Error de Base de Datos - No Conecta**

#### **Diagnóstico MySQL:**
1. **Abrir consola MySQL:**
   - Dashboard → Databases → "Start a MySQL console"

2. **Verificar conexión básica:**
   ```sql
   SHOW DATABASES;
   USE tuusuario$default;
   SHOW TABLES;
   ```

3. **Si no hay tablas:**
   - Ejecutar de nuevo `database_setup.sql`
   - Verificar que el script se ejecutó sin errores

4. **Si hay error de permisos:**
   - Verificar usuario y contraseña en `.env.production`
   - Probar conexión manual con estos datos

#### **Verificar .env.production:**
```bash
cat .env.production
```
Debe contener (con tus datos reales):
```env
DB_HOST=tuusuario.mysql.pythonanywhere-services.com
DB_USER=tuusuario
DB_PASSWORD=tu_password_real
DB_NAME=tuusuario$default
FLASK_SECRET_KEY=clave_unica_y_secreta
```

### **Archivos Estáticos No Cargan (CSS/JS)**

#### **Síntomas:**
- Sitio se ve como texto plano (sin CSS)
- JavaScript no funciona
- Imágenes no se muestran

#### **Diagnóstico:**
1. **Verificar Static Files configuración:**
   - Web App → Static files
   - Debe tener al menos: `/RESOURCE/` y `/static/`

2. **Probar URLs directamente:**
   ```
   https://tuusuario.pythonanywhere.com/RESOURCE/CSS/index.css
   ```
   - Si funciona: ves el contenido CSS
   - Si no funciona: Error 404

3. **Verificar estructura de carpetas:**
   ```bash
   find RESOURCE -name "*.css" -o -name "*.js"
   ```

#### **Soluciones:**
- Reconfigurar Static files con rutas absolutas
- Verificar que archivos existan en las carpetas
- Hacer Reload después de cambios

### **Error de Correo - No Envía Emails**

#### **Errores Comunes:**
```
SMTPAuthenticationError: Username and Password not accepted
```

#### **Soluciones:**
1. **Configurar Gmail correctamente:**
   - Activar "Verificación en 2 pasos"
   - Crear "Contraseña de aplicación" específica
   - Usar esa contraseña en `MAIL_PASSWORD`

2. **Verificar configuración en .env.production:**
   ```env
   MAIL_SERVER=smtp.gmail.com
   MAIL_PORT=587
   MAIL_USE_TLS=True
   MAIL_USERNAME=tu_email@gmail.com
   MAIL_PASSWORD=tu_password_de_aplicacion
   ```

### **Cámara Web No Funciona**

#### **Requisitos Obligatorios:**
- ✅ HTTPS activado (Force HTTPS = YES)
- ✅ JavaScript debe cargar sin errores
- ✅ Navegador debe pedir permisos

#### **Debugging:**
1. **Verificar HTTPS:**
   - URL debe comenzar con `https://`
   - No debe haber errores de certificado

2. **Verificar JavaScript:**
   - F12 → Console
   - No debe haber errores JavaScript
   - Verificar que archivos .js cargan

3. **Probar en diferentes navegadores:**
   - Chrome (recomendado)
   - Firefox
   - Edge

### **Sitio Muy Lento o No Responde**

#### **Causas Comunes:**
- Plan gratuito tiene limitaciones de CPU
- Muchas consultas a base de datos
- Archivos muy grandes

#### **Optimizaciones:**
- Optimizar consultas SQL
- Reducir tamaño de imágenes
- Usar cache cuando sea posible

### **Comandos de Emergencia para Debugging**

```bash
# Reiniciar todo desde cero:
cd Sistema_Registros

# Verificar estructura:
tree -L 3

# Probar imports:
python3.10 -c "
import sys
sys.path.insert(0, '.')
try:
    from ejecutable import app
    print('✅ App importada correctamente')
except Exception as e:
    print('❌ Error:', e)
"

# Verificar base de datos:
python3.10 -c "
import os
from dotenv import load_dotenv
import mysql.connector
load_dotenv('.env.production')
try:
    conn = mysql.connector.connect(
        host=os.getenv('DB_HOST'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD'),
        database=os.getenv('DB_NAME')
    )
    print('✅ Base de datos conecta OK')
    conn.close()
except Exception as e:
    print('❌ Error DB:', e)
"
```

## ✅ CHECKLIST FINAL DE VERIFICACIÓN

### **Antes de Declarar el Despliegue Exitoso**

#### **📁 Archivos y Estructura:**
- [ ] `ejecutable.py` subido y visible en Files
- [ ] `wsgi.py` subido y configurado correctamente
- [ ] `requirements.txt` subido con todas las dependencias
- [ ] `.env.production` subido y con datos reales (no de ejemplo)
- [ ] `database_setup.sql` subido
- [ ] `kilometro_vida.py` subido
- [ ] Carpeta `TEMPLATES/` completa con todos los HTML
- [ ] Carpeta `RESOURCE/CSS/` con todos los archivos CSS
- [ ] Carpeta `RESOURCE/JS/` con todos los archivos JavaScript
- [ ] Carpeta `RESOURCE/IMG/` con todas las imágenes
- [ ] Carpeta `credenciales/` (si es necesaria)

#### **🗄️ Base de Datos:**
- [ ] Contraseña MySQL configurada en PythonAnywhere
- [ ] Conexión MySQL probada en consola
- [ ] Script `database_setup.sql` ejecutado sin errores
- [ ] Comando `SHOW TABLES;` muestra las tablas creadas
- [ ] Variables de `.env.production` coinciden con datos reales de MySQL

#### **🖥️ Web App:**
- [ ] Web App creada con "Manual configuration"
- [ ] Python 3.10 seleccionado
- [ ] Source code apunta a `/home/tuusuario/Sistema_Registros`
- [ ] WSGI file editado con código correcto
- [ ] Static files configurados para `/RESOURCE/` y `/static/`
- [ ] Force HTTPS activado (YES)
- [ ] Variables de entorno configuradas si es necesario

#### **📦 Dependencias:**
- [ ] `pip3.10 install --user -r requirements.txt` ejecutado sin errores
- [ ] Importación de Flask funciona: `python3.10 -c "import flask; print('OK')"`
- [ ] Importación de mysql-connector funciona
- [ ] Importación de Google APIs funciona: `from google.oauth2 import service_account`
- [ ] Importación de googleapiclient funciona: `from googleapiclient.discovery import build`
- [ ] Importación de PyMuPDF funciona: `import fitz`
- [ ] Importación de Pillow funciona: `from PIL import Image`
- [ ] Importación de ejecutable funciona: `from ejecutable import app`
- [ ] Archivo `credenciales/service_account.json` existe y tiene contenido válido

#### **🔧 Funcionalidades Críticas:**
- [ ] Página principal carga sin Error 500
- [ ] CSS se aplica correctamente (sitio no se ve como texto plano)
- [ ] JavaScript funciona (sin errores en F12 Console)
- [ ] HTTPS funciona (candado verde en navegador)
- [ ] Base de datos se conecta (formularios que usen DB funcionan)
- [ ] Envío de correos funciona (si aplicable)
- [ ] Cámara web pide permisos y funciona (si aplicable)
- [ ] Google Drive conecta correctamente (si aplica)
- [ ] Funcionalidad de `kilometro_vida.py` funciona sin errores
- [ ] PDFs se pueden generar y procesar (PyMuPDF)
- [ ] Imágenes se procesan correctamente (Pillow)

#### **🌐 URLs y Acceso:**
- [ ] `https://tuusuario.pythonanywhere.com` carga la aplicación
- [ ] `https://tuusuario.pythonanywhere.com/RESOURCE/CSS/index.css` muestra CSS
- [ ] `https://tuusuario.pythonanywhere.com/RESOURCE/JS/autoguardado_camara.js` muestra JS
- [ ] Navegación entre páginas funciona
- [ ] Formularios se pueden enviar sin errores

### **🚨 Señales de Problemas:**

**NO continúes si ves esto:**
- ❌ Error 500 en página principal
- ❌ Sitio se ve sin estilos (texto plano)
- ❌ Error log muestra importation errors
- ❌ Variables de entorno no se cargan
- ❌ Base de datos no conecta
- ❌ Archivos estáticos retornan 404

### **✅ Señales de Éxito:**

**Tu despliegue está listo cuando:**
- ✅ Página principal carga con estilos
- ✅ HTTPS funciona sin advertencias
- ✅ No hay errores en el Error log
- ✅ Funcionalidades principales funcionan
- ✅ Cámara web funciona (si aplicable)
- ✅ Base de datos responde correctamente

---

## 🎉 ¡FELICITACIONES!

**Si todos los checks están ✅, tu sistema CFE está corriendo en producción real:**

🌐 **URL de tu sistema**: https://tuusuario.pythonanywhere.com
🔒 **HTTPS**: Activado y funcionando
🗄️ **Base de datos**: MySQL en la nube
📧 **Correos**: Sistema de notificaciones activo
📱 **Móvil**: Compatible con dispositivos móviles
🔧 **Producción**: Listo para uso real en CFE

---

**Tu sistema de registros RIJ está oficialmente desplegado y listo para uso profesional! 🚀**

### **🚨 ERROR ESPECÍFICO: TypeError 'NoneType' is not iterable**

**Síntoma exacto:**
```
TypeError: argument of type 'NoneType' is not iterable
File "ejecutable.py", line 804, in registrar_actividad_usuario
if sid not in usuarios_activos:
```

#### **Causa del Error:**
- La variable `usuarios_activos` se está inicializando como `None` en lugar de un diccionario vacío `{}`
- Problema de inicialización en el entorno de producción de PythonAnywhere

#### **Solución Inmediata (PASO A PASO):**

**1. Aplicar correcciones al código:**
- Ya se han aplicado las correcciones necesarias en `ejecutable.py`
- La función `cargar_usuarios_activos()` ahora maneja correctamente los errores
- Se agregó verificación de seguridad para evitar `None`

**2. Subir archivos corregidos:**
```bash
# En tu computadora local, los archivos ya están corregidos
# Sube a PythonAnywhere:
# - ejecutable.py (corregido)
# - fix_usuarios_activos.py (nuevo script de reparación)
# - verificar_correccion.py (nuevo script de verificación)
```

**3. Ejecutar script de reparación en PythonAnywhere:**
```bash
# En consola Bash de PythonAnywhere:
cd Sistema_Registros

# Ejecutar script de reparación:
python3.10 fix_usuarios_activos.py

# Verificar que todo esté bien:
python3.10 verificar_correccion.py
```

**4. Hacer Reload de la Web App:**
- Ir a la configuración de tu Web App
- Hacer clic en el botón **"Reload"** (verde)
- Esperar 15-20 segundos

**5. Probar la aplicación:**
- Visitar: `https://TU_USUARIO.pythonanywhere.com`
- El error debe estar resuelto

#### **Comando de Emergencia (Si el error persiste):**
```bash
# En consola Bash de PythonAnywhere:
cd Sistema_Registros

# Limpiar archivo de usuarios activos:
rm -f /tmp/rij_usuarios_activos.json

# Probar importación:
python3.10 -c "
from ejecutable import app
print('✅ Importación exitosa')
from ejecutable import get_usuarios_activos
usuarios = get_usuarios_activos()
print(f'✅ Usuarios activos: {type(usuarios)}')
"

# Hacer reload de la app
```

#### **Prevención Futura:**
- El código corregido incluye verificaciones de seguridad
- Se inicializa automáticamente diccionario vacío si hay problemas
- Se manejan errores de archivo corrupto o faltante

---
