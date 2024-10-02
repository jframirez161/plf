import React, { useContext, useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { Link } from 'react-router-dom';

import imageOne from '../images/metano_01.png'; 
import imageTwo from '../images/cowID_01.png';
import imageThree from '../images/conteo_01.png';
import imageFour from '../images/locomocion_01.jpg';
import imageFive from '../images/team.png';

import TransitionContext from '../context/TransitionContext';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

export default function Layers() {
  const main = useRef();
  const titleRef = useRef();
  const paragraphRef = useRef();
  const scrollDownRef = useRef();
  const imageRef = useRef();
  const scrollTween = useRef();
  const snapTriggers = useRef([]);
  const { completed } = useContext(TransitionContext);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Animación del título
      gsap.from(titleRef.current, {
        opacity: 0,
        y: -50,
        duration: 1,
      });

      // Animación del párrafo
      gsap.from(paragraphRef.current, {
        opacity: 0,
        y: 50,
        duration: 1,
        delay: 0.5,
      });

      // Animación del botón "Scroll down"
      gsap.from(scrollDownRef.current, {
        opacity: 0,
        y: 20,
        duration: 1,
        delay: 1,
      });

      // Animación de la imagen estilizada
      gsap.from(imageRef.current, {
        opacity: 0,
        scale: 0.8,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: imageRef.current,
          start: 'top 80%',
        },
      });

      // Configuración de ScrollTrigger para las secciones
      if (!completed) return;

      let panels = gsap.utils.toArray('.panel');
      let scrollStarts = [0];
      let snapScroll = value => value;

      panels.forEach((panel, i) => {
        snapTriggers.current[i] = ScrollTrigger.create({
          trigger: panel,
          start: 'top top',
        });
      });

      ScrollTrigger.addEventListener('refresh', () => {
        scrollStarts = snapTriggers.current.map(trigger => trigger.start);
        snapScroll = ScrollTrigger.snapDirectional(scrollStarts);
      });

      ScrollTrigger.observe({
        type: 'wheel,touch',
        onChangeY(self) {
          if (!scrollTween.current) {
            let scroll = snapScroll(self.scrollY + self.deltaY, self.deltaY > 0 ? 1 : -1);
            goToSection(scrollStarts.indexOf(scroll));
          }
        },
      });

      ScrollTrigger.refresh();
    }, main);

    return () => ctx.revert();
  }, [completed]);

  const goToSection = (i) => {
    console.log('scroll to', i);
    scrollTween.current = gsap.to(window, {
      scrollTo: { y: snapTriggers.current[i].start, autoKill: false },
      duration: 1,
      onComplete: () => (scrollTween.current = null),
      overwrite: true,
    });
  };

  return (
    <main ref={main}>
      <section className="description panel light">
        <div>
          <h1 ref={titleRef}>Ganadería Inteligente: Innovaciones en Inteligencia Artificial Aplicada</h1>
          <p ref={paragraphRef}>
            Bienvenido a nuestro sitio web, donde compartimos los proyectos y avances que hemos desarrollado en el ámbito de la inteligencia artificial aplicada a la producción ganadera. Nuestro equipo se enfoca en soluciones innovadoras como visión artificial, lecturas de emisiones de metano y desarrollo de software especializado. Acompáñanos en este recorrido por tecnologías de vanguardia que están transformando la ganadería, mejorando la eficiencia y promoviendo prácticas sostenibles en el sector.
          </p>
          <div className="scroll-down" ref={scrollDownRef}>
            Scroll down<div className="arrow"></div>
          </div>
        </div>
      
      </section>
      <section className="panel dark">
      <h1 ref={titleRef}>Monitoreo de las Emisiones de Metano Entérico</h1>
        <Link to="/dispositivo_metano">
          <img
            ref={imageRef}
            src={imageOne}
            className="stylized-image"
          />
        </Link>      
      </section>

      <section className="panel orange">   
      <h1 ref={titleRef}>Conteo Automático de Animales</h1>
        <Link to="/contador">
          <img
            ref={imageRef}
            src={imageThree}
            className="stylized-image"
          />
        </Link> 
      </section>
      
      <section className="panel dark">      
        <h1 ref={titleRef}>Identificación Automática de Animales</h1>
        <Link to="/cowID">
          <img
            ref={imageRef}
            src={imageTwo}
            className="stylized-image"
          />
        </Link> 
      </section>



      <section className="panel orange">        
      <h1 ref={titleRef}>Detección Temprana de Problemas de Locomoción</h1>
        <Link to="/locomocion">
          <img
            ref={imageRef}
            src={imageFour}
            className="stylized-image"
          />
        </Link> 
      </section>
      
    <section className="panel dark">        
      <h1 ref={titleRef}>Nuestro Equipo</h1>
        <Link to="/team">
          <img
            ref={imageRef}
            src={imageFive}
            className="stylized-image"
          />
        </Link> 
      </section>
      
    </main>
  );
}
