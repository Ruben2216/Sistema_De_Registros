const divisionSelect = document.getElementById("division");
const zonaSelect = document.getElementById("zona");
  
  const datos = {
      Baja_California: {
          "Tijuana" : [],
          "Los Cabos" : [],
          "La Paz" : [],
          "Ensenada" : [],
          "Constitución" : [],
          "Mexicali" : [],
          "San Luis":[]
      },
      Noroeste:{
      "Nogales": [],
      "Caborca": [],
      "Hermosillo": [],
      "Guaymas": [],
      "Obregón": [],
      "Navojoa": [],
      "Los Mochis": [],
      "Guasave": [],
      "Culiacán": [],
      "Mazatlán": [],
      },
      Norte:{
          "Chihuahua": [],
          "Cuauhtémoc": [],
          "Delicias": [],
          "Casas Grandes": [],
          "Juárez": [],
          "Parral": [],
          "Durango": []

      },
      Golfo_Norte:{
          "Cerralvo": [],
          "Montemorelos": [],
          "Metropolitana Norte": [],
          "Metropolitana Oriente": [],
          "Metropolitana Poniente": [],
          "Piedras Negras": [],
          "Sabinas": [],
          "Monclova": [],
          "Saltillo": [],
          "Nuevo Laredo": [],
          "Reynosa": [],
          "Matamoros": [],



      },
      Golfo_Centro:{
          "Tampico": [],
          "Mante": [],
          "Victoria": [],
          "Matehuala": [],
          "San Luis Potosí": [],
          "Río Verde": [],
          "Valles": [],
          "Huejutla": []

      },
      Bajio:{
          "San Juan del Río": [],
          "Irapuato": [],
          "León": [],
          "Celaya": [],
          "Querétaro": [],
          "Salvatierra": [],
          "Ixmiquilpan": [],
          "Aguascalientes": [],
          "Fresnillo": [],
          "Zacatecas": []
      },


      jalisco: {
        "Metropolitana Hidalgo": [],
      "Metropolitana Juárez": [],
      "Metropolitana Libertad": [],
      "Metropolitana Reforma": [],
      "Los Altos": [],
      "Ciénega": [],
      "Zapotlán": [],
      "Costa": [],
      "Minas": [],
      "Chapala": [],
      "Santiago": [],
      "Tepic": [],
      "Vallarta": []
      },
      Centro_Occidente:{
      "Morelia": [],
      "Uruapan": [],
      "Zamora": [],
      "Colima": [],
      "Zitácuaro": [],
      "Lázaro Cárdenas": [],
      "La Piedad": [],
      "Pátzcuaro": [],
      "Apatzingán": [],
      "Manzanillo": [],
      "Jiquilpan": [],
      "Zacapu": []
  },
  Centro_Sur:{
      "Acapulco": [],
      "Altamirano": [],
      "Chilpancingo": [],
      "Iguala": [],
      "Zihuatanejo": [],
      "Morelos": [],
      "Cuautla": [],
      "Atlacomulco": [],
      "Valle de Bravo": [],
      "Cuernavaca": []
  },
  Centro_Oriente:{
      "Tlaxcala": [],
      "Tehuacán": [],
      "Matamoros": [],
      "San Martín": [],
      "Tecamachalco": [],
      "Puebla Poniente": [],
      "Puebla Oriente": [],
      "Pachuca": [],
      "Tulancingo": [],
      "Tula": []

  },
      oriente: {
      "Poza Rica": [],
      "Xalapa": [],
      "Teziutlán": [],
      "Veracruz": [],
      "Papaloapan": [],
      "Los Tuxtlas": [],
      "Coatzacoalcos": [],
      "Orizaba": [],
      "Córdoba": []
      },
    Sureste:{
    "San Cristóbal": [],
  "Tuxtla": [],
  "Oaxaca": [],
  "Huatulco": [],
  "Huajuapan": [],
  "Tapachula": [],
  "Tehuantepec": [],
  "Villahermosa": [],
  "Chontalpa": [],
  "Los Ríos": []
    },
    Peninsula:{
      "Campeche": [],
      "Carmen": [],
      "Cancún": [],
      "Riviera Maya": [],
      "Chetumal": [],
      "Mérida": [],
      "Tizimín": [],
      "Motul": [],
      "Ticul": []
    },
    Valle_Norte:{
      "Atizapán": [],
      "Azteca": [],
      "Basílica": [],
          "Cuautitlán": [],
      "Ecatepec": [],
      "Naucalpan": [],
      "Tlalnepantla": []
    },
    Valle_Centro:{
      "Zócalo": [],
      "Aeropuerto": [],
      "Benito Juárez": [],
      "Polanco": [],
      "Nezahualcóyotl": [],
      "Chapingo": [],
      "Tacuba": []
    },
    Valle_Sur:{
      "Volcanes": [],
      "Ermita": [],
      "Coapa": [],
      "Universidad": [],
      "Lomas": [],
      "Tenango": [],
      "Toluca": []
    }
  }


// Limpia el contenido de un elemento <select>
function limpiarSelect(select) {
    // Establece una opción predeterminada
    select.innerHTML = '<option value="">Seleccione una opción</option>';
    
    
}

// Llena un elemento <select> con opciones dadas 
function llenarSelect(select, opciones) {

    // Agrega cada opción al <select>
    opciones.forEach(function(opcion) {
        var nuevaOpcion = document.createElement("option");
        nuevaOpcion.value = opcion;
        nuevaOpcion.textContent = opcion;
        select.appendChild(nuevaOpcion); //por lo que lei el appendChild es mas eficiente que innerHTML ya que permite agregar nodos directamente en lygar de hacerlo con un for iterativo
        
    });
    
}

// Evento para cuando cambia la selección de división
divisionSelect.addEventListener("change", function() {
    // Obtiene las zonas correspondientes a la división seleccionada del arreglo de datos definidos más arriba
    var zonas = datos[divisionSelect.value];

    // Limpia el select de zonas
    limpiarSelect(zonaSelect);

    // Llena el select de zonas 
    llenarSelect(zonaSelect, Object.keys(zonas));
});
