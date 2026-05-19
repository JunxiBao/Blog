import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ---- SCENE SETUP ----
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff); // Clean white background

// Split Screen Setup
const aspect = (window.innerWidth / 2) / window.innerHeight;
const macroCamera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
macroCamera.position.set(0, 15, 20);

const microCamera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
microCamera.position.set(100, 0, 15);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setSize(window.innerWidth, window.innerHeight);
// Performance optimization: cap pixel ratio at 2x
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setScissorTest(true);
container.appendChild(renderer.domElement);

// Independent Controls
const leftControlsDiv = document.getElementById('left-controls');
const rightControlsDiv = document.getElementById('right-controls');

// SVG UI Link
const svgOverlay = document.getElementById('connection-svg');
const connLine = document.getElementById('connection-line');
const sensorDot = document.getElementById('sensor-dot');
const slabDot = document.getElementById('slab-dot');
const tempVec1 = new THREE.Vector3();
const tempVec2 = new THREE.Vector3();

const macroControls = new OrbitControls(macroCamera, leftControlsDiv);
macroControls.enableDamping = true; macroControls.dampingFactor = 0.05;
macroControls.target.set(0, 0, 0);

const microControls = new OrbitControls(microCamera, rightControlsDiv);
microControls.enableDamping = true; microControls.dampingFactor = 0.05;
microControls.target.set(100, 0, 0);

// ---- LIGHTING ----
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight.position.set(10, 20, 10);
dirLight.castShadow = true;
scene.add(dirLight);

const fillLight = new THREE.DirectionalLight(0xa78bfa, 0.6); 
fillLight.position.set(-10, 0, -10);
scene.add(fillLight);

// ---- MATERIALS (MACRO) ----
const chassisMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x86868b, roughness: 0.2, metalness: 0.9 
}); // Anodized aluminum
const screenAwakeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }); 
const screenSleepMaterial = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.05, metalness: 0.95 });
const bezelMaterial = new THREE.MeshStandardMaterial({ color: 0x1d1d1f, roughness: 0.3 });
const coverMaterial = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.8, metalness: 0.1 });
const magnetMaterial = new THREE.MeshStandardMaterial({ color: 0xff3b30, roughness: 0.2, emissive: 0xff3b30, emissiveIntensity: 0.3 });
const sensorMaterial = new THREE.MeshStandardMaterial({ color: 0x34c759, roughness: 0.2 });

// Screen Texture
const canvas = document.createElement('canvas');
canvas.width = 1024; canvas.height = 1433; // High res iPad ratio
const ctx = canvas.getContext('2d');
const screenTexture = new THREE.CanvasTexture(canvas);
screenTexture.colorSpace = THREE.SRGBColorSpace;
screenAwakeMaterial.map = screenTexture;

let lastMinute = -1;
function updateScreenTexture() {
    if (!isScreenOn) return;
    
    const now = new Date();
    const currentMinute = now.getMinutes();
    
    // Only redraw if the minute changed to save performance
    if (currentMinute === lastMinute) return;
    lastMinute = currentMinute;
    
    // Draw abstract wallpaper (gradient)
    const grd = ctx.createLinearGradient(0, 0, 1024, 1433);
    grd.addColorStop(0, "#4f46e5"); // Deep blue/indigo
    grd.addColorStop(0.5, "#db2777"); // Pink/Magenta
    grd.addColorStop(1, "#f97316"); // Orange
    ctx.fillStyle = grd;
    ctx.fillRect(0,0,1024,1433);
    
    // Draw waves
    ctx.beginPath();
    ctx.moveTo(0, 900);
    ctx.bezierCurveTo(300, 600, 700, 1100, 1024, 900);
    ctx.lineTo(1024, 1433);
    ctx.lineTo(0, 1433);
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(0, 1100);
    ctx.bezierCurveTo(400, 1300, 800, 800, 1024, 1100);
    ctx.lineTo(1024, 1433);
    ctx.lineTo(0, 1433);
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.fill();

    // Draw Time
    let hours = now.getHours();
    let minutes = now.getMinutes();
    hours = hours < 10 ? '0' + hours : hours;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    const timeString = hours + ':' + minutes;

    ctx.fillStyle = '#ffffff'; 
    ctx.font = 'bold 220px -apple-system, BlinkMacSystemFont, sans-serif'; 
    ctx.textAlign = 'center';
    ctx.fillText(timeString, 512, 400);
    
    // Draw Date
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    const dateString = now.toLocaleDateString('en-US', options);
    ctx.font = '500 50px -apple-system, BlinkMacSystemFont, sans-serif'; 
    ctx.fillText(dateString, 512, 500);
    
    // Draw "Swipe up to open"
    ctx.font = '400 35px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText('Swipe up to open', 512, 1350);
    ctx.fillRect(412, 1380, 200, 8); // Home indicator

    screenTexture.needsUpdate = true;
}

