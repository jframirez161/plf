import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'; // For camera control
import PropTypes from 'prop-types';

// Define keypoint connections based on the given anatomy
const KEYPOINT_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4], [3, 5], [5, 6], [6, 7], 
  [3, 8], [8, 9], [9, 10], [4, 11], [11, 12], [12, 13], 
  [4, 14], [14, 15], [15, 16]
];

const LEFT_COLOR = new THREE.Color(1.0, 0.0, 0.0);    // Red
const RIGHT_COLOR = new THREE.Color(0.0, 0.0, 1.0);   // Blue
const CENTRAL_COLOR = new THREE.Color(0.0667, 0.4039, 0.4039);  // Central

const LEFT_KEYPOINTS = new Set([8, 9, 10, 14, 15, 16]);  // Left side
const RIGHT_KEYPOINTS = new Set([5, 6, 7, 11, 12, 13]); // Right side

const Z_VALUES = {
  0: 0.0, 1: 0.0, 2: 0.0, 3: 0.0, 4: 0.0, 5: 0.05, 6: 0.05, 7: 0.05, 
  8: -0.05, 9: -0.05, 10: -0.05, 11: 0.05, 12: 0.05, 13: 0.05, 
  14: -0.05, 15: -0.05, 16: -0.05
};

const ThreeDVisualization = ({ keypointsData }) => {
  const mountRef = useRef(null);
  const frameIndexRef = useRef(0);
  const animationIdRef = useRef(null);
  const speedFactorRef = useRef(1);
  const [speed, setSpeed] = useState(1); // Speed control state

  useEffect(() => {
    if (!keypointsData || Object.keys(keypointsData).length === 0) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8bc24);

    const camera = new THREE.PerspectiveCamera(
      60,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      100
    );
    const zoomFactor = 0.7;  // Adjust this for how far or close you want the camera
    camera.position.set(0, 0.5, zoomFactor);
    camera.lookAt(0, 0.5, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    mountRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 1, 1).normalize();
    scene.add(directionalLight);

    const keypointRadius = 0.01;
    const keypointGeometry = new THREE.SphereGeometry(keypointRadius, 16, 16);
    const keypointMaterials = [];
    for (let i = 0; i < 17; i++) {
      let color = CENTRAL_COLOR;
      if (LEFT_KEYPOINTS.has(i)) color = LEFT_COLOR;
      if (RIGHT_KEYPOINTS.has(i)) color = RIGHT_COLOR;
      keypointMaterials.push(new THREE.MeshBasicMaterial({ color }));
    }

    const keypoints = keypointsData[Object.keys(keypointsData)[0]].map((_, idx) => {
      const material = keypointMaterials[idx] || new THREE.MeshBasicMaterial({ color: CENTRAL_COLOR });
      const sphere = new THREE.Mesh(keypointGeometry, material);
      scene.add(sphere);
      return sphere;
    });

    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 10 });
    const lines = KEYPOINT_CONNECTIONS.map(([start, end]) => {
      const points = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0)];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, lineMaterial.clone());
      scene.add(line);
      return line;
    });

    KEYPOINT_CONNECTIONS.forEach(([start, end], idx) => {
      if (LEFT_KEYPOINTS.has(start) && LEFT_KEYPOINTS.has(end)) {
        lines[idx].material.color = LEFT_COLOR;
      } else if (RIGHT_KEYPOINTS.has(start) && RIGHT_KEYPOINTS.has(end)) {
        lines[idx].material.color = RIGHT_COLOR;
      } else {
        lines[idx].material.color = CENTRAL_COLOR;
      }
    });

    const frames = Object.keys(keypointsData).sort().map(frameKey => keypointsData[frameKey]);

    const calculateCenter = (frames) => {
      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;
      frames.forEach(framePoints => {
        framePoints.forEach(([x, y]) => {
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        });
      });
      return { centerX: (minX + maxX) / 2, centerY: (minY + maxY) / 2 };
    };

    const { centerX, centerY } = calculateCenter(frames);
    const allFrames3D = frames.map(framePoints =>
      framePoints.map((point, idx) =>
        new THREE.Vector3(
          point[0] - centerX,
          -point[1] + centerY,
          Z_VALUES[idx] !== undefined ? Z_VALUES[idx] : 0.0
        )
      )
    );

    const fps = 30;
    const frameDuration = 1000 / fps;
    let lastFrameTime = performance.now();

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      const currentTime = performance.now();
      const deltaTime = currentTime - lastFrameTime;

      if (deltaTime >= frameDuration / speedFactorRef.current) {
        frameIndexRef.current = (frameIndexRef.current + 1) % allFrames3D.length;
        const currentFrame = allFrames3D[frameIndexRef.current];

        currentFrame.forEach((vec, idx) => {
          keypoints[idx].position.copy(vec);
        });

        KEYPOINT_CONNECTIONS.forEach(([start, end], idx) => {
          const line = lines[idx];
          const startVec = currentFrame[start];
          const endVec = currentFrame[end];
          const positions = line.geometry.attributes.position.array;
          positions[0] = startVec.x;
          positions[1] = startVec.y;
          positions[2] = startVec.z;
          positions[3] = endVec.x;
          positions[4] = endVec.y;
          positions[5] = endVec.z;
          line.geometry.attributes.position.needsUpdate = true;
        });

        lastFrameTime = currentTime;
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationIdRef.current);
      window.removeEventListener('resize', handleResize);
      mountRef.current.removeChild(renderer.domElement);
      scene.dispose();
    };
  }, [keypointsData]);

  useEffect(() => {
    speedFactorRef.current = speed;
  }, [speed]);

  return (
    <div>
      <div ref={mountRef} style={{ width: '100%', height: '500px' }} />
      <input
        type="range"
        min="0.1"
        max="2"
        step="0.1"
        value={speed}
        onChange={(e) => setSpeed(parseFloat(e.target.value))}
        style={{ width: '100%' }}
      />
      <p style={{ color: '#000000' }}>Velocidad: {speed}x</p>
    </div>
  );
};

ThreeDVisualization.propTypes = {
  keypointsData: PropTypes.object.isRequired
};

export default ThreeDVisualization;
