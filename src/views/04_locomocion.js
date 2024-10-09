import React, { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './ImagesPage.css';
import axios from 'axios';
import ClipLoader from 'react-spinners/ClipLoader'; // Importing a spinner for loading indicator
import JSZip from 'jszip';

import imageOne from '../images/locomocion_01.jpg';
import videoFile_01 from '../videos/locomocion_01.webm';
import videoFile_02 from '../videos/locomocion_02.webm';

gsap.registerPlugin(ScrollTrigger);

const ImagesPage = () => {
  const sectionsRef = useRef([]);
  const [uploadedVideo, setUploadedVideo] = useState(null);
  const [processedVideo, setProcessedVideo] = useState(null);
  const [processedImage, setProcessedImage] = useState(null); // Added state for processed image
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
    
  const [zipFileUrl, setZipFileUrl] = useState(null);

  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
    
    
  // GSAP animations
  useEffect(() => {
    sectionsRef.current.forEach((section) => {
      const media = section.querySelector('.media');
      const headline = section.querySelector('.headline');
      const description = section.querySelector('.description');

      // Animation for the image or video
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

      // Animation for the title and description
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

    return () => {
      sectionsRef.current = [];
    };
  }, []);

    
    useEffect(() => {
      return () => {
        if (zipFileUrl) {
          URL.revokeObjectURL(zipFileUrl);
        }
      };
    }, [zipFileUrl]);

    
  // Add references to each section
  const addToRefs = (el) => {
    if (el && !sectionsRef.current.includes(el)) {
      sectionsRef.current.push(el);
    }
  };

  const fileInputRef = useRef();

  // Handle video upload and send to backend
  const handleVideoUpload = async (event) => {
    if (event.target.files && event.target.files[0]) {
      setError(null);
      setZipFileUrl(null);
      const file = event.target.files[0];
      setUploadedVideo(URL.createObjectURL(file));
      setProcessedVideo(null);
      setProcessedImage(null); // Reset processed image

      const formData = new FormData();
      formData.append('video', file);

            
     setLoading(true);
      try {/* localhost:5000 locomotion-back-d60dee4c012c.herokuapp.com */
        const response = await axios.post('http://locomotion-back-d60dee4c012c.herokuapp.com/process-video', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          responseType: 'blob', // Important for handling binary data
        });
          
        // Create a Blob URL for the ZIP file
        const zipBlob = new Blob([response.data], { type: 'application/zip' });
        const zipUrl = URL.createObjectURL(zipBlob);
        setZipFileUrl(zipUrl);


        // Load the zip file using JSZip
        const zip = await JSZip.loadAsync(response.data);

        // Extract video
        const videoFile = zip.file("processed_video.webm"); 
        if (videoFile) {
          const videoData = await videoFile.async("blob");
          const videoBlob = new Blob([videoData], { type: 'video/webm' }); 
          const videoUrl = URL.createObjectURL(videoBlob);
          setProcessedVideo(videoUrl);
        } else {
          console.error("Processed video file not found in the ZIP archive.");
          setError('No se encontró el video procesado en el archivo recibido.');
        }
        // Extract image
        const imageFile = zip.file("image.jpg");
        if (imageFile) {
          const imageData = await imageFile.async("blob");
          const imageBlob = new Blob([imageData], { type: 'image/jpeg' });
          const imageUrl = URL.createObjectURL(imageBlob);
          setProcessedImage(imageUrl);
        }

        // Optionally handle keypoints.json
        const keypointsFile = zip.file("keypoints.json");
        if (keypointsFile) {
          const keypointsData = await keypointsFile.async("string");
          const keypoints = JSON.parse(keypointsData);
                        
        }


      } catch (err) {
        console.error('Error processing video:', err);
        setError('Ocurrió un error al procesar el video. Por favor, inténtalo de nuevo o cambia el video');
      } finally {
        setLoading(false);
      }
    }
  };
    
    
  const videoList = [
    {
      id: 'video1',
      videoUrl: 'video_test/camiando.mp4',
      thumbnailUrl: 'video_test/thumbnails/thumbnail1_regular.png',
      thumbnailHighResUrl: '/video_test/thumbnails/thumbnail1_regular@2x.jpg',
    },
    {
      id: 'video2',
      videoUrl: 'video_test/corriendo.mp4',
      thumbnailUrl: 'video_test/thumbnails/thumbnail2_regular.png',
      thumbnailHighResUrl: '/video_test/thumbnails/thumbnail2_regular@2x.jpg',
    },
    {
      id: 'video3',
      videoUrl: 'video_test/Score_3.mov',
      thumbnailUrl: 'video_test/thumbnails/thumbnail3_regular.png',
      thumbnailHighResUrl: '/video_test/thumbnails/thumbnail3_regular@2x.jpg',
    },
  ];
    
    /* {zipFileUrl && (
      <div>
        <a href={zipFileUrl} download="results.zip" className="download-link">
          Descargar Archivo ZIP
        </a>
      </div>
    )}*/
    
    
return (
  <main className="images-page">
    {/* Section with the image */}
    <section className="media-section" ref={addToRefs}>
      <div className="media-content">
        <img
          className="media"
          src={imageOne}
          alt="Innovative Vision Systems"
          loading="lazy"
        />
        <h2 className="headline">
          Sistemas de Detección Temprana de Problemas de Locomoción
        </h2>
        <p className="description">
          Estos sistemas emplean inteligencia artificial y visión por computadora para monitorear el movimiento de los animales, detectando de manera temprana cualquier anomalía en su locomoción. Esto permite identificar problemas de salud y mejorar el bienestar animal de forma proactiva.
        </p>
      </div>
    </section>

    {/* Section with the first video */}
    <section className="media-section" ref={addToRefs}>
      <div className="media-content">
        <video
          className="media"
          src={videoFile_01}
          controls
          aria-label="Video demonstrating key point detection in animal locomotion"
        />
        <h2 className="headline">Detección de Puntos Clave</h2>
        <p className="description">
          El sistema detectar puntos clave en el cuerpo del animal, generando un esqueleto simplificado que permite monitorear su movimiento. A través del análisis de la locomoción, puede detectar anomalías como cojeras o movimientos asimétricos, emitiendo alertas tempranas que ayudan a prevenir problemas de salud y mejorar el bienestar animal.
        </p>
      </div>
    </section>

    {/* Section with the second video */}
    <section className="media-section" ref={addToRefs}>
      <div className="media-content">
        <video
          className="media"
          src={videoFile_02}
          controls
          aria-label="Video showcasing identification in low visibility conditions"
        />
        <h2 className="headline">
          Identificación en Situaciones de Visibilidad Reducida
        </h2>
        <p className="description">
          La herramienta tiene capacidad para funcionar incluso en ambientes con oclusión parcial de los puntos clave. Esto es particularmente útil en entornos de granja donde los animales pueden estar obstruidos por objetos o barreras.
        </p>
      </div>
    </section>

    {/* Section for uploading and processing videos */}
    <section className="media-section" ref={addToRefs}>
      <div className="media-content">
        <h2 className="headline">Sube tu Propio Video</h2>
        <p className="description">
          Puedes subir un video (3-5 segundos) para analizar la locomoción de tus animales utilizando nuestras herramientas de detección y análisis.
        </p>

        <button onClick={() => fileInputRef.current.click()}>
          Sube tu Video
        </button>
        <input
          type="file"
          accept="video/*"
          onChange={handleVideoUpload}
          ref={fileInputRef}
          style={{ display: 'none' }} // Hide the default input
        />

        <p className="description">
          Puede descargar y utilizar nuestros vídeos de prueba.
        </p>

        {loading && (
          <div className="loading">
            <ClipLoader color="#123abc" loading={loading} size={50} />
            <p style={{ color: '#000000' }}>Procesando el video, por favor espere...</p>
          </div>
        )}

        {error && (
          <div style={{ color: 'red' }} className="error-message">
            <p>{error}</p>
          </div>
        )}

        {/* Video Gallery */}
        <div className="video-gallery">
          {videoList.map((video) => (
            <div key={video.id} className="video-item">
              <a href={video.videoUrl} download={`${video.id}.mp4`}>
                <img
                  src={video.thumbnailUrl}
                  alt={`Thumbnail of ${video.id}`}
                  className="video-thumbnail"
                />
              </a>
            </div>
          ))}
        </div>

    {processedVideo && (
      <div>
        <h3 style={{ color: '#000000' }}>Video Procesado:</h3>
        <video
          className="media"
          src={processedVideo}
          controls
          aria-label="Processed video with skeleton"
          type="video/webm"
        />
        <a
          href={processedVideo}
          download="processed_video.webm"
          className="download-link"
        >
          Descargar Video Procesado
        </a>
      </div>
    )}



        {processedImage && (
          <div>
            <h3 style={{ color: '#000000' }}>Resultados del Análisis:</h3>
            <p style={{ color: '#000000' }}>
              Comparación de características de locomoción (adimensionales) entre la vaca
              analizada (barra roja) y la distribución de la población con locomoción
              normal (curvas negras). Las líneas azules representan la media de la
              población, y las líneas verdes punteadas indican los límites del intervalo
              de confianza.
            </p>
            <p style={{ color: '#000000' }}>
              Una vaca sin problemas de locomoción muestra una barra roja cerca del
              promedio de la distribución de la población.
            </p>
            <img src={processedImage} alt="Processed frame" className="media" />
            <a href={processedImage} download="histograms.jpg" className="download-link">
              Descargar Imagen
            </a>
          </div>
        )}
      </div>
    </section>
  </main>
);
};

export default ImagesPage;