// ---- MACRO MODELS (Realistic iPad) ----
const macroGroup = new THREE.Group();
scene.add(macroGroup);

const ipadWidth = 10, ipadHeight = 14, ipadDepth = 0.3, cornerRadius = 0.8;

function createRoundedRectShape(w, h, r) {
    const s = new THREE.Shape();
    const x = -w/2, y = -h/2;
    s.moveTo(x, y + r); s.lineTo(x, y + h - r);
    s.quadraticCurveTo(x, y + h, x + r, y + h); s.lineTo(x + w - r, y + h);
    s.quadraticCurveTo(x + w, y + h, x + w, y + h - r); s.lineTo(x + w, y + r);
    s.quadraticCurveTo(x + w, y, x + w - r, y); s.lineTo(x + r, y);
    s.quadraticCurveTo(x, y, x, y + r);
    return s;
}

const extrudeSettings = { depth: ipadDepth, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.05, bevelThickness: 0.05 };
const shape = createRoundedRectShape(ipadWidth, ipadHeight, cornerRadius);
const chassisGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
const chassis = new THREE.Mesh(chassisGeo, chassisMaterial);
// Extrude goes along +Z, let's rotate it to lay flat like our previous box
chassis.rotation.x = Math.PI / 2;
chassis.position.y = ipadDepth / 2;
chassis.castShadow = true; chassis.receiveShadow = true;
macroGroup.add(chassis);

// Bezel & Screen (Simplified overlay for the extruded shape)
const bezelShape = createRoundedRectShape(ipadWidth - 0.2, ipadHeight - 0.2, cornerRadius - 0.1);
const bezelGeo = new THREE.ExtrudeGeometry(bezelShape, { depth: 0.02, bevelEnabled: false });
const bezel = new THREE.Mesh(bezelGeo, bezelMaterial);
bezel.position.z = -0.01; // Slightly above chassis surface (because rotated, -Z is up in local space)
chassis.add(bezel);

const screenShape = createRoundedRectShape(ipadWidth - 0.8, ipadHeight - 0.8, cornerRadius - 0.2);
const screenGeo = new THREE.ShapeGeometry(screenShape);
screenGeo.computeBoundingBox();
const bb = screenGeo.boundingBox;
const uvs = screenGeo.attributes.uv;
for (let i = 0; i < uvs.count; i++) {
    const u = (uvs.getX(i) - bb.min.x) / (bb.max.x - bb.min.x);
    const v = (uvs.getY(i) - bb.min.y) / (bb.max.y - bb.min.y);
    uvs.setXY(i, u, v);
}
uvs.needsUpdate = true;
const screenMesh = new THREE.Mesh(screenGeo, screenAwakeMaterial);
screenMesh.position.z = -0.1; // Slightly in front of the bezel
screenMesh.rotation.y = Math.PI;
screenMesh.rotation.z = Math.PI;
chassis.add(screenMesh);

// iPad Buttons (Power & Volume)
// Use a slightly darker material so they stand out from the chassis
const buttonMaterial = new THREE.MeshStandardMaterial({ color: 0x6e6e73, roughness: 0.3, metalness: 0.9 }); 

