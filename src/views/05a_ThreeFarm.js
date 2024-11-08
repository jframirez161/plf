import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { debounce } from 'lodash';

const ThreeFarm = () => {
  const containerRef = useRef(null);

  // State variables for user inputs
  const [area, setArea] = useState(10); // in hectares
  const [divisions, setDivisions] = useState(4);
  const [treesPerFence, setTreesPerFence] = useState(10);
  const [cows, setCows] = useState(5);

  // Refs to store Three.js objects
  const sceneRef = useRef();
  const cameraRef = useRef();
  const rendererRef = useRef();
  const controlsRef = useRef();

  // Refs to store farm elements
  const treesRef = useRef([]);
  const cowsRef = useRef([]);
  const paddockGroundsRef = useRef([]);
  const fencesRef = useRef([]);

  // Ref for updateFarm function
  const updateFarmRef = useRef();

  useEffect(() => {
    let scene, camera, renderer, controls;

    // Initialize Three.js scene
    function init() {
      // Set up scene
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xa8e6cf);
      sceneRef.current = scene;

      // Set up camera
      const aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      const cameraSize = 100;
      camera = new THREE.OrthographicCamera(
        -cameraSize * aspect, cameraSize * aspect,
        cameraSize, -cameraSize,
        0.1, 1000
      );
      camera.position.set(100, 100, 100);
      camera.lookAt(0, 0, 0);
      cameraRef.current = camera;

      // Set up renderer
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      containerRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // Set up controls
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controlsRef.current = controls;

      // Add lighting
      const sunlight = new THREE.DirectionalLight(0xffffff, 0.8);
      sunlight.position.set(20, 50, 30);
      sunlight.castShadow = true;
      sunlight.shadow.mapSize.width = 2048;
      sunlight.shadow.mapSize.height = 2048;
      sunlight.shadow.camera.left = -200;
      sunlight.shadow.camera.right = 200;
      sunlight.shadow.camera.top = 200;
      sunlight.shadow.camera.bottom = -200;
      sunlight.shadow.camera.near = 0.5;
      sunlight.shadow.camera.far = 500;
      sunlight.shadow.bias = -0.0001;
      scene.add(sunlight);

      const ambientLight = new THREE.AmbientLight(0x606060);
      scene.add(ambientLight);

      // Define updateFarm function
      const updateFarm = (currentArea, currentDivisions, currentTreesPerFence, currentCows) => {
        clearScene();
        
        // Calculate size based on area (1 hectare = 10,000 m²)
        const size = Math.sqrt(currentArea * 10000); // in meters
        createPaddocks(currentDivisions, size / currentDivisions);
        createFences(currentDivisions, size / currentDivisions, currentTreesPerFence);
        addCows(currentCows, size / currentDivisions);
      };

      // Assign updateFarm to ref for access in other useEffects
      updateFarmRef.current = updateFarm;

      // Initial farm setup
      updateFarm(area, divisions, treesPerFence, cows);

      // Start animation
      animate();
    }

    // Clear existing farm elements
    function clearScene() {
      // Remove Trees
      treesRef.current.forEach(tree => sceneRef.current.remove(tree));
      treesRef.current = [];

      // Remove cows
      cowsRef.current.forEach(cow => sceneRef.current.remove(cow));
      cowsRef.current = [];

      // Remove paddock grounds
      paddockGroundsRef.current.forEach(ground => sceneRef.current.remove(ground));
      paddockGroundsRef.current = [];

      // Remove Fences
      fencesRef.current.forEach(fence => sceneRef.current.remove(fence));
      fencesRef.current = [];
    }


    // Function to create paddocks
    function createPaddocks(divisions, paddockSize) {
      const totalSize = divisions * paddockSize;
      const halfSize = totalSize / 2;

      let colorIndex = 0;
      const internalBorders = [];

      for (let i = 0; i < divisions; i++) {
        for (let j = 0; j < divisions; j++) {
          const xPos = -halfSize + paddockSize / 2 + i * paddockSize;
          const zPos = -halfSize + paddockSize / 2 + j * paddockSize;

          const paddockColor = getGradientColor(colorIndex, divisions * divisions);
          colorIndex++;

          const paddockGround = new THREE.Mesh(
            new THREE.PlaneGeometry(paddockSize, paddockSize),
            new THREE.MeshStandardMaterial({ color: paddockColor, roughness: 0.8, metalness: 0.2 })
          );
          paddockGround.rotation.x = -Math.PI / 2;
          paddockGround.position.set(xPos, 0, zPos);
          paddockGround.receiveShadow = true;
          scene.add(paddockGround);
          paddockGroundsRef.current.push(paddockGround);

          if (i < divisions - 1) internalBorders.push({ x: xPos + paddockSize / 2, z: zPos });
          if (j < divisions - 1) internalBorders.push({ x: xPos, z: zPos + paddockSize / 2 });
        }
      }

      createTreesBetweenPaddocks(internalBorders);
    }

    // Function to create trees between paddocks
    function createTreesBetweenPaddocks(borders) {
      borders.forEach(border => {
        createTree(new THREE.Vector3(border.x, 0, border.z));
      });
    }

    // Function to create fences
    function createFences(divisions, paddockSize, treesPerFence) {
      const totalSize = divisions * paddockSize;
      const halfSize = totalSize / 2;

      // Create horizontal fences (East-West)
      for (let i = 0; i <= divisions; i++) {
        const zPos = -halfSize + i * paddockSize;
        const fence = createFenceSection(totalSize, false, treesPerFence);
        fence.position.set(0, 0, zPos);
        scene.add(fence);
        fencesRef.current.push(fence);
      }

      // Create vertical fences (North-South)
      for (let j = 0; j <= divisions; j++) {
        const xPos = -halfSize + j * paddockSize;
        const fence = createFenceSection(totalSize, true, treesPerFence);
        fence.position.set(xPos, 0, 0);
        scene.add(fence);
        fencesRef.current.push(fence);
      }
    }

    // Function to create a tree
    function createTree(position) {
      const tree = new THREE.Group();

      // Create the Trunk
      const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.5, 5);
      const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8, metalness: 0.2 });
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.y = 2.5;
      tree.add(trunk);

      // Create the Foliage
      const foliageGeometry = new THREE.SphereGeometry(2.5, 16, 16);
      const foliageMaterial = new THREE.MeshStandardMaterial({ color: 0x2E8B57, roughness: 0.8, metalness: 0.2 });
      const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
      foliage.position.y = 5;
      tree.add(foliage);

      tree.position.copy(position);
      scene.add(tree);
      treesRef.current.push(tree);
    }

    // Function to create a fence section
    function createFenceSection(length, isVertical = false, treesPerFence) {
      const group = new THREE.Group();

      // Create fence posts
      const postGeometry = new THREE.CylinderGeometry(0.3, 0.3, 4);
      const postMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8, metalness: 0.2 });
      const railGeometry = new THREE.BoxGeometry(length, 0.2, 0.2);
      const railMaterial = new THREE.MeshStandardMaterial({ color: 0xA0522D, roughness: 0.8, metalness: 0.2 });

      const numPosts = treesPerFence + 1;
      const spacing = length / numPosts;

      for (let i = 0; i < numPosts; i++) {
        const post = new THREE.Mesh(postGeometry, postMaterial);
        post.castShadow = true;
        post.receiveShadow = true;

        if (isVertical) {
          post.position.set(0, 2, i * spacing - length / 2 + spacing / 2);
        } else {
          post.position.set(i * spacing - length / 2 + spacing / 2, 2, 0);
        }
        group.add(post);

        if (i < treesPerFence && treesPerFence > 0) {
          const treePosition = new THREE.Vector3();
          if (isVertical) {
            treePosition.set(0, 0, i * spacing - length / 2 + spacing / 2);
          } else {
            treePosition.set(i * spacing - length / 2 + spacing / 2, 0, 0);
          }
          const absolutePosition = treePosition.clone().add(group.position);
          createTree(absolutePosition);
        }
      }

      for (let i = 0; i < 3; i++) {
        const rail = new THREE.Mesh(railGeometry, railMaterial);
        rail.position.set(0, 1 + i, 0);
        rail.castShadow = true;
        rail.receiveShadow = true;
        if (isVertical) {
          rail.rotation.y = Math.PI / 2;
        }
        group.add(rail);
      }

      return group;
    }

    // Function to add cows
    function addCows(count, paddockSize) {
      const cowGeometry = new THREE.BoxGeometry(4, 2, 2);
      const cowMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, metalness: 0.2 });
      let initialXPos, initialZPos;
      const occupiedPositions = new Set();

      for (let i = 0; i < count; i++) {
        let xPos, zPos;
        let positionKey;

        if (i === 0) {
          initialXPos = Math.random() * paddockSize - paddockSize / 2;
          initialZPos = Math.random() * paddockSize - paddockSize / 2;
          xPos = initialXPos;
          zPos = initialZPos;
        } else {
          xPos = initialXPos + (Math.random() * 10 - 5);
          zPos = initialZPos + (Math.random() * 10 - 5);
        }

        positionKey = `${Math.round(xPos)}_${Math.round(zPos)}`;
        while (occupiedPositions.has(positionKey)) {
          xPos = initialXPos + (Math.random() * 10 - 5);
          zPos = initialZPos + (Math.random() * 10 - 5);
          positionKey = `${Math.round(xPos)}_${Math.round(zPos)}`;
        }

        occupiedPositions.add(positionKey);
        const cow = new THREE.Mesh(cowGeometry, cowMaterial);
        cow.position.set(xPos, 1, zPos);
        cow.castShadow = true;
        sceneRef.current.add(cow);
        cowsRef.current.push(cow);
      }
    }

    // Function to get gradient color
    function getGradientColor(index, total) {
      const startHue = 60;
      const endHue = 150;
      const hue = startHue + ((endHue - startHue) * (index / (total - 1)));
      return new THREE.Color(`hsl(${hue}, 100%, 50%)`);
    }

    // Animation loop
    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }

    init();

    // Handle window resize
    const handleResize = debounce(() => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      renderer.setSize(width, height);

      const aspect = width / height;
      camera.left = -100 * aspect;
      camera.right = 100 * aspect;
      camera.top = 100;
      camera.bottom = -100;
      camera.updateProjectionMatrix();
    }, 200);

    window.addEventListener('resize', handleResize);

    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current && rendererRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, []); // Run once on mount

  // Update farm when state changes
  useEffect(() => {
    if (updateFarmRef.current) {
      updateFarmRef.current(area, divisions, treesPerFence, cows);
    }
  }, [area, divisions, treesPerFence, cows]);

  return (
    <div style={{ display: 'flex' }}>
      {/* User Input Form */}
      <div id="controls" style={{ width: '300px', padding: '20px', background: '#f0f0f0' }}>
        <h3>Configuracion</h3>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="area">Total Area (ha):</label>
          <input
            type="number"
            id="area"
            value={area}
            min="1"
            onChange={(e) => setArea(Number(e.target.value))}
            style={{ width: '100%', padding: '5px', marginTop: '5px' }}
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="divisions">Number of Divisions:</label>
          <input
            type="number"
            id="divisions"
            value={divisions}
            min="1"
            onChange={(e) => setDivisions(Number(e.target.value))}
            style={{ width: '100%', padding: '5px', marginTop: '5px' }}
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="treesPerFence">Number of Trees per Fence:</label>
          <input
            type="number"
            id="treesPerFence"
            value={treesPerFence}
            min="0"
            onChange={(e) => setTreesPerFence(Number(e.target.value))}
            style={{ width: '100%', padding: '5px', marginTop: '5px' }}
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="cows">Number of Cows:</label>
          <input
            type="number"
            id="cows"
            value={cows}
            min="0"
            onChange={(e) => setCows(Number(e.target.value))}
            style={{ width: '100%', padding: '5px', marginTop: '5px' }}
          />
        </div>
      </div>

      {/* Three.js Container */}
      <div
        ref={containerRef}
        style={{ width: '100%', height: '600px' }}
      />
    </div>
  );
};

export default ThreeFarm;
