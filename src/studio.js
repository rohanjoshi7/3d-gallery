/**
 * STUDIO.JS - The 3D Background Logic
 * This script runs behind your HTML UI to provide depth and atmosphere.
 */

let studioScene, studioCamera, studioRenderer, starField, mouseX = 0, mouseY = 0;

function initStudioBackground() {
    // 1. Scene Setup
    studioScene = new THREE.Scene();
    studioCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
    studioCamera.position.z = 1; // Sit inside the field

    // 2. Renderer with Transparency
    studioRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    studioRenderer.setSize(window.innerWidth, window.innerHeight);
    studioRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Assign an ID for CSS targeting
    studioRenderer.domElement.id = 'studio-background-canvas';
    document.body.prepend(studioRenderer.domElement);

    // 3. Create 3D Atmosphere
    addAtmosphere();
    addGlowBlobs();

    // 4. Mouse Tracking for Parallax
    document.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX - window.innerWidth / 2) / 100;
        mouseY = (e.clientY - window.innerHeight / 2) / 100;
    });

    animateStudio();
}

function addAtmosphere() {
    const starCount = 1500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i++) {
        positions[i] = (Math.random() - 0.5) * 800;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.7,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending
    });

    starField = new THREE.Points(geometry, material);
    studioScene.add(starField);
}

function addGlowBlobs() {
    // Gold Blob (Right)
    const light1 = new THREE.PointLight(0xc5a059, 15, 300);
    light1.position.set(150, 50, -100);
    studioScene.add(light1);

    // Deep Teal Blob (Left)
    const light2 = new THREE.PointLight(0x4c6675, 20, 300);
    light2.position.set(-150, -50, -100);
    studioScene.add(light2);
}

function animateStudio() {
    requestAnimationFrame(animateStudio);

    // Subtle drifting movement
    starField.rotation.y += 0.0003;
    starField.rotation.x += 0.0001;

    // Smooth Parallax: The scene tilts slightly where the mouse goes
    studioCamera.position.x += (mouseX - studioCamera.position.x) * 0.05;
    studioCamera.position.y += (-mouseY - studioCamera.position.y) * 0.05;
    studioCamera.lookAt(studioScene.position);

    studioRenderer.render(studioScene, studioCamera);
}

// Handle Window Resize
window.addEventListener('resize', () => {
    studioCamera.aspect = window.innerWidth / window.innerHeight;
    studioCamera.updateProjectionMatrix();
    studioRenderer.setSize(window.innerWidth, window.innerHeight);
});

// Initialize
initStudioBackground();