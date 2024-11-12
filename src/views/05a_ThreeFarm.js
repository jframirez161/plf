import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { debounce } from 'lodash';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { Group, Color } from 'three';
import axios from 'axios';

const ThreeFarm = () => {
  const containerRef = useRef(null);

  // State variables for user inputs
  const [area, setArea] = useState(10); // in hectares
  const [divisions, setDivisions] = useState(4);
  const [treesPerFence, setTreesPerFence] = useState(10);
  const [cows, setCows] = useState(5);

  // State variables for processing
  const [processedImage, setProcessedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  // Additional state for handling ControlNet processing
  const [fetchUrl, setFetchUrl] = useState(null);
  const [eta, setEta] = useState(null);
  const [requestId, setRequestId] = useState(null);

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

  // Backend server URL
  //const BACKEND_URL = 'http://localhost:5000/'; // Replace with your Flask backend URL
  const BACKEND_URL = 'https://locomotion-back-d60dee4c012c.herokuapp.com' 

  // Function to capture the current scene as a Blob
  const captureSceneAsImage = useCallback(() => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;

    if (!renderer || !scene || !camera) {
      console.error('Renderer, Scene, or Camera not initialized.');
      return null;
    }

    // Render the current scene
    renderer.render(scene, camera);

    // Capture the rendered scene as a data URL
    const dataURL = renderer.domElement.toDataURL('image/png');
    return dataURL;
  }, []);

  // Function to upload image to Flask backend
  const uploadImageToBackend = async (base64Image) => {
    try {
      const response = await axios.post(`${BACKEND_URL}/upload-image`, {
        image: base64Image,
      });

      if (response.data) {
        const { fetch_result, eta: estimatedTime, id, processedImageUrl } = response.data;

        if (fetch_result && estimatedTime) {
          console.log('Fetch URL:', fetch_result);
          console.log('ETA:', estimatedTime);
          setFetchUrl(fetch_result);
          setEta(estimatedTime);
          setRequestId(id);
          setIsProcessing(true);
          return;
        } else if (processedImageUrl) {
          // Handle both array and string responses
          const imageUrl = Array.isArray(processedImageUrl)
            ? processedImageUrl[0] // Extract first URL if it's an array
            : processedImageUrl;

          setProcessedImage(imageUrl);
          setIsProcessing(false);
          return;
        } else {
          throw new Error('Unexpected response from backend.');
        }
      } else {
        throw new Error('No data received from backend.');
      }
    } catch (error) {
      console.error('Error uploading image to backend:', error.response ? error.response.data : error.message);
      setError(error.response ? error.response.data.error : error.message);
      setIsProcessing(false);
    }
  };

  // Function to dispose of Three.js objects
  const disposeObject = useCallback((object) => {
    object.traverse((child) => {
      if (child.isMesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((material) => material.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }, []);

  // Function to clear existing farm elements
  const clearScene = useCallback(() => {
    const scene = sceneRef.current;

    // Remove and dispose Trees
    treesRef.current.forEach((tree) => {
      disposeObject(tree);
      scene.remove(tree);
    });
    treesRef.current = [];

    // Remove and dispose Cows
    cowsRef.current.forEach((cow) => {
      disposeObject(cow);
      scene.remove(cow);
    });
    cowsRef.current = [];

    // Remove and dispose Paddock Grounds
    paddockGroundsRef.current.forEach((ground) => {
      disposeObject(ground);
      scene.remove(ground);
    });
    paddockGroundsRef.current = [];

    // Remove and dispose Fences
    fencesRef.current.forEach((fence) => {
      disposeObject(fence);
      scene.remove(fence);
    });
    fencesRef.current = [];
  }, [disposeObject]);

  // Function to create paddocks
  const createPaddocks = useCallback(
    (divisions, paddockSize) => {
      const scene = sceneRef.current;
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
    },
    [] // Dependencies are stable as functions are defined within useCallback
  );

  // Function to create trees between paddocks
  const createTreesBetweenPaddocks = useCallback(
    (borders) => {
      borders.forEach((border) => {
        createTree(new THREE.Vector3(border.x, 0, border.z));
      });
    },
    [] // Dependencies are stable as functions are defined within useCallback
  );

  // Function to create fences
  const createFences = useCallback(
    (divisions, paddockSize, treesPerFence) => {
      const scene = sceneRef.current;
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
    },
    [] // Dependencies are stable as functions are defined within useCallback
  );

  // Function to create a tree
  const createTree = useCallback(
    (position) => {
      const scene = sceneRef.current;
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
    },
    [] // Dependencies are stable as functions are defined within useCallback
  );

  // Function to create a fence section
  const createFenceSection = useCallback(
    (length, isVertical = false, treesPerFence) => {
      const scene = sceneRef.current;
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
    },
    [createTree] // Dependency on createTree
  );

  // Function to add cows
  const addCows = useCallback(
    (count, paddockSize) => {
      const scene = sceneRef.current;
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
        scene.add(cow);
        cowsRef.current.push(cow);
      }
    },
    [] // Dependencies are stable as functions are defined within useCallback
  );

  // Function to get gradient color
  const getGradientColor = useCallback((index, total) => {
    const startHue = 60;
    const endHue = 150;
    const hue = startHue + ((endHue - startHue) * index) / (total - 1);
    return new THREE.Color(`hsl(${hue}, 100%, 50%)`);
  }, []);

  // Function to load an OBJ file
  const loadOBJModel = useCallback(
    (scene, filePath, position, scale, count) => {
      const loader = new OBJLoader();

      loader.load(
        filePath,
        (object) => {
          if (!(object instanceof Group)) {
            console.error('Loaded object is not a Group.');
            return;
          }

          // Set colors for the two meshes inside the group
          object.children.forEach((mesh, index) => {
            if (mesh.isMesh) {
              mesh.material.color = new Color(index % 2 === 0 ? 0x808080 : 0x0000ff);
            }
          });

          object.scale.set(scale, scale, scale);

          // Create multiple instances and position them side by side
          for (let i = 0; i < count; i++) {
            // Clone the original object
            const instance = object.clone();

            // Position each instance side by side along the X-axis
            const spacing = 2.3; // Adjust this value to control spacing
            instance.position.set(position.x + i * spacing, position.y, position.z);

            // Add the instance to the scene
            scene.add(instance);
          }

          console.log(`Successfully created ${count} instances side by side.`);
        },
        (xhr) => {
          console.log(`Loading model: ${(xhr.loaded / xhr.total) * 100}% complete`);
        },
        (error) => {
          console.error('Error loading OBJ file:', error);
        }
      );
    },
    []
  );

  // Animation loop
  const animate = useCallback(() => {
    requestAnimationFrame(animate);
    if (controlsRef.current) controlsRef.current.update();
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  }, []);
    
    
    
const adjustCameraView = (totalSize) => {
  const aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
  const cameraSize = totalSize / 2; // Adjust this value based on your scene scale

  const camera = cameraRef.current;
  camera.left = -cameraSize * aspect;
  camera.right = cameraSize * aspect;
  camera.top = cameraSize;
  camera.bottom = -cameraSize;
  camera.updateProjectionMatrix();
};

    

// Define updateFarm function
const updateFarm = useCallback(
  (currentArea, currentDivisions, currentTreesPerFence, currentCows) => {
    clearScene();

    // Calculate size based on area (1 hectare = 10,000 m²)
    const size = Math.sqrt(currentArea * 10000); // in meters
    const paddockSize = size / currentDivisions;

    // Adjust the camera view based on the new size
    adjustCameraView(size);

    createPaddocks(currentDivisions, paddockSize);
    createFences(currentDivisions, paddockSize, currentTreesPerFence);
    addCows(currentCows, paddockSize);
  },
  [addCows, clearScene, createFences, createPaddocks]
);


  // Assign updateFarm to ref for access in other useEffects
  useEffect(() => {
    updateFarmRef.current = updateFarm;
  }, [updateFarm]);

  // Initialize Three.js scene
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
        -cameraSize * aspect,
        cameraSize * aspect,
        cameraSize,
        -cameraSize,
        0.1,
        1000
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

      // Initial farm setup
      if (updateFarmRef.current) {
        updateFarmRef.current(area, divisions, treesPerFence, cows);
      }

      // Load the OBJ model
      const objFilePath = `${process.env.PUBLIC_URL}/assets/panel.obj`; // Ensure the OBJ file is placed in the public/assets directory
      loadOBJModel(scene, objFilePath, new THREE.Vector3(5, 0, 0), 1, 50);

      // Start animation
      animate();
    }

    init();

    // Handle window resize
const handleResize = debounce(() => {
  if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
  const width = containerRef.current.clientWidth;
  const height = containerRef.current.clientHeight;
  rendererRef.current.setSize(width, height);

  const aspect = width / height;
  const camera = cameraRef.current;
  const totalSize = Math.sqrt(area * 10000);
  const cameraSize = totalSize / 2;

  camera.left = -cameraSize * aspect;
  camera.right = cameraSize * aspect;
  camera.top = cameraSize;
  camera.bottom = -cameraSize;
  camera.updateProjectionMatrix();
}, 200);


    window.addEventListener('resize', handleResize);

    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      handleResize.cancel();

      // Dispose renderer
      if (containerRef.current && rendererRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }

      // Dispose scene
      if (sceneRef.current) {
        disposeObject(sceneRef.current);
      }
    };
  }, [animate, disposeObject, loadOBJModel, area, divisions, treesPerFence, cows]);

  // Update farm when state changes
  useEffect(() => {
    if (updateFarmRef.current) {
      updateFarmRef.current(area, divisions, treesPerFence, cows);
    }
  }, [area, divisions, treesPerFence, cows]);
    
    useEffect(() => {
  if (processedImage) {
    console.log('Processed Image URL:', processedImage);
  }
}, [processedImage]);


  // **New useEffect for Polling Mechanism**
  useEffect(() => {
    let pollingInterval;

    const poll = async () => {
      if (!fetchUrl) return;

      try {
        const response = await axios.get(fetchUrl);
        const data = response.data;
        console.log('Polling Response:', data);

        if (data.status === 'completed') {
          // Adjust 'result_image_url' based on your backend response
          const processedImageUrl = data.result_image_url;
          const imageUrl = Array.isArray(processedImageUrl)
            ? processedImageUrl[0]
            : processedImageUrl;

          setProcessedImage(imageUrl);
          setIsProcessing(false);
          clearInterval(pollingInterval);
        } else if (data.status === 'failed') {
          setError(data.message || 'Image processing failed.');
          setIsProcessing(false);
          clearInterval(pollingInterval);
        } else {
          console.log('Image is still processing...');
          // Continue polling
        }
      } catch (err) {
        console.error('Error during polling:', err.response ? err.response.data : err.message);
        setError(err.response ? err.response.data.message : err.message);
        setIsProcessing(false);
        clearInterval(pollingInterval);
      }
    };

    if (fetchUrl && eta) {
      // Start polling every eta seconds
      pollingInterval = setInterval(poll, eta * 1000);
    }

    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [fetchUrl, eta]);

  // **Function to Handle Image Processing**
  const handleProcessImage = useCallback(async () => {
    setError(null);
    setProcessedImage(null);

    const capturedImage = captureSceneAsImage();
    if (!capturedImage) {
      setError('Failed to capture the scene.');
      return;
    }

    await uploadImageToBackend(capturedImage);
  }, [captureSceneAsImage, uploadImageToBackend]);

    
const openPopupWindow = (imageUrl) => {
  const popup = window.open(
    '',
    '_blank',
    'width=800,height=600,scrollbars=no,resizable=yes'
  );

  if (popup) {
    popup.document.write(`
      <html>
        <head>
          <title>Processed Image</title>
          <style>
            body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f0f0f0; }
            img { max-width: 100%; max-height: 100%; border: 2px solid #ddd; border-radius: 8px; }
          </style>
        </head>
        <body>
          <img src="${imageUrl}" alt="Processed Image" />
        </body>
      </html>
    `);
    popup.document.close();
  } else {
    alert('Popup blocker is preventing the window from opening.');
  }
};

  
const generatePrompt = () => {
  return `
    A hyper-realistic aerial view of a sprawling pastoral farm spanning ${area} hectares, meticulously divided into ${divisions} equal paddocks. 
    Each paddock is enclosed by sturdy wooden fences adorned with ${treesPerFence} lush green trees, providing shade and a natural barrier. 
    Between each paddock, there are additional clusters of trees creating a serene and vibrant landscape. 
    The verdant fields are dotted with ${cows} calm, grazing cows, peacefully roaming the grasslands. 
    The scene is bathed in the warm glow of late afternoon sunlight, casting soft shadows that enhance the depth and texture of the terrain. 
    In the background, a clear blue sky meets the horizon, while modern metal panels are strategically placed, blending seamlessly with the rural setting. 
    The overall atmosphere is tranquil and idyllic, showcasing the harmonious balance between agriculture and nature.
  `;
}; 
    
    
const handleImg2ImgProcessing = useCallback(async () => {
  setError(null);
  setProcessedImage(null);
  setIsProcessing(true);

  const capturedImage = captureSceneAsImage();
  if (!capturedImage) {
    setError('Failed to capture the scene.');
    setIsProcessing(false);
    return;
  }

  const prompt = generatePrompt();

  try {
    const response = await axios.post(`${BACKEND_URL}/upload-image`, {
      image: capturedImage,
      prompt: prompt,  // Include the prompt in the payload
    });

    if (response.data.processedImageUrl) {
      setProcessedImage(response.data.processedImageUrl);
      setIsProcessing(false);
    } else {
      throw new Error('No processed image URL returned.');
    }
  } catch (error) {
    console.error('Image-to-Image generation failed:', error.response ? error.response.data : error.message);
    setError(error.response ? error.response.data.error : error.message);
    setIsProcessing(false);
  }
}, [captureSceneAsImage, generatePrompt]);

    
    
    
    
  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* User Input Form */}
      <div
        id="controls"
        style={{
          width: '300px',
          padding: '20px',
          background: '#f0f0f0',
          boxSizing: 'border-box',
          overflowY: 'auto',
        }}
      >
        <h3>Configuracion</h3>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="area">Area Total (ha):</label>
          <input
            type="number"
            id="area"
            value={area}
            min="1"
            onChange={(e) => setArea(Number(e.target.value))}
            style={{ width: '100%', padding: '5px', marginTop: '5px' }}
            disabled={isProcessing}
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="divisions">Divisiones:</label>
          <input
            type="number"
            id="divisions"
            value={divisions}
            min="1"
            onChange={(e) => setDivisions(Number(e.target.value))}
            style={{ width: '100%', padding: '5px', marginTop: '5px' }}
            disabled={isProcessing}
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="treesPerFence">Arboles:</label>
          <input
            type="number"
            id="treesPerFence"
            value={treesPerFence}
            min="0"
            onChange={(e) => setTreesPerFence(Number(e.target.value))}
            style={{ width: '100%', padding: '5px', marginTop: '5px' }}
            disabled={isProcessing}
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="cows">Numero de Animales:</label>
          <input
            type="number"
            id="cows"
            value={cows}
            min="0"
            onChange={(e) => setCows(Number(e.target.value))}
            style={{ width: '100%', padding: '5px', marginTop: '5px' }}
            disabled={isProcessing}
          />
        </div>

        {/* Process Image Button */}
