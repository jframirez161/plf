import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './ImagesPage.css';

import imageOne from '../images/locomocion_01.jpg'; 
import videoFile_01 from '../videos/locomocion_01.webm'; 
import videoFile_02 from '../videos/locomocion_02.webm'; 

gsap.registerPlugin(ScrollTrigger);

const ImagesPage = () => {
  const sectionsRef = useRef([]);  
    
  // Scroll hacia el inicio al montar el componente
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  // GSAP animaciones
  useEffect(() => {
    sectionsRef.current.forEach((section) => {
      const media = section.querySelector('.media');
      const headline = section.querySelector('.headline');
      const description = section.querySelector('.description');
      
      // Animación para la imagen o el video
      gsap.fromTo(
        media,
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

      // Animación para el título y la descripción
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
  
  // Añadir referencias a cada sección
  const addToRefs = (el) => {
    if (el && !sectionsRef.current.includes(el)) {
      sectionsRef.current.push(el);
    }
  };

  return (
    <main className="images-page">
      {/* Sección con la imagen */}
      <section className="media-section" ref={addToRefs}>
        <div className="media-content">
          <img
            className="media"
            src={imageOne}
            alt="Innovative Vision Systems"
          />
          <h2 className="headline">Sistemas de Detección Temprana de Problemas de Locomoción</h2>
          <p className="description">
            Estos sistemas emplean inteligencia artificial y visión por computadora para monitorear el movimiento de los animales, detectando de manera temprana cualquier anomalía en su locomoción. Esto permite identificar problemas de salud y mejorar el bienestar animal de forma proactiva.
          </p>
        </div>
      </section>
      
      {/* Sección con el video */}
      <section className="media-section" ref={addToRefs}>
        <div className="media-content">
          <video className="media" src={videoFile_01} controls />  {/* Corrected: Using the imported video file */}
          <h2 className="headline">Detección de Puntos Clave</h2>
          <p className="description">            
            El sistema detectar puntos clave en el cuerpo del animal, generando un esqueleto simplificado que permite monitorear su movimiento. A través del análisis de la locomoción, puede detectar anomalías como cojeras o movimientos asimétricos, emitiendo alertas tempranas que ayudan a prevenir problemas de salud y mejorar el bienestar animal.
          </p>
        </div>
      </section>
      
      {/* Sección con el video */}
      <section className="media-section" ref={addToRefs}>
        <div className="media-content">
          <video className="media" src={videoFile_02} controls />  {/* Corrected: Using the imported video file */}
          <h2 className="headline">Identificación en Situaciones de Visibilidad Reducida</h2>
          <p className="description">
            La herramienta tiene capacidad para funcionar incluso en ambientes con oclusión parcial de los puntos clave. Esto es particularmente útil en entornos de granja donde los animales pueden estar obstruidos por objetos o barreras.
          </p>
        </div>
      </section>
      
    </main>
  );
};

export default ImagesPage;