// Power Button (Top right edge, visually local -Y is the top because screen is flipped)
const powerButtonGeo = new THREE.BoxGeometry(1.0, 0.2, 0.15);
const powerButton = new THREE.Mesh(powerButtonGeo, buttonMaterial);
// Push it out to y = -ipadHeight/2 - 0.1 to clear the top bevel
powerButton.position.set(ipadWidth/2 - 1.5, -ipadHeight/2 - 0.1, ipadDepth/2);
chassis.add(powerButton);

// Volume Up Button (Right edge, near top)
const volButtonGeo = new THREE.BoxGeometry(0.2, 0.8, 0.15);
const volUpButton = new THREE.Mesh(volButtonGeo, buttonMaterial);
// Push it out to x = ipadWidth/2 + 0.1, and near the top (local -Y)
volUpButton.position.set(ipadWidth/2 + 0.1, -ipadHeight/2 + 1.5, ipadDepth/2);
chassis.add(volUpButton);

// Volume Down Button (Right edge, below Vol Up)
const volDownButton = new THREE.Mesh(volButtonGeo, buttonMaterial);
volDownButton.position.set(ipadWidth/2 + 0.1, -ipadHeight/2 + 2.5, ipadDepth/2);
chassis.add(volDownButton);

const sensor = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.02, 16), sensorMaterial);
sensor.rotation.x = Math.PI / 2;
sensor.position.set(ipadWidth/2 - 0.25, 0, -0.02); 
chassis.add(sensor);

const sensorRingMat = new THREE.MeshBasicMaterial({ color: 0x34c759, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
const sensorRing = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.25, 32), sensorRingMat);
sensorRing.position.copy(sensor.position); sensorRing.position.z -= 0.01;
chassis.add(sensorRing);

const coverGroup = new THREE.Group();
coverGroup.position.set(-ipadWidth/2, 0.36, 0); 
macroGroup.add(coverGroup);

const coverShape = createRoundedRectShape(ipadWidth, ipadHeight, cornerRadius);
const coverGeo = new THREE.ExtrudeGeometry(coverShape, { depth: 0.1, bevelEnabled: false });
const cover = new THREE.Mesh(coverGeo, coverMaterial);
cover.rotation.x = Math.PI / 2;
cover.position.set(ipadWidth/2, 0, 0); 
cover.castShadow = true;
coverGroup.add(cover);

// Cover Apple Logo
const coverLogoCanvas = document.createElement('canvas');
coverLogoCanvas.width = 256; coverLogoCanvas.height = 256;
const coverLogoCtx = coverLogoCanvas.getContext('2d');
coverLogoCtx.fillStyle = 'rgba(0,0,0,0.15)'; // Embossed dark look
coverLogoCtx.font = '160px -apple-system, BlinkMacSystemFont, sans-serif';
coverLogoCtx.textAlign = 'center';
coverLogoCtx.textBaseline = 'middle';
coverLogoCtx.fillText('', 128, 120); 

const coverLogoTex = new THREE.CanvasTexture(coverLogoCanvas);
coverLogoTex.colorSpace = THREE.SRGBColorSpace;
const coverLogoMat = new THREE.MeshBasicMaterial({ map: coverLogoTex, transparent: true, depthWrite: false });
const coverLogo = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 2.5), coverLogoMat);
coverLogo.rotation.x = Math.PI; // Face upwards (local -Z)
coverLogo.position.set(0, 0, -0.001);
cover.add(coverLogo);

const magnet = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.1, 16), magnetMaterial);
magnet.position.set(ipadWidth/2 - 0.25, -0.05, 0); 
cover.add(magnet);

const fieldLinesGroup = new THREE.Group();
const lineMaterial = new THREE.LineDashedMaterial({ color: 0xff3b30, transparent: true, opacity: 0.8, dashSize: 0.15, gapSize: 0.1 });

for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
    for (let radius = 0.2; radius <= 1.2; radius += 0.3) {
        // Dipole field shape
        const curve = new THREE.EllipseCurve(0, 0, radius, radius*1.5, -Math.PI/2, Math.PI/2, false, 0);
        const points = curve.getPoints(30);
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(points.length * 3);
        for (let i = 0; i < points.length; i++) {
            const x = points[i].x; const y = points[i].y;
            positions[i*3] = x * Math.cos(angle);
            positions[i*3+1] = y;
            positions[i*3+2] = x * Math.sin(angle);
        }
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const line = new THREE.Line(geometry, lineMaterial);
        line.computeLineDistances();
        fieldLinesGroup.add(line);
    }
}
magnet.add(fieldLinesGroup);