<button
  onClick={handleImg2ImgProcessing}
  disabled={isProcessing}
  style={{
    width: '100%',
    padding: '10px',
    backgroundColor: isProcessing ? '#ccc' : '#4CAF50',
    color: 'white',
    border: 'none',
    cursor: isProcessing ? 'not-allowed' : 'pointer',
    marginTop: '20px',
  }}
>
  {isProcessing ? 'Procesando...' : 'Tomar Foto'}
</button>


        {/* Display Errors */}
        {error && (
          <div style={{ marginTop: '20px', color: 'red' }}>
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>

      {/* Three.js Container */}
      <div
        ref={containerRef}
        style={{ flexGrow: 1, height: '100%', position: 'relative' }}
      >
        {/* Optionally, overlay the image on top of the Three.js scene */}
{processedImage && (
  <img
    src={processedImage}
    alt="Processed"
    onLoad={() => console.log('Image loaded successfully')}
    onError={(e) => {
      console.error('Failed to load image:', e);
      setError('Failed to load processed image.');
    }}
    style={{
      position: 'absolute',
      top: '10px',
      right: '10px',
      width: '200px',
      height: 'auto',
      border: '2px solid #fff',
      borderRadius: '8px',
      boxShadow: '0 0 10px rgba(0,0,0,0.5)',
      cursor: 'pointer',
      zIndex: 1,
    }}
    onClick={() => openPopupWindow(processedImage)}
  />
)}


      </div>

    </div>
  );
};

export default ThreeFarm;
