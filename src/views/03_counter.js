import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './ImagesPage.css';

import videoFile_01 from '../videos/counter_01.webm'; 

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
      
      {/* Sección con el video */}
      <section className="media-section" ref={addToRefs}>
        <div className="media-content">
          <video className="media" src={videoFile_01} controls />  {/* Corrected: Using the imported video file */}
          <h2 className="headline">Conteo de Animales</h2>
          <p className="description">            
            Esta tecnología permite realizar conteos rápidos de animales en distintos ambientes, utilizando sistemas de visión por computadora. 
          </p>
        </div>
      </section>
      

      
    </main>
  );
};

export default ImagesPage;
