import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

const months = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
const photoRegistry = {}; // monthIndex -> array of objectURLs
let totalUploaded = 0;

// --- PROFESSIONAL WEBGL FLUID SIMULATION ---
const canvas = document.getElementById('fluid-canvas');
const starsContainer = document.getElementById('stars-container');
const cursorContainer = document.getElementById('cursor-container');

// The WebGL fluid simulation has been replaced with a perfectly smooth, 
// mathematically clean elegant Canvas 2D soft trail.

const trailCanvas = document.getElementById('trail-canvas');
const ctx = trailCanvas ? trailCanvas.getContext('2d') : null;
let cw = trailCanvas ? (trailCanvas.width = window.innerWidth) : 0;
let ch = trailCanvas ? (trailCanvas.height = window.innerHeight) : 0;
let trailPoints = [];

function drawTrail() {
    if (!ctx) return;
    ctx.clearRect(0, 0, cw, ch);

    for (let i = 0; i < trailPoints.length; i++) {
        let p = trailPoints[i];
        p.age += 0.25; // Increased fading speed to make the trail much shorter

        let alpha = Math.max(0, 1 - p.age);
        let radius = Math.max(0, 24 * (1 - p.age)); // Size of the soft glowing orb

        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(76, 102, 117, ${alpha * 0.25})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, radius * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(199, 208, 214, ${alpha * 0.5})`;
        ctx.fill();
    }

    trailPoints = trailPoints.filter(p => p.age < 1);
}

let lastMouseX = -1000, lastMouseY = -1000;

// --- CUSTOM DOT CURSOR ---
const cursorDot = document.createElement('div');
cursorDot.id = 'cursor-dot';
document.body.appendChild(cursorDot);

const cursorRing = document.createElement('div');
cursorRing.id = 'cursor-ring';
document.body.appendChild(cursorRing);

let ringX = -1000, ringY = -1000;
let cursorVisible = false;

function animateRing() {
    // 1. Calculate the gap between the ring and the actual mouse position
    const dx = lastMouseX - ringX;
    const dy = lastMouseY - ringY;
    const distance = Math.hypot(dx, dy);

    // 2. Set your limit (the "bubble" size). 
    // If the dot tries to go further than 15px, the ring snaps along with it.
    const maxDistance = 15;

    if (distance > maxDistance) {
        const angle = Math.atan2(dy, dx);
        ringX = lastMouseX - Math.cos(angle) * maxDistance;
        ringY = lastMouseY - Math.sin(angle) * maxDistance;
    }

    // 3. Smoothly slide the ring toward the dot when within the limit
    ringX += (lastMouseX - ringX) * 0.15;
    ringY += (lastMouseY - ringY) * 0.15;

    cursorRing.style.left = `${ringX}px`;
    cursorRing.style.top = `${ringY}px`;

    drawTrail();
    requestAnimationFrame(animateRing);
}
animateRing();

function toggleCursorBlur(isHover) {
    if (isHover) {
        cursorDot.classList.add('cursor-hover');
        cursorRing.classList.add('cursor-hover');
    } else {
        cursorDot.classList.remove('cursor-hover');
        cursorRing.classList.remove('cursor-hover');
    }
}

window.addEventListener('mousemove', e => {
    if (!cursorVisible) {
        cursorVisible = true;
        cursorDot.style.opacity = '1';
        cursorRing.style.opacity = '1';
        ringX = e.clientX;
        ringY = e.clientY;
    }

    // Smoothly interpolate points so the trail has no gaps when moving fast
    if (lastMouseX !== -1000) {
        const dist = Math.hypot(e.clientX - lastMouseX, e.clientY - lastMouseY);
        const steps = Math.max(1, Math.floor(dist / 3)); // one orb every 3 pixels
        for (let i = 1; i <= steps; i++) {
            trailPoints.push({
                x: lastMouseX + (e.clientX - lastMouseX) * (i / steps),
                y: lastMouseY + (e.clientY - lastMouseY) * (i / steps),
                age: 0
            });
        }
    } else {
        trailPoints.push({ x: e.clientX, y: e.clientY, age: 0 });
    }

    lastMouseX = e.clientX;
    lastMouseY = e.clientY;

    // Move the dot cursor instantly
    cursorDot.style.left = `${e.clientX}px`;
    cursorDot.style.top = `${e.clientY}px`;

    if (Math.random() > 0.1) spawnStar(e.clientX, e.clientY);
});

window.addEventListener('mousedown', () => {
    cursorDot.classList.add('cursor-click');
    cursorRing.classList.add('cursor-click');
});

window.addEventListener('mouseup', () => {
    cursorDot.classList.remove('cursor-click');
    cursorRing.classList.remove('cursor-click');
});

window.addEventListener('resize', () => {
    if (trailCanvas) {
        cw = trailCanvas.width = window.innerWidth;
        ch = trailCanvas.height = window.innerHeight;
    }
});

function spawnStar(x, y) {
    if (!starsContainer) return;
    const star = document.createElement('div');
    star.className = 'star-particle';
    star.style.left = `${x + (Math.random() - 0.5) * 80}px`;
    star.style.top = `${y + (Math.random() - 0.5) * 80}px`;
    starsContainer.appendChild(star);
    setTimeout(() => star.remove(), 800);
}

// --- STUDIO UI LOGIC ---
const monthGrid = document.getElementById('monthGrid');
const startBtn = document.getElementById('startButton');
const countLabel = document.getElementById('uploadCount');

months.forEach((month, index) => {
    const card = document.createElement('div');
    card.className = 'month-card';
    card.id = `month-${index}`;
    card.innerHTML = `<h3>${month}</h3><span id="label-${index}">Empty</span>`;

    // Hidden file input per month
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/jpeg, image/png, image/webp';
    input.style.display = 'none';

    card.appendChild(input);
    card.onclick = () => input.click();

    // Cursor hover effects
    card.onmouseenter = () => toggleCursorBlur(true);
    card.onmouseleave = () => toggleCursorBlur(false);

    input.onchange = (e) => {
        const files = Array.from(e.target.files).slice(0, 3);
        if (files.length > 0) {
            photoRegistry[index] = files.map(file => URL.createObjectURL(file));
            card.classList.add('ready');
            document.getElementById(`label-${index}`).innerText = `${files.length} Photo(s)`;
            updateTotal();
        }
    };

    monthGrid.appendChild(card);
});

function updateTotal() {
    totalUploaded = Object.values(photoRegistry).reduce((acc, curr) => acc + curr.length, 0);
    countLabel.innerText = `${totalUploaded} / 36 Images Ready`;
    startBtn.disabled = totalUploaded === 0;
}

startBtn.onclick = () => {
    document.getElementById('instructions').style.display = 'none';
    cursorContainer.style.display = 'none'; // Hide Liquid Fluid Canvas
    cursorDot.style.display = 'none';
    cursorRing.style.display = 'none';
    cursorVisible = false; // Reset visibility flag
    document.body.style.cursor = 'none';

    // Hide the custom 3D background space effect
    const studioBg = document.getElementById('studio-background-canvas');
    if (studioBg) studioBg.style.display = 'none';

    initGallery();
};

function initGallery() {
    // --- 1. UI & COMPONENT REFERENCES ---
    const studioContent = document.getElementById('studio-content');
    const resumeContent = document.getElementById('resume-content');
    const instructionDiv = document.getElementById('instructions');
    const controlsInfo = document.getElementById('controls-info');
    const menuBtn = document.getElementById('menu-btn');
    const masterMenu = document.getElementById('master-menu');
    const minimap = document.getElementById('minimap');
    const playerIndicator = document.getElementById('player-indicator');

    // Reset UI for Gallery Start
    studioContent.style.display = 'none';
    menuBtn.style.display = 'flex';
    minimap.style.display = 'block';

    // --- 2. CORE THREE.JS SETUP ---
    const scene = new THREE.Scene();
    const skyColor = 0x0f1a24;
    scene.background = new THREE.Color(skyColor);
    scene.fog = new THREE.Fog(skyColor, 50, 200);
    const tempDir = new THREE.Vector3();

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);

    const controls = new PointerLockControls(camera, document.body);
    controls.lock();

    // --- 3. MENU LOGIC & EVENT LISTENERS ---
    menuBtn.onclick = () => {
        controls.unlock();
        masterMenu.style.display = 'flex';
        resumeContent.style.display = 'none'; // Ensure resume screen is hidden when menu is open
    };

    document.getElementById('menu-resume').onclick = () => {
        masterMenu.style.display = 'none';
        controls.lock();
    };

    document.getElementById('menu-controls').onclick = () => {
        masterMenu.style.display = 'none';
        instructionDiv.style.display = 'none';
        resumeContent.style.display = 'none';
        controlsInfo.style.display = 'flex';
    };

    document.getElementById('closeControlsBtn').onclick = () => {
        controlsInfo.style.display = 'none';
        masterMenu.style.display = 'flex';
    };

    document.getElementById('menu-studio').onclick = () => {
        location.reload();
    };

    document.getElementById('menu-quit').onclick = () => {
        location.href = 'about:blank';
    };

    // Robust Resume/Lock Logic
    const toggleCustomCursor = (show) => {
        cursorDot.style.display = show ? 'block' : 'none';
        cursorRing.style.display = show ? 'block' : 'none';
        if (show) {
            cursorDot.style.opacity = '1';
            cursorRing.style.opacity = '1';
        }
    };

    instructionDiv.onclick = () => {
        controls.lock();
    };

    controls.addEventListener('lock', () => {
        instructionDiv.style.display = 'none';
        masterMenu.style.display = 'none';
        minimap.style.display = 'block';
        menuBtn.style.display = 'flex';
        toggleCustomCursor(false);
    });

    controls.addEventListener('unlock', () => {
        instructionDiv.style.display = 'none';
        masterMenu.style.display = 'flex'; // Auto-show Menu on ESC
        resumeContent.style.display = 'none'; // Hide the basic resume screen
        controlsInfo.style.display = 'none';
        minimap.style.display = 'none';
        menuBtn.style.display = 'none';
        toggleCustomCursor(true);
    });

    // Add Hover Listeners for Menu Items
    const menuItems = ['menu-resume', 'menu-controls', 'menu-studio', 'menu-quit', 'closeControlsBtn'];
    menuItems.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.onmouseenter = () => toggleCursorBlur(true);
            el.onmouseleave = () => toggleCursorBlur(false);
        }
    });

    // --- 4. GEOMETRY & MATERIALS ---
    function createCarpetTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512; canvas.height = 512;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#1f3a4a';
        ctx.fillRect(0, 0, 512, 512);
        for (let i = 0; i < 20000; i++) {
            ctx.fillStyle = Math.random() > 0.5 ? '#1f3a4a' : '#c7d0d6';
            ctx.globalAlpha = 0.05;
            ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
        }
        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(15, 15);
        return tex;
    }

    function createTextTexture(text) {
        const canvas = document.createElement('canvas');
        canvas.width = 512; canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.font = '600 85px Outfit, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#f2f4f5';
        ctx.fillText(text, 256, 64);
        return new THREE.CanvasTexture(canvas);
    }

    const wallMat = new THREE.MeshStandardMaterial({ color: 0x0f1a24, roughness: 0.9, side: THREE.BackSide });
    const floorMat = new THREE.MeshStandardMaterial({ map: createCarpetTexture(), roughness: 1.0 });
    const frameMat = new THREE.MeshStandardMaterial({ color: 0xf2f4f5, roughness: 0.2 });
    const targetMat = new THREE.MeshStandardMaterial({ color: 0xc7d0d6, roughness: 0.5 });

    const radius = 65;
    const floor = new THREE.Mesh(new THREE.CircleGeometry(radius, 64), floorMat);
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

    const ceiling = new THREE.Mesh(new THREE.CircleGeometry(radius, 64), wallMat);
    ceiling.position.y = 12; ceiling.rotation.x = Math.PI / 2; scene.add(ceiling);

    const innerWall = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 12, 12, 1, true), wallMat);
    innerWall.position.y = 6; scene.add(innerWall);

    for (let i = 0; i < 12; i++) {
        const dividerAngle = (i / 12) * Math.PI * 2 + (Math.PI / 12) - Math.PI / 2;
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(1, 12, 1), targetMat);
        pillar.position.set(Math.cos(dividerAngle) * (radius - 0.1), 6, Math.sin(dividerAngle) * (radius - 0.1));
        pillar.lookAt(0, 6, 0); scene.add(pillar);
    }

    const allLights = [];
    const texLoader = new THREE.TextureLoader();

    for (let m = 0; m < 12; m++) {
        const angle = (m / 12) * Math.PI * 2 - Math.PI / 2;
        const wallRadius = radius * Math.cos(Math.PI / 12);
        const x = Math.cos(angle) * wallRadius, z = Math.sin(angle) * wallRadius;

        const monthWing = new THREE.Group();
        monthWing.position.set(x, 0, z); monthWing.lookAt(0, 0, 0); scene.add(monthWing);

        const label = new THREE.Mesh(new THREE.PlaneGeometry(8, 2), new THREE.MeshBasicMaterial({ map: createTextTexture(months[m]), transparent: true }));
        label.position.set(0, 10, 0.5); monthWing.add(label);

        const spot = new THREE.SpotLight(0xf2f4f5, 800);
        spot.position.set(x * 0.85, 12, z * 0.85); spot.target.position.set(x, 4, z);
        spot.angle = Math.PI / 3.5; spot.penumbra = 0.8; spot.decay = 1.0;
        spot.distance = 60; spot.castShadow = true; spot.shadow.bias = -0.001;
        scene.add(spot); scene.add(spot.target);
        allLights.push({ light: spot, x, z });

        for (let i = 0; i < 3; i++) {
            const pieceGeo = new THREE.PlaneGeometry(4, 4);
            let pieceMat = (photoRegistry[m] && photoRegistry[m][i]) ?
                new THREE.MeshBasicMaterial({ map: texLoader.load(photoRegistry[m][i]) }) :
                new THREE.MeshStandardMaterial({ color: 0x4c6675, roughness: 0.8 });

            const piece = new THREE.Mesh(pieceGeo, pieceMat);
            const frame = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 4.2), frameMat);
            frame.position.z = -0.01; piece.add(frame);
            piece.position.set((i - 1) * 7.5, 4.5, 0.45); monthWing.add(piece);
        }
    }

    scene.add(new THREE.AmbientLight(0xffffff, 0.3));
    camera.position.set(0, 3, 0); camera.lookAt(0, 3, -65);

    // Movement Logic
    const keys = { w: false, a: false, s: false, d: false, shift: false };
    document.addEventListener('keydown', (e) => {
        const k = e.key.toLowerCase();
        if (keys.hasOwnProperty(k)) keys[k] = true;
    });
    document.addEventListener('keyup', (e) => {
        const k = e.key.toLowerCase();
        if (keys.hasOwnProperty(k)) keys[k] = false;
    });

    function animate() {
        requestAnimationFrame(animate);
        if (controls.isLocked) {
            const speed = keys.shift ? 0.8 : 0.45;
            if (keys.w) controls.moveForward(speed); if (keys.s) controls.moveForward(-speed);
            if (keys.a) controls.moveRight(-speed); if (keys.d) controls.moveRight(speed);

            const dist = Math.sqrt(camera.position.x ** 2 + camera.position.z ** 2);
            if (dist > radius - 5) {
                camera.position.x *= (radius - 5) / dist; camera.position.z *= (radius - 5) / dist;
            }

            allLights.forEach(({ light, x, z }) => {
                light.visible = Math.sqrt((camera.position.x - x) ** 2 + (camera.position.z - z) ** 2) < 55;
            });

            camera.position.y = 3.0 + Math.sin(Date.now() * 0.008) * 0.05;

            // Minimap & Pointer
            const mx = (camera.position.x / radius) * 40 + 50, mz = (camera.position.z / radius) * 40 + 50;
            playerIndicator.style.left = `${mx}%`; playerIndicator.style.top = `${mz}%`;
            camera.getWorldDirection(tempDir);
            playerIndicator.style.transform = `translate(-50%, -50%) rotate(${Math.atan2(tempDir.x, -tempDir.z)}rad)`;
        }
        renderer.render(scene, camera);
    }
    animate();

    window.onresize = () => {
        camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    };
}

window.addEventListener('load', () => {
    const loaderBar = document.getElementById('loader-bar');
    const loadingScreen = document.getElementById('loading-screen');

    // Simulate a smooth progress bar fill
    loaderBar.style.width = '100%';

    setTimeout(() => {
        loadingScreen.classList.add('loader-finished');

        // Optional: Trigger a slight entrance animation for your studio header
        document.getElementById('studio-content').style.animation = 'fadeIn 2s forwards';
    }, 1000); // Gives the user a second to see the "Hall of You" title
});