const temp = document.getElementById('temp');
const fecha = document.getElementById('fecha-temp');
const condicion = document.getElementById('condicion');
const iconoImg = document.getElementById('icono');
const lluvia = document.getElementById('lluvia');
const tempDia = document.getElementById('temp-dia');
const UV = document.querySelector(".uv-index");
const uvText = document.querySelector(".uv-text");
const sensTermica = document.querySelector(".sens-termica");
const viento = document.querySelector(".viento");
const humedad = document.querySelector(".humedad");
const horaRise = document.querySelector('#horaSunRise');
const horaSet = document.querySelector('#horaSunSet');
const presionAtmos = document.querySelector(".presion-atmos");
const cardsTiempo = document.getElementById('cards-tiempo');
const hoyBoton = document.querySelector(".horas");
const semanaBoton = document.querySelector(".semana");
const buscarForm = document.querySelector('#buscar')
const inputForm = document.querySelector('#query')
var chartContainer = document.querySelector('.chart');


let ciudadActual = "";
let horasSemana = "horas";
var latitudActual = "";
var longitudActual = "";

hoyBoton.addEventListener("click", () =>{
    horasSemana = "horas";
    hoyBoton.classList.add("active")
    semanaBoton.classList.remove("active")
    console.log(horasSemana)
    obtenerUltimaUbicacion();
});

semanaBoton.addEventListener("click", () =>{
    horasSemana = "semana";
    semanaBoton.classList.add("active")
    hoyBoton.classList.remove("active")
    console.log(horasSemana)
    obtenerUltimaUbicacion();
});

buscarForm.addEventListener("submit", (e)=> {
    e.preventDefault();
    let ubicacion = inputForm.value;
    if(ubicacion){
        ciudadActual = ubicacion;
        console.log(ciudadActual)
        localStorage.setItem("ultimaUbicacion", JSON.stringify({ ciudad: ciudadActual }));
        buscarCiudadPorNombre(ciudadActual)
    }
})

function crearGrafico(horas, temperatura, lluviaProbabilidad) {
    chartContainer.innerHTML = '';

    if (horasSemana === "horas") {
        var canvas = document.createElement('canvas');
        chartContainer.appendChild(canvas);

        var ctx = canvas.getContext('2d');

        var myChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: horas,
                datasets: [
                    {
                        label: 'Temperatura',
                        data: temperatura,
                        borderColor: 'rgb(113,68,219)',
                        borderWidth: 2,
                        fill: false,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Probabilidad de Lluvia',
                        data: lluviaProbabilidad,
                        borderColor: 'rgb(255,0,0)',
                        borderWidth: 2,
                        fill: false,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Temperatura (°C)'
                        }
                    },
                    y1: {
                        beginAtZero: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Probabilidad de Lluvia (%)'
                        }
                    }
                }
            }
        });

        return myChart;
    }

    return null;
}


function getDiaHoy(){
    let hoy = new Date();
    let diaHoy = hoy.toLocaleDateString('es-ES', { weekday: 'long' });

    return `${diaHoy}`;
}

function getFechaHora(){
    let hoy = new Date();
    hora = hoy.getHours(),
    minuto = hoy.getMinutes();

    let dia = hoy.toLocaleDateString('es-ES', { weekday: 'long' });

    if (minuto < 10) return `${dia}, ${hora}:0${minuto}`;
    return `${dia}, ${hora}:${minuto}`;
}

setInterval(() => {
    fecha.innerText = getFechaHora();
}, 1000);


function obtenerUbicacion() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => obtenerCiudad(position, true), mostrarError);
    } else {
        alert("Geolocalización no es soportada en tu navegador.");
    }
}

function obtenerCiudad(position, guardarCiudad) {
    var latitudUsuario = position.coords.latitude;
    var longitudUsuario = position.coords.longitude;

    if(guardarCiudad) {
        localStorage.setItem("ultimaUbicacion", JSON.stringify({ latitud: latitudUsuario, longitud: longitudUsuario }));
    }
    buscarCiudadPorCoordenadas(latitudUsuario, longitudUsuario);
}

function mostrarError(error) {
    switch (error.code) {
        case error.PERMISSION_DENIED:
            console.log("El usuario ha denegado la solicitud de geolocalización.");
            break;
        case error.POSITION_UNAVAILABLE:
            console.log("Información de ubicación no disponible.");
            break;
        case error.TIMEOUT:
            console.log("La solicitud de geolocalización ha excedido el tiempo de espera.");
            break;
        case error.UNKNOWN_ERROR:
            console.log("Error desconocido al intentar obtener la ubicación.");
            break;
    }
}