// Grid removed per user request

// ---- MICRO MODELS (Hall Effect Logic) ----
const microGroup = new THREE.Group();
microGroup.position.set(100, 0, 0); 
scene.add(microGroup);

const slabWidth = 8, slabHeight = 4, slabDepth = 0.5;
const slabGeo = new THREE.BoxGeometry(slabWidth, slabHeight, slabDepth);
const slabMat = new THREE.MeshBasicMaterial({ color: 0x0ea5e9, transparent: true, opacity: 0.15, side: THREE.DoubleSide });
const slab = new THREE.Mesh(slabGeo, slabMat);
microGroup.add(slab);
const slabEdges = new THREE.LineSegments(new THREE.EdgesGeometry(slabGeo), new THREE.LineBasicMaterial({ color: 0x0ea5e9, opacity: 0.5, transparent: true }));
microGroup.add(slabEdges);

const numElectrons = 150;
const electronGeo = new THREE.SphereGeometry(0.12, 8, 8);
const electronMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
const electrons = new THREE.InstancedMesh(electronGeo, electronMat, numElectrons);
const dummy = new THREE.Object3D();
const electronData = []; // Store velocity for each

for(let i=0; i<numElectrons; i++) {
    const x = (Math.random() - 0.5) * slabWidth;
    const y = (Math.random() - 0.5) * slabHeight;
    const z = (Math.random() - 0.5) * slabDepth * 0.8;
    
    dummy.position.set(x, y, z);
    dummy.updateMatrix();
    electrons.setMatrixAt(i, dummy.matrix);
    
    // Assign a constant baseline speed to each electron to prevent per-frame jitter
    const speedX = 3.5 + Math.random() * 2.0; 
    const restY = -slabHeight/2 + 0.1 + Math.random() * 0.2; // Unique resting height at bottom
    
    electronData.push({ x, y, z, speedX, restY });
}
microGroup.add(electrons);

const positiveGroup = new THREE.Group();
positiveGroup.position.y = slabHeight / 2 + 0.5;
for(let i=0; i<5; i++) {
    const pMat = new THREE.MeshBasicMaterial({ color: 0x34c759 });
    const pMesh1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.4, 0.1), pMat);
    const pMesh2 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 0.1), pMat);
    const pObj = new THREE.Group(); pObj.add(pMesh1); pObj.add(pMesh2);
    pObj.position.x = -slabWidth/3 + i*(slabWidth/6);
    positiveGroup.add(pObj);
}
positiveGroup.visible = false;
microGroup.add(positiveGroup);

const arrowGroup = new THREE.Group();
const crossMat = new THREE.MeshBasicMaterial({ color: 0xff3b30, transparent: false }); // Opaque to prevent depth sorting issues
const crossGeo1 = new THREE.BoxGeometry(0.8, 0.1, 0.1);
const crossGeo2 = new THREE.BoxGeometry(0.1, 0.8, 0.1);

for(let x=-slabWidth/2 + 1; x<=slabWidth/2; x+=2) {
    for(let y=-slabHeight/2 + 1; y<=slabHeight/2; y+=2) {
        const c1 = new THREE.Mesh(crossGeo1, crossMat);
        c1.rotation.z = Math.PI / 4;
        const c2 = new THREE.Mesh(crossGeo2, crossMat);
        c2.rotation.z = Math.PI / 4;
        const cross = new THREE.Group();
        cross.add(c1); cross.add(c2);
        // Place behind the slab so it's clearly visible and doesn't clip with internal electrons
        cross.position.set(x, y, -slabDepth/2 - 0.5); 
        arrowGroup.add(cross);
    }
}
arrowGroup.visible = false;
microGroup.add(arrowGroup);

// ---- STATE & LOGIC ----
let isScreenOn = true;
let lorentzForceStrength = 0; 
let targetVoltage = 3.3;
let lastVoltageUpdateTime = 0;

