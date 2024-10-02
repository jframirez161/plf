import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './ImagesPage.css';

import imageOne from '../images/cowID_01.png'; 
import videoFile_01 from '../videos/cowID_01.webm'; 
import videoFile_02 from '../videos/cowID_02.webm'; 

gsap.registerPlugin(ScrollTrigger);

const ImagesPage = () => {
  const sectionsRef = useRef([]);  // Mantén una sola referencia para todas las secciones
    
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
          <h2 className="headline">Sistemas de Identificación de Animales</h2>
          <p className="description">
            Estos sistemas utiliza visión por computadora para detectar, rastrear e indentificar animales.
          </p>
        </div>
      </section>
      
      {/* Sección con el video */}
      <section className="media-section" ref={addToRefs}>
        <div className="media-content">
          <video className="media" src={videoFile_02} controls />  {/* Corrected: Using the imported video file */}
          <h2 className="headline">Identificación de Animales en Ordeño</h2>
          <p className="description">            
            Esta tecnología realiza una doble identificación mediante el análisis de las características físicas del animal que ingresa al puesto de ordeño y, adicionalmente, mediante la detección de la chapeta con el número del animal.
          </p>
        </div>
      </section>
      
      {/* Sección con el video */}
      <section className="media-section" ref={addToRefs}>
        <div className="media-content">
          <video className="media" src={videoFile_01} controls />  {/* Corrected: Using the imported video file */}
          <h2 className="headline">Identificación de Animales en Pastoreo</h2>
          <p className="description">
            Esta tecnología permite identificar animales en pastoreo desde cualquier ángulo de la cámara.
          </p>
        </div>
      </section>
      
    </main>
  );
};

export default ImagesPage;
