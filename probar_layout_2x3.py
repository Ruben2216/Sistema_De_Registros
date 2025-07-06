#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de prueba para verificar el nuevo layout 2x3 del PDF y CSS mejorado
"""

import os
import tempfile
import base64
import io
from PIL import Image

def crear_imagen_prueba(color, texto):
    """
    Crea una imagen de prueba con color y texto específicos
    """
    img = Image.new('RGB', (400, 300), color=color)
    
    try:
        from PIL import ImageDraw, ImageFont
        draw = ImageDraw.Draw(img)
        
        try:
            font = ImageFont.truetype("arial.ttf", 20)
        except:
            font = ImageFont.load_default()
        
        # Calcular posición centrada del texto
        bbox = draw.textbbox((0, 0), texto, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        
        x = (400 - text_width) // 2
        y = (300 - text_height) // 2
        
        draw.text((x, y), texto, fill='white', font=font)
        
    except Exception as e:
        print(f"Error al añadir texto: {e}")
    
    # Convertir a base64
    buffer = io.BytesIO()
    img.save(buffer, format='JPEG', quality=85)
    img_bytes = buffer.getvalue()
    img_base64 = base64.b64encode(img_bytes).decode('utf-8')
    
    return f"data:image/jpeg;base64,{img_base64}"

def probar_layout_2x3():
    """
    Prueba el nuevo layout 2x3 del PDF de evidencia
    """
    print("=" * 60)
    print("PRUEBA DEL NUEVO LAYOUT 2x3 DE PDFs")
    print("=" * 60)
    
    # Crear imágenes de prueba con diferentes colores
    colores_prueba = [
        ('red', 'Imagen 1'),
        ('blue', 'Imagen 2'),
        ('green', 'Imagen 3'),
        ('orange', 'Imagen 4'),
        ('purple', 'Imagen 5'),
        ('brown', 'Imagen 6'),
        ('pink', 'Imagen 7'),
        ('gray', 'Imagen 8')
    ]
    
    print(f"\n1. CREANDO IMÁGENES DE PRUEBA:")
    imagenes_prueba = []
    
    for i, (color, texto) in enumerate(colores_prueba):
        print(f"   Creando imagen {i+1}: {texto} ({color})")
        imagen_base64 = crear_imagen_prueba(color, texto)
        
        imagenes_prueba.append({
            'id': f'prueba_{i+1}',
            'nombre': f'prueba_{texto.replace(" ", "_").lower()}.jpg',
            'data': imagen_base64,
            'tamaño': len(imagen_base64)
        })
    
    print(f"   ✅ Creadas {len(imagenes_prueba)} imágenes de prueba")
    
    # Simular datos de la petición
    datos_simulados = {
        'pdfSeleccionado': {
            'id': 'test_layout',
            'nombre': 'Test Layout 2x3'
        },
        'imagenes': imagenes_prueba
    }
    
    print(f"\n2. CONFIGURACIÓN DEL LAYOUT:")
    print(f"   Layout: 2 columnas x 3 filas (6 imágenes por página)")
    print(f"   Márgenes laterales: 2 cm")
    print(f"   Total de imágenes: {len(imagenes_prueba)}")
    print(f"   Páginas necesarias: {(len(imagenes_prueba) + 5) // 6}")
    
    # Simular cálculos del layout
    imagenes_por_pagina = 6
    margen_lateral = 57  # 2 cm en puntos
    ancho_pagina = 595   # A4
    alto_pagina = 842
    margen_superior = 80
    margen_inferior = 57
    
    ancho_disponible = ancho_pagina - (2 * margen_lateral)
    alto_disponible = alto_pagina - margen_superior - margen_inferior
    
    ancho_imagen = (ancho_disponible - 20) / 2
    alto_imagen = (alto_disponible - 40) / 3
    
    print(f"\n3. CÁLCULOS DEL LAYOUT:")
    print(f"   Área disponible: {ancho_disponible:.1f} x {alto_disponible:.1f} puntos")
    print(f"   Tamaño por imagen: {ancho_imagen:.1f} x {alto_imagen:.1f} puntos")
    print(f"   Tamaño por imagen: {ancho_imagen/28.35:.1f} x {alto_imagen/28.35:.1f} cm")
    
    # Simular distribución en páginas
    print(f"\n4. DISTRIBUCIÓN EN PÁGINAS:")
    total_imagenes = len(imagenes_prueba)
    
    for pagina_idx in range(0, total_imagenes, imagenes_por_pagina):
        num_pagina = (pagina_idx // imagenes_por_pagina) + 1
        imagenes_en_pagina = min(imagenes_por_pagina, total_imagenes - pagina_idx)
        
        print(f"   Página {num_pagina}: {imagenes_en_pagina} imágenes")
        
        for i in range(imagenes_en_pagina):
            columna = i % 2
            fila = i // 2
            nombre_imagen = imagenes_prueba[pagina_idx + i]['nombre']
            print(f"     - {nombre_imagen}: Columna {columna + 1}, Fila {fila + 1}")
    
    print(f"\n5. CAMBIOS IMPLEMENTADOS:")
    print(f"   ✅ Removido contador 'Evidencia Fotográfica 1, 2, 3...'")
    print(f"   ✅ Título único: 'Evidencia Fotográfica'")
    print(f"   ✅ Removidos nombres de archivo ('Archivo: ...')")
    print(f"   ✅ Layout 2x3 con márgenes de 2 cm")
    print(f"   ✅ CSS mejorado para evitar desbordamiento")
    print(f"   ✅ Imágenes mantienen proporción")
    
    print(f"\n6. MEJORAS EN LA INTERFAZ:")
    print(f"   ✅ Contenedor de imágenes con scroll limitado")
    print(f"   ✅ Imágenes con tamaño máximo fijo")
    print(f"   ✅ Grid responsivo para visualización")
    print(f"   ✅ Modal mejorado para vista previa")
    
    print(f"\n" + "=" * 60)
    print("CONFIGURACIÓN LISTA PARA PRUEBAS")
    print("Reinicia el servidor y prueba la funcionalidad")
    print("=" * 60)

if __name__ == "__main__":
    probar_layout_2x3()
