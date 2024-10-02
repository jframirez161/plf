import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './ImagesPage.css';

import imageZero from '../images/metano_01.png'; 
import imageOne from '../images/metano_02.png'; 
import imageTwo from '../images/metano_03.png'; 
import imageThree from '../images/metano_04.png'; 



gsap.registerPlugin(ScrollTrigger);

const ImagesPage = () => {
  const sectionsRef = useRef([]);
    
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  useEffect(() => {
    sectionsRef.current.forEach((section) => {
      const image = section.querySelector('.media');
      const headline = section.querySelector('.headline');
      const description = section.querySelector('.description');
      
      gsap.fromTo(
        image,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            end: 'bottom 60%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      gsap.fromTo(
        [headline, description],
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            end: 'bottom 60%',
            toggleActions: 'play none none reverse',
          },
          stagger: 0.2,
        }
      );
    });
  }, []);
  
  const addToRefs = (el) => {
    if (el && !sectionsRef.current.includes(el)) {
      sectionsRef.current.push(el);
    }
  };
  
  return (
    <main className="images-page">
      
      <section className="media-section" ref={addToRefs}>
        <div className="media-content">
          <img
            className="media"
            src={imageZero}
            alt="Innovative Vision Systems"
          />
          <h2 className="headline">Dispositivo de Registro de Emisiones de Metano</h2>
          <p className="description">
            El dispositivo es una herramienta de bajo costo para registrar los cambios en la concentraciones de metano en el aire exhalado por animales.
          </p>
        </div>
      </section>
      
      <section className="media-section" ref={addToRefs}>
        <div className="media-content">
          <img
            className="media"
            src={imageOne}
            alt="Innovative Vision Systems"
          />
          <h2 className="headline">Componentes del Dispositivo</h2>
          <p className="description">
            Módulo ESP8266 (A), sensor de gas MQ-4 (B), bomba de aire (C), y caja de plástico que contiene los componentes electrónicos y mecánicos (D). Las flechas indican la dirección del flujo de la muestra de aire.
          </p>
        </div>
      </section>
      
      <section className="media-section" ref={addToRefs}>
        <div className="media-content">
          <video className="media" src="https://example.com/video1.mp4" controls />
          <h2 className="headline">Paso a Paso del Desarrollo del Dispositivo</h2>
          <p className="description">
            Conozca nuestras tecnologías para medir las emisiones de metano
          </p>
        </div>
      </section>
    
     <section className="media-section" ref={addToRefs}>
        <div className="media-content">
          <h2 className="headline">Código de Arduino para Transmisión de Datos en Tiempo Real usando ESP8266</h2>
          <img
            className="media"
            src={imageTwo}
            alt="Innovative Vision Systems"
          />          
          <p className="description">
            Código de Arduino utilizado para transmitir datos desde el módulo ESP8266 a un servidor web. El código inicializa el ESP8266 en modo estación para conectarse a una red WiFi especificada, lee los datos del sensor desde un pin analógico y envía estos datos a un servidor mediante una solicitud HTTP POST. La respuesta del servidor se muestra en el monitor serial, lo que permite el monitoreo en tiempo real de la transmisión de datos del sensor.
          </p>
        </div>
      </section>
    
      <section className="media-section" ref={addToRefs}>
        <div className="media-content">
          <h2 className="headline">Código Python para Recepción y Almacenamiento de Datos en Tiempo Real usando Flask</h2>
          <img
            className="media"
            src={imageThree}
            alt="Innovative Vision Systems"
          />          
          <p className="description">
            Código Python utilizado para recibir y almacenar datos enviados por el módulo ESP8266 mediante solicitudes HTTP POST. El código inicializa una aplicación Flask que escucha datos entrantes en una ruta especificada '(/data)'. Al recibir los datos, el servidor registra las lecturas de metano junto con una marca de tiempo en un archivo de texto.
          </p>
        </div>
      </section>
      
      
   
    </main>
  );
};

export default ImagesPage;