function obtenerUltimaUbicacion() {
    const ultimaUbicacion = localStorage.getItem("ultimaUbicacion");
    if (ultimaUbicacion) {
        const { latitud, longitud, ciudad } = JSON.parse(ultimaUbicacion);

        if (latitud && longitud) {
            buscarCiudadPorCoordenadas(latitud, longitud);
        } else if (ciudad) {
            buscarCiudadPorNombre(ciudad);
        }
    } else {
        obtenerUbicacion();
    }
}


function buscarCiudadPorCoordenadas(latitud, longitud) {
    var urlDatos = 'https://www.alpati.net/DWEC/cities/';

    fetch(urlDatos)
        .then(response => response.text())
        .then(data => {
            var datosCiudades = data.replace(/\s+/g, ' ').match(/(\[.*\])/);
 
            if (datosCiudades) {
                var ciudades = JSON.parse(datosCiudades[0]);

                for (var i = 0; i < ciudades.length; i++) {
                    var ciudad = ciudades[i];
                    var latitudCiudad = parseFloat(ciudad[3]);
                    var longitudCiudad = parseFloat(ciudad[4]);

                    var tolerancia = 0.020;

                    if (Math.abs(latitudCiudad - latitud) < tolerancia && Math.abs(longitudCiudad - longitud) < tolerancia) {
                        mostrarInformacionCiudad(ciudad);
                        return;
                    }
                }

                console.log("No se encontró ninguna ciudad con esas coordenadas.");
            }
        })
        .catch(error => {
            console.error('Error al obtener datos:', error);
        });
}

function buscarCiudadPorNombre(ciudadActual) {
    var urlDatos = 'https://www.alpati.net/DWEC/cities/';

    fetch(urlDatos)
        .then(response => response.text())
        .then(data => {
            var datosCiudades = data.replace(/\s+/g, ' ').match(/(\[.*\])/);
 
            if (datosCiudades) {
                var ciudades = JSON.parse(datosCiudades[0]);

                for (var i = 0; i < ciudades.length; i++) {
                    var ciudad = ciudades[i];
                    var nombreAcento = ciudad[1];
                    var nombreSinAcento = ciudad[2];

                    if (nombreAcento == ciudadActual || nombreSinAcento == ciudadActual) {
                        mostrarInformacionCiudad(ciudad);
                        return;
                    }
                }

                console.log("No se encontró ninguna ciudad con ese nombre.");
            }
        })
        .catch(error => {
            console.error('Error al obtener datos:', error);
        });
}

function mostrarInformacionCiudad(ciudad) {
    var nombreCiudad = ciudad[2];
    latitudActual = ciudad[3];
    longitudActual = ciudad[4];

    console.log(ciudad);
    console.log("Nombre de la ciudad:", nombreCiudad);

    var ubicacion = document.getElementById('ubicacion')
    ubicacion.innerText = `${nombreCiudad}`
    console.log(latitudActual, longitudActual);

    getWeatherData(latitudActual, longitudActual);


}