const coverSlider = document.getElementById('cover-slider');
const magStatusEl = document.getElementById('magnetic-field-status');
const voltageEl = document.getElementById('sensor-voltage');
const screenStateEl = document.getElementById('screen-state');
const explanationEl = document.getElementById('explanation-text');

function updateUI(angleDeg) {
    const angleRad = THREE.MathUtils.degToRad(angleDeg);
    coverGroup.rotation.z = angleRad;
    
    const closeness = 1 - (angleDeg / 180); 
    lorentzForceStrength = closeness;
    
    const scale = 0.5 + closeness * 1.5;
    fieldLinesGroup.scale.set(scale, scale, scale);
    lineMaterial.opacity = 0.1 + closeness * 0.9;
    
    arrowGroup.visible = closeness > 0.2;
    positiveGroup.visible = closeness > 0.5;
    
    const thresholdAngle = 10;
    
    // Simulate analog output voltage dropping as magnetic field gets stronger (closeness -> 1)
    targetVoltage = 3.3 * (1 - Math.pow(closeness, 2));
    if (targetVoltage < 0) targetVoltage = 0;
    
    if (angleDeg < thresholdAngle) {
        if (isScreenOn) { screenMesh.material = screenSleepMaterial; isScreenOn = false; }
        magStatusEl.textContent = 'Strong'; magStatusEl.className = 'data-value success';
        screenStateEl.textContent = 'Sleep'; screenStateEl.className = 'data-value warning';
        explanationEl.innerHTML = '<strong>Cover Closed:</strong> The magnet is adjacent to the sensor. The Lorentz force deflects electrons, separating charges to create a Hall Voltage. The processor detects near 0V and sleeps the screen.';
        sensorRingMat.color.setHex(0xff3b30); 
    } else {
        if (!isScreenOn) { screenMesh.material = screenAwakeMaterial; isScreenOn = true; }
        if (angleDeg < 45) { magStatusEl.textContent = 'Approaching'; magStatusEl.className = 'data-value warning'; } 
        else { magStatusEl.textContent = 'Weak'; magStatusEl.className = 'data-value warning'; }
        screenStateEl.textContent = 'Awake'; screenStateEl.className = 'data-value success';
        explanationEl.innerHTML = '<strong>Cover Open:</strong> The magnetic field is weak. Electrons flow straight through the sensor, maintaining a high voltage output (near 3.3V) that keeps the screen awake.';
        sensorRingMat.color.setHex(0x34c759); 
    }
}

updateUI(180);
coverSlider.addEventListener('input', (e) => updateUI(parseFloat(e.target.value)));

let isMobile = false;
let mobileView = 'macro'; // 'macro' or 'micro'
const toggleBtn = document.getElementById('mobile-view-toggle');
if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
        mobileView = mobileView === 'macro' ? 'micro' : 'macro';
        toggleBtn.textContent = mobileView === 'macro' ? 'Switch to Micro View' : 'Switch to Macro View';
        onWindowResize(); // force layout update
    });
}

function onWindowResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    isMobile = w <= 768; // Mobile threshold
    renderer.setSize(w, h);
    
    const labels = document.querySelector('.split-labels');
    
    if (isMobile) {
        if(labels) labels.style.display = 'none';
        if(toggleBtn) toggleBtn.style.display = 'block';
        
        const pipW = 120, pipH = 160;
        const pipX = w - pipW - 20, pipY = 20;
        
        const setPipStyle = (div) => {
            div.style.width = pipW + 'px'; div.style.height = pipH + 'px';
            div.style.left = pipX + 'px'; div.style.top = pipY + 'px';
            div.style.border = '2px solid rgba(0, 0, 0, 0.2)'; // Gray border
            div.style.borderRadius = '12px';
            div.style.zIndex = '10';
        };
        
        const setMainStyle = (div) => {
            div.style.width = '100%'; div.style.height = '100%';
            div.style.left = '0'; div.style.top = '0';
            div.style.border = 'none'; div.style.borderRadius = '0';
            div.style.zIndex = '1';
        };
        
        const mobileAspect = w / h;
        const zoomFactor = mobileAspect < 1 ? 1 / mobileAspect : 1;
        
        if (mobileView === 'macro') {
            setMainStyle(leftControlsDiv);
            setPipStyle(rightControlsDiv);
            
            macroCamera.aspect = mobileAspect;
            macroCamera.position.set(0, 15 * zoomFactor * 0.7, 20 * zoomFactor * 0.7);
            macroControls.target.set(0, -2 * zoomFactor, 0);
            
            microCamera.aspect = pipW / pipH;
            microCamera.position.set(100, 0, 15);
            microControls.target.set(100, 0, 0);
        } else {
            setPipStyle(leftControlsDiv);
            setMainStyle(rightControlsDiv);
            
            macroCamera.aspect = pipW / pipH;
            macroCamera.position.set(0, 15, 20);
            macroControls.target.set(0, 0, 0);
            
            microCamera.aspect = mobileAspect;
            microCamera.position.set(100, 0, 15 * zoomFactor * 0.85);
            microControls.target.set(100, -1.5 * zoomFactor, 0);
        }
    } else {
        macroCamera.aspect = (w/2) / h;
        microCamera.aspect = (w/2) / h;
        
        macroCamera.position.set(0, 15, 20);
        macroControls.target.set(0, 0, 0);
        microCamera.position.set(100, 0, 15);
        microControls.target.set(100, 0, 0);
        
        leftControlsDiv.style.width = '50%'; leftControlsDiv.style.height = '100%'; leftControlsDiv.style.left = '0'; leftControlsDiv.style.top = '0';
        leftControlsDiv.style.border = 'none'; leftControlsDiv.style.borderRadius = '0';
        
        rightControlsDiv.style.width = '50%'; rightControlsDiv.style.height = '100%'; rightControlsDiv.style.left = '50%'; rightControlsDiv.style.top = '0';
        rightControlsDiv.style.border = 'none'; rightControlsDiv.style.borderRadius = '0';
        
        if(labels) labels.style.display = 'flex';
        if(toggleBtn) toggleBtn.style.display = 'none';
    }
    
    macroControls.update();
    microControls.update();
    macroCamera.updateProjectionMatrix();
    microCamera.updateProjectionMatrix();
}

window.addEventListener('resize', onWindowResize);
onWindowResize(); // Initialize sizes

