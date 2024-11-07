import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './TeamPage.css';

import memberOne from '../images/team_member_01.png'; 
import memberTwo from '../images/team_member_02.png'; 
import memberThree from '../images/team_member_04.jpg'; 

gsap.registerPlugin(ScrollTrigger);

const TeamPage = () => {
  const sectionsRef = useRef([]);  

  // Scroll to the top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  // GSAP animations
  useEffect(() => {
    sectionsRef.current.forEach((section) => {
      const photo = section.querySelector('.photo');
      const name = section.querySelector('.name');
      const bio = section.querySelector('.bio');
      
      // Animate photo
      gsap.fromTo(
        photo,
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

      // Animate text (name and bio)
      gsap.fromTo(
        [name, bio],
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
  
  // Add to refs
  const addToRefs = (el) => {
    if (el && !sectionsRef.current.includes(el)) {
      sectionsRef.current.push(el);
    }
  };

  return (
    <main className="team-page">
      <div className="team-row">
        {/* Team Member 1 */}
        <section className="team-section" ref={addToRefs}>
          <div className="team-content">
            <a href="https://www.linkedin.com/in/jose-fernando-guarin/?locale=es_ES" target="_blank" rel="noopener noreferrer">
              <img className="photo" src={memberOne} alt="Team Member One" />
            </a>
            <h2 className="name">Jose</h2>
            <p className="bio">
              Jose es Ph.D. en Ciencias Lecheras de la Universidad de Wisconsin-Madison, Maestría en Agronomía Universidade de São Paulo y Zootecnista de la Universidad de Antioquia. Profesor en el área de lechería especializada de la Universidad de Antioquia, Medellín, Colombia. Experiencia en Ciencias Animales con énfasis en la calidad de la leche, nutrición y reproducción animal. Las principales áreas de experticia son la epidemiología de la mastitis, la biotecnología de la reproducción, la nutrición animal y manejo de datos.
            </p>
          </div>
        </section>

        {/* Team Member 2 */}
        <section className="team-section" ref={addToRefs}>
          <div className="team-content">
            <a href="https://www.linkedin.com/in/sebastian-bedoya-mazo-b82a3974/" target="_blank" rel="noopener noreferrer">
              <img className="photo" src={memberTwo} alt="Team Member Two" />
            </a>
            <h2 className="name">Sebastian</h2>
            <p className="bio">
              Sebastian es Ph.D. en Ciencias Animales de la Universidad de Antioquia. Profesor en el área de Nutrición de la Universidad de Antioquia, Medellín, Colombia. Experiencia en Ciencias Animales con énfasis en el área de la nutrición animal, análisis de datos.
            </p>
          </div>
        </section>

        {/* Team Member 3 */}
        <section className="team-section" ref={addToRefs}>
          <div className="team-content">
            <a href="https:" target="_blank" rel="noopener noreferrer">
              <img className="photo" src={memberThree} alt="Team Member Three" />
            </a>
            <h2 className="name">John</h2>
            <p className="bio">
              John es Ph.D. en Ciencias Animales de la Universidad de Antioquia. Experiencia en Ciencias Animales con énfasis en la nutrición animal, manejo de datos y modelización matemática.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default TeamPage;