function getWeatherData(latitud, longitud){
    let numDias = 1;

    if (horasSemana === "semana"){
        numDias = 7;
    }

    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitud}&longitude=${longitud}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,cloud_cover,surface_pressure,wind_speed_10m&hourly=temperature_2m,cloud_cover_low,precipitation,precipitation_probability,rain,is_day&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max&timezone=auto&forecast_days=${numDias}`)
        .then(response => {
            if (!response.ok){
                throw new Error("Error en la solicitud" + response.status);
            }

            return response.json();
        })
        
        .then(data => {
            cambiarFondoVideo(data.current.is_day)
            let tempActual = Math.round(data.current.temperature_2m);
            temp.innerText = tempActual;

            let diaNoche = data.current.is_day;
            let condicion = data.current.cloud_cover;
            let lluvia = data.current.rain;
            getCondicion(condicion, diaNoche, lluvia)

            let lluviaPorcentaje = data.current.rain;
            lluvia.innerText = `${lluviaPorcentaje}%`;
            console.log(data);

            let uv_tiempo = data.daily.time;
            let uv_index = data.daily.uv_index_max;
            getUV(uv_tiempo, uv_index);

            let sensacion = Math.floor(data.current.apparent_temperature);
            sensTermica.innerText = sensacion;

            let rachaViento = data.current.wind_speed_10m;
            viento.innerHTML = rachaViento;

            let horaSunrise = data.daily.sunrise[0];
            let horaSunset = data.daily.sunset[0];

            horaRise.innerText = `${formatearHora(horaSunrise)} AM`;
            horaSet.innerText = `Atardecer ${formatearHora(horaSunset)} PM`;


            let humedo = data.current.relative_humidity_2m;
            humedad.innerText = humedo;

            let presion = Math.floor(data.current.surface_pressure);
            presionAtmos.innerText = presion;

            if (horasSemana === "horas"){
                updatePronostico(data.hourly.time, data.hourly.temperature_2m, data.hourly.cloud_cover_low, data.hourly.is_day, "dia", data.hourly.rain, "")
            } else {
                updatePronostico(data.daily.time, data.daily.temperature_2m_max, data.hourly.cloud_cover_low, "", "semana", "", data.daily.precipitation_probability_max)
            }

            let grafico = crearGrafico(formatearHorasArray(data.hourly.time), data.hourly.temperature_2m, data.hourly.precipitation_probability);

            if (grafico) {
                chartContainer.style.display = 'block';
            } else {
                chartContainer.style.display = 'none';
            }
        })
        .catch(error => {
            console.error(error);
        });
}

function formatearHora(fechaString) {
    const fecha = new Date(fechaString);

    let horas = fecha.getHours();
    let minutos = fecha.getMinutes();

    minutos = minutos < 10 ? '0' + minutos : minutos;

    return `${horas}:${minutos}`;
}

function getUV(uv_tiempo, uv_index){
    let fechaHoy = getFechaActual();
    let index = 0;

    for(i=0; i < uv_tiempo.length; i++){
        if (uv_tiempo[i] === fechaHoy){
            index = i;
        }
    }
    UV.innerText = uv_index[index]
    comprobarUV(uv_index[index]);
}

function comprobarUV(uv){
    if (uv >= 0 && uv < 3){
        uvText.innerText = "Muy débil";
    } else if (uv >= 3 && uv < 6){
        uvText.innerText = "Débil";
    } else if (uv >= 6 && uv < 8){
        uvText.innerText = "Moderado";
    } else if (uv >= 8 && uv < 11){
        uvText.innerText = "Fuerte";
    } else {
        uvText.innerText = "Muy fuerte";
    }
}

function getCondicion(condicionclima, esDia, lluvia){

    if (esDia == 0){
        if (condicionclima >= 70 && condicionclima <= 100){
            condicion.innerHTML = "Muy nublado";
            if (lluvia >= 0.3){
                iconoImg.src = "icons/moon/1.png";

            } else {
                iconoImg.src = "icons/moon/31.png";
            }
        } else if (condicionclima >= 50 && condicionclima < 70){
            condicion.innerHTML = "Nublado";
            if (lluvia >= 0.3){
                iconoImg.src = "icons/moon/2.png";
            } else {
                iconoImg.src = "icons/moon/15.png";
            }

        } else if (condicionclima < 50) {
            condicion.innerHTML = "Despejado";
            if (lluvia >= 0.3){
                iconoImg.src = "icons/moon/10.png";
            } else {
                iconoImg.src = "icons/moon/10.png";
            }
        }
    } else {
        if (condicionclima >= 70 && condicionclima <= 100){
            condicion.innerHTML = "Muy nublado";
            if (lluvia >= 0.3) {
                iconoImg.src = "icons/cloud/35.png";

            }else{
                iconoImg.src = "icons/cloud/35.png";
            }
        } else if (condicionclima >= 50 && condicionclima < 70){
            condicion.innerHTML = "Nublado";
            if (lluvia >= 0.3) {
                iconoImg.src = "icons/sun/8.png";

            }else{
                iconoImg.src = "icons/sun/27.png";

            }

        } else if (condicionclima < 50) {
            condicion.innerHTML = "Despejado";

            if (lluvia >= 0.3) {
                iconoImg.src = "icons/rain/39.png";

            }else{
                iconoImg.src = "icons/sun/26.png";

            }
        }
    }
}

function getFechaActual(){
    var hoy = new Date();

    var year = hoy.getFullYear();
    var month = String(hoy.getMonth() + 1).padStart(2, '0');
    var day = String(hoy.getDate()).padStart(2, '0');

    var fechaFormateada = `${year}-${month}-${day}`;

    return fechaFormateada;
}

function formatearHorasArray(arrayFechas) {
    return arrayFechas.map(function(fechaString) {
        var fecha = new Date(fechaString);

        var horas = fecha.getHours();
        var minutos = fecha.getMinutes();

        var horasStr = horas < 10 ? "0" + horas : horas;
        var minStr = minutos < 10 ? "0" + minutos : minutos;

        return `${horasStr}:${minStr}`;
    });
}

function getHoraCard(fechaString){
    var fecha = new Date(fechaString);

    var horas = fecha.getHours();
    var minutos = fecha.getMinutes();

    var horasStr = horas < 10 ? "0" + horas : horas;
    var minStr = minutos < 10 ? "0" + minutos : minutos;

    return `${horasStr}:${minStr}`;
}

function getNombreCard(fechaString){
    let dia = new Date(fechaString);
    let dias = dia.toLocaleDateString('es-ES', { weekday: 'long' });

    return `${dias}`;
}

function getCondicionPorHora(condicionclima, esDia = 1, lluvia, prob){
    if (esDia == 0){
        if (condicionclima >= 70 && condicionclima <= 100){
            if (lluvia >= 0.2){
                return "icons/moon/1.png";
            } else if(prob >= 50){
                return "icons/moon/1.png";
            }
            return "icons/moon/31.png";
        } else if (condicionclima >= 50 && condicionclima < 70){
                if (lluvia >= 0.2){
                    return "icons/moon/1.png";
                } else if (prob >= 50){
                    return "icons/moon/1.png";
                }
                return "icons/moon/15.png";

        } else if (condicionclima < 50) {
                if (lluvia >= 0.2){
                    return "icons/moon/2.png";
                } else if (prob >= 50){
                    return "icons/moon/2.png";
                }   
                return "icons/moon/10.png";
        }
    } else {
        if (condicionclima >= 70 && condicionclima <= 100){
            if (lluvia >= 0.2){
                return "icons/cloud/7.png";
            } else if (prob >= 50){
                return "icons/cloud/7.png";
            }
            return "icons/cloud/35.png";
        } else if (condicionclima >= 50 && condicionclima < 70){
                if (lluvia >= 0.2){
                    return "icons/sun/8.png";
                } else if (prob >= 50){
                    return "icons/sun/8.png";
                }
                return "icons/sun/27.png";

        } else if (condicionclima < 50) {
                if (lluvia >= 0.2){
                    return "icons/rain/39.png";
                } else if (prob >= 50){
                    return "icons/rain/39.png";
                }
                return "icons/sun/26.png";
        }
    }

    
}

function updatePronostico(data, temperatura, cloud, esDia, tipo, lluvia, probabilidad){
    cardsTiempo.innerHTML = "";

    let numCards = 0;

    if (tipo === "dia"){
        numCards = 24;
    } else {
        numCards = 7;
    }

    for (let i = 0; i < numCards; i++){
        let card = document.createElement("div");
        card.classList.add("card");

        let nomDia = getHoraCard(data[i]);
        let icono = getCondicionPorHora(cloud[i], esDia[i], lluvia[i], "");
        
        if(tipo === "semana"){
            nomDia = getNombreCard(data[i]);
            icono = getCondicionPorHora(cloud[i+12], 1, "", probabilidad[i]);
        }

        let temp = Math.floor(temperatura[i]);
     
        card.innerHTML = `
            <h2 class="nom-dia" id="nom_dia">${nomDia}</h2>
            <div class="icono-card">
                <img src="${icono}" alt="" id="img_card">
            </div>
            <div class="temp-dia">
                <h3 id="temp-dia">${temp}</h3>
                <span class="unidad-temp">ºC</span>
            </div>
        `;

        cardsTiempo.appendChild(card);
    }
}

function cambiarFondoVideo(esDia) {
    var video = document.getElementById('fondo-video');
    var source = document.createElement('source');

    if (esDia === 1) {
        source.src = 'fondo/niebla.mp4';
    } else {
        source.src = 'fondo/noche.mp4';
    }

    while (video.firstChild) {
        video.removeChild(video.firstChild);
    }
    video.appendChild(source);
}

function obtenerTodasCiudades() {
    var urlDatos = 'https://www.alpati.net/DWEC/cities/';

    return fetch(urlDatos)
        .then(response => response.json())
        .then(data => {
            if (data) {
                return data;
            }
        })
        .catch(error => {
            console.error('Error al obtener datos:', error);
        });
}

obtenerUltimaUbicacion();

var currentFocus;


async function obtenerCiudadesYEscucharInput() {
    try {
        const ciudades = await obtenerTodasCiudades();
        const ciudadesNombre = ciudades.map(ciudad => ciudad[1]);
        console.log(ciudadesNombre);

        inputForm.addEventListener("input", function(e) {
            eliminarSugerencias()
            var a, b, i, val = this.value;
            if (!val) {
                return false;
            }

            currentFocus = -1;

            a = document.createElement("ul");
            a.setAttribute("id", "sugerencias");

            this.parentNode.appendChild(a);

            for (i = 0; i < ciudadesNombre.length; i++) {
                if (ciudadesNombre[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
                    b = document.createElement("li");
                    b.innerHTML = `<strong>${ciudadesNombre[i].substr(0, val.length)}</strong>`;
                    b.innerHTML += ciudadesNombre[i].substr(val.length);
                    b.innerHTML += `<input type="hidden" value="${ciudadesNombre[i]}">`;

                    b.addEventListener("click", function(e) {
                        inputForm.value = this.getElementsByTagName("input")[0].value;
                        eliminarSugerencias()
                    });

                    a.appendChild(b);
                }
            }
        });
    } catch (error) {
        console.error('Error al obtener ciudades:', error);
    }
}

function eliminarSugerencias(){
    var x = document.getElementById("sugerencias");
    if (x){x.parentNode.removeChild(x);}
}


obtenerCiudadesYEscucharInput();

