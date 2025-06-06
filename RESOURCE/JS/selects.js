// Lógica para selects de división y zona
// -------------------------------------
// Este archivo contiene la lógica relacionada con los selects de división y zona.

const divisionSelect = document.getElementById("division");
const zonaSelect = document.getElementById("zona");

const datos = {
    BajaCalifornia: {
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
        "Mazatlán": []
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
        "Matamoros": []
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
    Jalisco: {
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
    Oriente: {
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
};

function limpiarSelect(select) {
    select.innerHTML = '<option value="">Seleccione una opción</option>';
}

function llenarSelect(select, opciones) {
    opciones.forEach(function(opcion) {
        var nuevaOpcion = document.createElement("option");
        nuevaOpcion.value = opcion;
        nuevaOpcion.textContent = opcion;
        select.appendChild(nuevaOpcion);
    });
}

divisionSelect.addEventListener("change", function() {
    var zonas = datos[divisionSelect.value];
    limpiarSelect(zonaSelect);
    if (zonas) {
        llenarSelect(zonaSelect, Object.keys(zonas));
    }
});