const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    const time = clock.getElapsedTime();
    
    // Macro animation: Flowing magnetic field lines
    fieldLinesGroup.children.forEach(line => {
        if(line.material.dashOffset !== undefined) {
            line.material.dashOffset -= delta * 1.5;
        }
    });

    // Real-time Voltage UI Update (flutter effect like a digital multimeter)
    if (time - lastVoltageUpdateTime > 0.15) {
        lastVoltageUpdateTime = time;
        let noise = targetVoltage > 0.1 ? (Math.random() * 0.04 - 0.02) : (Math.random() * 0.01);
        let displayVoltage = Math.max(0, targetVoltage + noise);
        voltageEl.textContent = displayVoltage.toFixed(2) + 'V';
    }

    // Micro animation
    for(let i=0; i<numElectrons; i++) {
        const data = electronData[i];
        
        // Smooth continuous velocity without per-frame randomization
        let vx = data.speedX; 
        let vy = -lorentzForceStrength * 6.0;
        
        data.x += vx * delta;
        data.y += vy * delta;

        if(data.x > slabWidth/2) {
            data.x = -slabWidth/2;
            data.y = (Math.random() - 0.5) * slabHeight;
        }
        
        // Smooth bottom collision using the pre-assigned rest height
        if(data.y < data.restY) {
            data.y = data.restY; 
        } else if(data.y > slabHeight/2) {
            data.y = slabHeight/2;
        }
        
        dummy.position.set(data.x, data.y, data.z);
        dummy.updateMatrix();
        electrons.setMatrixAt(i, dummy.matrix);
    }
    electrons.instanceMatrix.needsUpdate = true;

    macroControls.update();
    microControls.update();
    
    updateScreenTexture();
    
    const width = window.innerWidth;
    const height = window.innerHeight;

    if (isMobile) {
        const pipW = 120, pipH = 160;
        const pipX = width - pipW - 20;
        const pipY = 20;
        const pipViewportY = height - pipY - pipH; // WebGL uses bottom-up Y for viewports
        
        // Render Main Viewport
        renderer.setViewport(0, 0, width, height);
        renderer.setScissor(0, 0, width, height);
        if (mobileView === 'macro') {
            renderer.render(scene, macroCamera);
        } else {
            renderer.render(scene, microCamera);
        }
        
        // Clear depth so PiP renders completely on top
        renderer.clearDepth();
        
        // Render PiP Viewport
        renderer.setViewport(pipX, pipViewportY, pipW, pipH);
        renderer.setScissor(pipX, pipViewportY, pipW, pipH);
        if (mobileView === 'macro') {
            renderer.render(scene, microCamera);
        } else {
            renderer.render(scene, macroCamera);
        }
        
    } else {
        // Render Left (Macro)
        renderer.setViewport(0, 0, width/2, height);
        renderer.setScissor(0, 0, width/2, height);
        renderer.render(scene, macroCamera);

        // Render Right (Micro)
        renderer.setViewport(width/2, 0, width/2, height);
        renderer.setScissor(width/2, 0, width/2, height);
        renderer.render(scene, microCamera);
    }
    
    // Update SVG UI Link
    if (svgOverlay) {
        svgOverlay.style.display = 'block';
        let sensorX, sensorY, slabX, slabY;
        
        // Get World Positions
        sensor.getWorldPosition(tempVec1);
        tempVec2.set(-slabWidth/2, 0, 0);
        microGroup.localToWorld(tempVec2);
        
        if (isMobile) {
            const pipW = 120, pipH = 160;
            const pipX = width - pipW - 20;
            const pipY = 20; // SVG uses top-down Y
            
            if (mobileView === 'macro') {
                tempVec1.project(macroCamera);
                sensorX = (tempVec1.x * 0.5 + 0.5) * width;
                sensorY = -(tempVec1.y * 0.5 - 0.5) * height;
                
                tempVec2.project(microCamera);
                slabX = pipX + (tempVec2.x * 0.5 + 0.5) * pipW;
                slabY = pipY + -(tempVec2.y * 0.5 - 0.5) * pipH;
            } else {
                tempVec2.project(microCamera);
                slabX = (tempVec2.x * 0.5 + 0.5) * width;
                slabY = -(tempVec2.y * 0.5 - 0.5) * height;
                
                tempVec1.project(macroCamera);
                sensorX = pipX + (tempVec1.x * 0.5 + 0.5) * pipW;
                sensorY = pipY + -(tempVec1.y * 0.5 - 0.5) * pipH;
            }
        } else {
            // Desktop Split Screen logic
            tempVec1.project(macroCamera);
            sensorX = (tempVec1.x * 0.5 + 0.5) * (width / 2);
            sensorY = -(tempVec1.y * 0.5 - 0.5) * height;
            
            tempVec2.project(microCamera);
            slabX = (width / 2) + (tempVec2.x * 0.5 + 0.5) * (width / 2);
            slabY = -(tempVec2.y * 0.5 - 0.5) * height;
        }
        
        // Update SVG Attributes
        sensorDot.setAttribute('cx', sensorX);
        sensorDot.setAttribute('cy', sensorY);
        slabDot.setAttribute('cx', slabX);
        slabDot.setAttribute('cy', slabY);
        
        // Draw a smooth bezier curve between them
        const controlX1 = sensorX + (slabX - sensorX) * 0.5;
        const controlY1 = sensorY;
        const controlX2 = sensorX + (slabX - sensorX) * 0.5;
        const controlY2 = slabY;
        
        const d = `M ${sensorX},${sensorY} C ${controlX1},${controlY1} ${controlX2},${controlY2} ${slabX},${slabY}`;
        connLine.setAttribute('d', d);
        
        // Hide if behind camera
        if (tempVec1.z > 1 || tempVec2.z > 1 || tempVec1.z < -1 || tempVec2.z < -1) {
            svgOverlay.style.opacity = '0';
        } else {
            svgOverlay.style.opacity = '1';
        }
    }
}

animate();
