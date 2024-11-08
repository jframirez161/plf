import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Import axios
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import ThreeFarm from './05a_ThreeFarm'; 

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, annotationPlugin);

function BASGRA() {
  const [segments, setSegments] = useState(3); // Default to 3 segments
  const [segmentLengths, setSegmentLengths] = useState([121, 122, 122]); // Number of days per segment
  const [dayTypes, setDayTypes] = useState([]); // Array of day type selectors for each segment
    
  const [randomnessLevel, setRandomnessLevel] = useState(0.1); // Default randomness level
  const [altitude, setAltitude] = useState(2000); // Altitude in meters
    
  const [gvbData, setGvbData] = useState([]); // New state for gv_b data
  const [dvbData, setDvbData] = useState([]); // New state for dv_b data

/*By introducing an altitude parameter and adjusting your weather parameters accordingly, you can simulate more realistic weather conditions for different regions in Colombia. The key adjustments include:

Temperature: Decreases by approximately 6.5°C per 1000 meters.
Global Radiation: Increases by about 5% per 1000 meters due to thinner atmosphere.
Vapour Pressure: Decreases by about 10% per 1000 meters.
These adjustments will make your simulation more representative of Colombia's diverse climates, ranging from coastal areas to high-altitude regions.*/


  // Compute totalDays as the sum of segmentLengths
  const totalDays = segmentLengths.reduce((sum, len) => sum + len, 0);

  const transitionDays = 5; // Number of days over which transitions occur

  // Typical values for each weather type
  const weatherTypeValues = {
    "Soleado": { maxTemp: 32, minTemp: 20, globalRadiation: 25, vapourPressure: 1.0, rainfall: 0, windSpeed: 2 },
    "Parcialmente nublado": { maxTemp: 28, minTemp: 18, globalRadiation: 15, vapourPressure: 1.5, rainfall: 1, windSpeed: 3 },
    "Nublado": { maxTemp: 25, minTemp: 15, globalRadiation: 10, vapourPressure: 2.0, rainfall: 2, windSpeed: 2 },
    "Lluvioso": { maxTemp: 23, minTemp: 16, globalRadiation: 8, vapourPressure: 2.5, rainfall: 20, windSpeed: 4 },
    "Tormentoso": { maxTemp: 22, minTemp: 14, globalRadiation: 5, vapourPressure: 2.8, rainfall: 50, windSpeed: 6 },
    "Ventoso": { maxTemp: 30, minTemp: 18, globalRadiation: 20, vapourPressure: 1.2, rainfall: 0, windSpeed: 8 },
    "Húmedo": { maxTemp: 28, minTemp: 24, globalRadiation: 15, vapourPressure: 3.0, rainfall: 0, windSpeed: 1 },
    "Seco": { maxTemp: 35, minTemp: 22, globalRadiation: 25, vapourPressure: 0.8, rainfall: 0, windSpeed: 2 },
  };

  useEffect(() => {
    const defaultLength = 30; // Default duration for each segment
    const lengths = Array(segments).fill(defaultLength);
    setSegmentLengths(lengths);
    setDayTypes(Array(segments).fill("Soleado"));
  }, [segments]);

  const computeSegmentBoundaries = () => {
    let boundaries = [];
    let currentDay = 1;

    segmentLengths.forEach((length) => {
      boundaries.push({ start: currentDay, end: currentDay + length - 1 });
      currentDay += length;
    });

    return boundaries;
  };

  const handleSegmentLengthChange = (index, value) => {
    const newLengths = [...segmentLengths];
    const newValue = parseInt(value, 10);

    if (!isNaN(newValue) && newValue > 0) {
      newLengths[index] = newValue;
      setSegmentLengths(newLengths);
    }
  };

  const handleDayTypeChange = (index, newDayType) => {
    const newDayTypes = [...dayTypes];
    newDayTypes[index] = newDayType;
    setDayTypes(newDayTypes);
  };

  const handleSegmentsChange = (e) => {
    const segmentCount = parseInt(e.target.value, 10);
    if (!isNaN(segmentCount) && segmentCount > 0) {
      setSegments(segmentCount);
    }
  };
    
const randomnessFactors = {
  maxTemp: 2, // Maximum variation of ±2°C
  minTemp: 2,
  globalRadiation: 5, // Variation of ±5 W/m²
  vapourPressure: 0.2, // Variation of ±0.2 hPa
  rainfall: 5, // Variation of ±5 mm
  windSpeed: 1, // Variation of ±1 m/s
};
    
const clampValue = (param, value) => {
  const ranges = {
    maxTemp: [-50, 60], // Temperature range in °C
    minTemp: [-70, 50],
    globalRadiation: [0, 1361], // Solar constant maximum W/m²
    vapourPressure: [0, 10], // hPa
    rainfall: [0, 500], // mm
    windSpeed: [0, 60], // m/s
  };

  const [min, max] = ranges[param];
  return Math.min(Math.max(value, min), max);
};


// Update randomnessFactors based on randomnessLevel
const adjustedRandomnessFactors = Object.fromEntries(
  Object.entries(randomnessFactors).map(([param, factor]) => [param, factor * randomnessLevel])
);

    
   const adjustForAltitude = (param, baseValue) => {
  // Temperature decreases by approximately 6.5°C per 1000 meters
  if (param === 'maxTemp' || param === 'minTemp') {
    const lapseRate = 6.5; // °C per 1000 meters
    const tempAdjustment = (altitude / 1000) * lapseRate;
    return baseValue - tempAdjustment;
  }

  // Global radiation increases with altitude due to thinner atmosphere
  if (param === 'globalRadiation') {
    const radiationIncreaseRate = 0.05; // 5% increase per 1000 meters
    const adjustmentFactor = 1 + (altitude / 1000) * radiationIncreaseRate;
    return baseValue * adjustmentFactor;
  }

  // Vapour pressure decreases with altitude
  if (param === 'vapourPressure') {
    const vapourPressureDecreaseRate = 0.10; // 10% decrease per 1000 meters
    const adjustmentFactor = 1 - (altitude / 1000) * vapourPressureDecreaseRate;
    return baseValue * adjustmentFactor;
  }

  // You can adjust other parameters similarly if needed
  return baseValue;
};
 
    
    
   const generateWeatherData = () => {
  let weatherData = [];
  const boundaries = computeSegmentBoundaries();

  for (let i = 0; i < boundaries.length; i++) {
    const boundary = boundaries[i];
    const dayType = dayTypes[i] || "Soleado";
    const selectedValues = weatherTypeValues[dayType];

    // Determine the next segment's values for transition
    const nextDayType = dayTypes[i + 1];
    const nextSelectedValues = weatherTypeValues[nextDayType] || null;

    for (let day = boundary.start; day <= boundary.end; day++) {
      let weatherEntry = { dayOfYear: day };
      const daysLeftInSegment = boundary.end - day + 1;

      if (daysLeftInSegment <= transitionDays && nextSelectedValues) {
        // Interpolation factor
        const t = (transitionDays - daysLeftInSegment) / transitionDays;

        Object.keys(selectedValues).forEach((param) => {
          const startValue = adjustForAltitude(param, selectedValues[param]);
          const endValue = adjustForAltitude(param, nextSelectedValues[param]);
          const interpolatedValue = startValue + (endValue - startValue) * t;

          // Add randomness using adjustedRandomnessFactors
          const randomVariation = (Math.random() * 2 - 1) * adjustedRandomnessFactors[param];
          let valueWithRandomness = interpolatedValue + randomVariation;

          // Clamp value within acceptable range
          valueWithRandomness = clampValue(param, valueWithRandomness);

          weatherEntry[param] = valueWithRandomness;
        });
      } else {
        Object.keys(selectedValues).forEach((param) => {
          const baseValue = adjustForAltitude(param, selectedValues[param]);

          const randomVariation = (Math.random() * 2 - 1) * adjustedRandomnessFactors[param];
          let valueWithRandomness = baseValue + randomVariation;

          valueWithRandomness = clampValue(param, valueWithRandomness);

          weatherEntry[param] = valueWithRandomness;
        });
      }

      weatherData.push(weatherEntry);
    }
  }

  return weatherData;
};
 
    


  const weatherData = generateWeatherData();

  const dates = weatherData.map((day) => day.dayOfYear);
  const maxTemps = weatherData.map((day) => day.maxTemp);
  const minTemps = weatherData.map((day) => day.minTemp);
  const globalRadiation = weatherData.map((day) => day.globalRadiation);
  const vapourPressure = weatherData.map((day) => day.vapourPressure);
  const rainfall = weatherData.map((day) => day.rainfall);
  const windSpeed = weatherData.map((day) => day.windSpeed);

  const boundaries = computeSegmentBoundaries();

  const verticalLines = boundaries.map((boundary) => ({
    type: 'line',
    xMin: boundary.start,
    xMax: boundary.start,
    borderColor: 'gray',
    borderWidth: 1,
  }));

  const data = {
    labels: dates,
    datasets: [
      { label: 'Temperatura Máxima (°C)', data: maxTemps, borderColor: 'red', fill: false, pointRadius: 0, pointBackgroundColor: 'red' },
      { label: 'Temperatura Mínima (°C)', data: minTemps, borderColor: 'blue', fill: false, pointRadius: 0, pointBackgroundColor: 'blue' },
      { label: 'Radiación Global Entrante (MJ/m²)', data: globalRadiation, borderColor: 'orange', fill: false, pointRadius: 0, pointBackgroundColor: 'orange' },
      { label: 'Presión de Vapor (kPa)', data: vapourPressure, borderColor: 'purple', fill: false, pointRadius: 0, pointBackgroundColor: 'purple' },
      { label: 'Precipitación (mm)', data: rainfall, borderColor: 'green', fill: false, pointRadius: 0, pointBackgroundColor: 'green' },
      { label: 'Velocidad del Viento (m/s)', data: windSpeed, borderColor: 'brown', fill: false, pointRadius: 0, pointBackgroundColor: 'brown' },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Simulación Interactiva del Clima' },
      annotation: {
        annotations: verticalLines,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Día del Año',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Valor',
        },
      },
    },
  };
    
    
  /*  ########### BASGRA ###############*/
    
    
  const reloadData = () => {
    setWeatherData([]);
    setIsDataGenerated(false);      
    setGvbData([]); // Clear gv_b data
    setDvbData([]); // Clear dv_b data
  };
    

  // Function to send weather data to the server
  const sendWeatherData = async () => {
    try {
      const response = await axios.post('https://locomotion-back-d60dee4c012c.herokuapp.com/process-basgra', weatherData, {
        headers: { 'Content-Type': 'application/json' },
      });
      //console.log('Response from server:', response.data);        
      // Store the gv_b and dv_b data in state
      setGvbData(response.data.gv_b);
      setDvbData(response.data.dv_b);

    } catch (error) {
      console.error("Error sending weather data:", error);
    }
  };
    
    const gvDvbDataChart = {
    labels: dates,
    datasets: [
      {
        label: 'Biomasa Verde (kg DM/ha)',
        data: gvbData,
        borderColor: 'green',
        fill: false,
        pointRadius: 3,
      },
      {
        label: 'Biomasa Muerta (kg DM/ha)',
        data: dvbData,
        borderColor: 'brown',
        fill: false,
        pointRadius: 3,
      }
    ],
  };
    

  return (
    <main className="images-page">
      
     <section style={{ width: '80%', margin: '0 auto' }}>
        <div className="App" style={{ backgroundColor: '#f0f0f0', color: '#000' }}>
          <h1>Objetivo </h1>
          <p>El objetivo de este proyecto es desarrollar un software que simule el impacto de diversas prácticas sostenibles y regenerativas en fincas lecheras. Esta herramienta permitirá a los usuarios ajustar variables clave relacionadas con prácticas agronómicas, manejo ganadero y tecnologías implementadas. Al modificar estas variables, los usuarios podrán visualizar proyecciones detalladas sobre rentabilidad económica e impacto ambiental, comprendiendo los efectos de adoptar prácticas más sostenibles. </p>      
         </div>

      </section>
      
<section style={{ width: '80%', margin: '0 auto', marginTop: '20px', paddingBottom: '40px' }}>
  <div className="App" style={{ backgroundColor: '#f0f0f0', color: '#000', padding: '20px', borderRadius: '8px' }}>
    <h1 style={{ textAlign: 'center' }}>Módulo de Diseño de Granja</h1>
    <ThreeFarm />
  </div>
</section>

      
      <section style={{ width: '80%', margin: '0 auto' }}>
        <div className="App" style={{ backgroundColor: '#f0f0f0', color: '#000' }}>
          <h1>Módulo de Clima</h1>
      
          <div style={{ marginTop: '10px' }}>
            <label>
              Altitud (msnm):
              <input
                type="number"
                min="0"
                max="3000"
                value={altitude}
                onChange={(e) => setAltitude(parseInt(e.target.value, 10))}
                style={{ marginLeft: '10px', width: '80px' }}
              />
            </label>
          </div>
          
          <div style={{ marginTop: '10px' }}>
            <label>
              Número total de días de simulación: {totalDays}
            </label>
          </div>

          <div style={{ marginTop: '10px' }}>
            <label>
              Número de Épocas:
              <input
                type="number"
                min="1"
                value={segments}
                onChange={handleSegmentsChange}
                style={{ marginLeft: '10px', width: '80px' }}
              />
            </label>
          </div>

          {segmentLengths.map((length, index) => (
            <div key={index} style={{ marginTop: '10px', display: 'flex', alignItems: 'center' }}>
              <label>Época {index + 1}:</label>
              <input
                type="number"
                min="1"
                value={length}
                onChange={(e) => handleSegmentLengthChange(index, e.target.value)}
                style={{ marginLeft: '10px', width: '80px'}}
              />
              <span style={{ margin: '0 10px' }}>días</span>
              <select
                value={dayTypes[index]}
                onChange={(e) => handleDayTypeChange(index, e.target.value)}
                style={{ marginLeft: '10px', width: '150px' }}
              >
                {Object.keys(weatherTypeValues).map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          ))}
          
          <div style={{ marginTop: '10px' }}>
            <label>
              Nivel de aleatoriedad:
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={randomnessLevel}
                onChange={(e) => setRandomnessLevel(parseFloat(e.target.value))}
                style={{ marginLeft: '10px', width: '200px' }}
              />
              {randomnessLevel}
            </label>
          </div>

          <div className="chart-container" style={{ height: '400px'}}>
                {weatherData.length > 0 ? (
            <Line
              data={data}
              options={{
                responsive: true,
                maintainAspectRatio: false, // Allows the chart to fill the set height
                ...options, // Include any additional options you have
              }}
            />
          ) : (
                <p>Seleccione un tipo de clima y genere datos climáticos para comenzar.</p>
              )}
          </div>
        </div>
      </section>


      <section style={{ width: '80%', margin: '0 auto' }}>
        <div className="App" style={{ backgroundColor: '#f0f0f0', color: '#000' }}>
          <h1>Módulo de Producción de Pasto</h1>
          <button onClick={sendWeatherData} style={{ marginLeft: '10px' }}>
            Calcular la Producción de Biomasa Verde y Muerta de Pasto (kg MS/ha)
          </button>
          <p>Modelo BASGRA.</p>
      
          {gvbData.length > 0 && dvbData.length > 0 && (
            <div className="chart-container" style={{ height: '400px' }}> {/* Set the height here */}
              <Line
                data={gvDvbDataChart}
                options={{
                  responsive: true,
                  maintainAspectRatio: false, // Allows the chart to fill the set height
                  plugins: {
                    legend: { position: 'top' },
                    title: { display: true, text: 'Biomasa (kg DM/ha)' },
                  },
                }}
              />
            </div>
          )}
        </div>
      </section>



      
      <section style={{ width: '80%', margin: '0 auto' }}>
        <div className="App" style={{ backgroundColor: '#f0f0f0', color: '#000' }}>
          <h1>Módulo de Alimentación y Nutrición Animal</h1>
          <p>Permite la formulación de dietas incluyendo el uso de alimento concentrado y forraje, evaluando su efecto en la salud y productividad del ganado.</p>
        </div>
      </section>
      
      <section style={{ width: '80%', margin: '0 auto' }}>
        <div className="App" style={{ backgroundColor: '#f0f0f0', color: '#000' }}>
          <h1>Módulo de Producción de Leche</h1>
          <p>Estima la producción de leche basada en factores genéticos, nutricionales y de manejo, proyectando rendimiento y calidad láctea.</p>
        </div>
      </section>
      
      <section style={{ width: '80%', margin: '0 auto' }}>
        <div className="App" style={{ backgroundColor: '#f0f0f0', color: '#000' }}>
          <h1>Módulo de Emisiones de Metano y Amoníaco</h1>
          <p>Calcula las emisiones de gases como metano y amoníaco derivadas de la fermentación entérica y manejo de estiércol, proponiendo estrategias de mitigación.</p>
        </div>
      </section>
      
      <section style={{ width: '80%', margin: '0 auto' }}>
        <div className="App" style={{ backgroundColor: '#f0f0f0', color: '#000' }}>
          <h1>Módulo de Uso de Energías Renovables</h1>
          <p>Simula la implementación y beneficios de tecnologías de energía solar y eólica en la finca, evaluando generación eléctrica y retorno de inversión.</p>
        </div>
      </section>



    </main>
  );
}

export default BASGRA;
