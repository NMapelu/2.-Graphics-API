const canvas = document.getElementById("trafficCanvas");
const ctx = canvas.getContext("2d");

// Simulation Engine State Variables
let isRunning = false;
let isStarted = false;
let frameId = null;

// Track mouse positioning for Graphical Button Hovers
let mouseX = 0;
let mouseY = 0;

/* =========================================================================
   1. APPLICATION STAGE (CPU: CPU Simulation Logic, System Data, & Objects)
   ========================================================================= */

// Traffic Light Core States
const trafficLight = {
    state: "green", // green, yellow, red
    timer: 0,
    x: 550,          // Positioned off-road at the intersection corner
    y: 70
};

// Two-way Multi-Lane Cars Data Structure
const cars = [
    // Top Lane: Moving East to West (Right to Left -> Speed is negative)
    { x: 950, y: 210, w: 55, h: 28, speed: -2.5, color: "#d63031", lane: "top" },
    { x: 1250, y: 210, w: 55, h: 28, speed: -3.2, color: "#0984e3", lane: "top" },

    // Bottom Lane: Moving West to East (Left to Right -> Speed is positive)
    { x: -100, y: 310, w: 55, h: 28, speed: 2.8, color: "#e17055", lane: "bottom" },
    { x: -400, y: 310, w: 55, h: 28, speed: 2.0, color: "#e84393", lane: "bottom" }
];

// Pedestrian State Data
const pedestrian = {
    x: 465,
    y: 420,
    radius: 10,
    speed: 1.5,
    isCrossing: false
};

// Graphical UI Button Specifications (Raster-interactive structures)
const startBtnGraphic = { x: 30, y: 30, w: 100, h: 40, label: "START" };
const pauseBtnGraphic = { x: 145, y: 30, w: 100, h: 40, label: "PAUSE" };

// Application Pipeline State Update Logic
function updateSimulation() {
    // A. Cycle Traffic Light Statuses
    trafficLight.timer++;
    if (trafficLight.timer > 200) {
        if (trafficLight.state === "green") {
            trafficLight.state = "yellow";
        } else if (trafficLight.state === "yellow") {
            trafficLight.state = "red";
        } else {
            trafficLight.state = "green";
        }
        trafficLight.timer = 0;
    }

    // B. Handle Car Movement Dynamics across opposite lanes
    updateCars();

    // C. Pedestrian Intelligence Route updates
    if (trafficLight.state === "red") {
        pedestrian.isCrossing = true;
        pedestrian.y -= pedestrian.speed; // Cross Northward safely
        if (pedestrian.y < 100) {
            pedestrian.y = 420; // Loop pedestrian back around
        }
    } else {
        pedestrian.isCrossing = false;
        // Walk smoothly to the sidewalk staging edge if caught midway
        if (pedestrian.y > 180 && pedestrian.y < 380) {
            pedestrian.y -= pedestrian.speed; 
        }
    }
}

// Sub-logic for Car Spacing and Movement (Rear-end pileup prevention)
function updateCars() {
    cars.forEach((car, index) => {
        // 1. Check for the traffic light intersection stop line
        if (car.lane === "top") {
            const nearIntersection = car.x > 530 && car.x < 570;
            if (trafficLight.state === "red" && nearIntersection) return; 
        } else {
            const nearIntersection = car.x < 350 && car.x > 310;
            if (trafficLight.state === "red" && nearIntersection) return;
        }

        // 2. Proximity Check: Look ahead to prevent rear-end collisions
        let carAheadDetected = false;
        const safetyDistance = 75; // Minimum pixel gap to keep between vehicles

        for (let i = 0; i < cars.length; i++) {
            if (i === index) continue; // Skip checking against yourself
            
            const otherCar = cars[i];

            // Only evaluate cars sharing the exact same lane
            if (car.lane === otherCar.lane) {
                if (car.lane === "top") {
                    // Top lane moves LEFT. Is otherCar to our left and too close?
                    if (otherCar.x < car.x && (car.x - otherCar.x) < safetyDistance) {
                        carAheadDetected = true;
                        break;
                    }
                } else {
                    // Bottom lane moves RIGHT. Is otherCar to our right and too close?
                    if (otherCar.x > car.x && (otherCar.x - car.x) < safetyDistance) {
                        carAheadDetected = true;
                        break;
                    }
                }
            }
        }

        // If there's a car stopped in front, hold position
        if (carAheadDetected) return;

        // 3. If the path is entirely clear, proceed forward
        car.x += car.speed;

        // Recycle off-screen objects back into the loop pool
        if (car.lane === "top") {
            if (car.x < -80) car.x = 950 + Math.random() * 150;
        } else {
            if (car.x > 980) car.x = -100 - Math.random() * 150;
        }
    });
}


/* =========================================================================
   2. GEOMETRY STAGE (Defining vertices, shapes, coordinates, and primitives)
   ========================================================================= */

// Define Road Geometric Layout Structures
function buildRoadGeometry() {
    // Main Horizontal asphalt body
    ctx.fillStyle = "#3d3d3d";
    ctx.fillRect(0, 180, 900, 190);

    // Cross-secting Vertical Intersection Road
    ctx.fillRect(390, 0, 160, 500);

    // Double Continuous Yellow center separation strip
    ctx.fillStyle = "#f1c40f";
    ctx.fillRect(0, 272, 900, 3);
    ctx.fillRect(0, 279, 900, 3);

    // White Zebra Walkway Lines geometry calculations
    ctx.fillStyle = "#ffffff";
    for (let yPos = 195; yPos < 360; yPos += 25) {
        ctx.fillRect(405, yPos, 130, 12);
    }
}

// Generate Vehicle Outlines and Wheel Placements
function buildCarGeometry(car) {
    // Chassis Frame Primitive
    ctx.fillStyle = car.color;
    ctx.fillRect(car.x, car.y, car.w, car.h);

    // Window shield configurations based on facing direction
    ctx.fillStyle = "#dfe6e9";
    if (car.lane === "top") {
        ctx.fillRect(car.x + 8, car.y + 4, 8, car.h - 8); // Facing Left
    } else {
        ctx.fillRect(car.x + car.w - 16, car.y + 4, 8, car.h - 8); // Facing Right
    }

    // Wheel Accents Primitives
    ctx.fillStyle = "#1e272e";
    ctx.beginPath();
    ctx.arc(car.x + 12, car.y + car.h, 5, 0, Math.PI * 2);
    ctx.arc(car.x + car.w - 12, car.y + car.h, 5, 0, Math.PI * 2);
    ctx.arc(car.x + 12, car.y, 5, 0, Math.PI * 2);
    ctx.arc(car.x + car.w - 12, car.y, 5, 0, Math.PI * 2);
    ctx.fill();
}

// Define UI Button Geometry & Canvas Interactions
function buildButtonGeometry(btn) {
    // Check if mouse vector coordinates lie within button polygon boundary
    const isHovered = mouseX >= btn.x && mouseX <= btn.x + btn.w &&
                      mouseY >= btn.y && mouseY <= btn.y + btn.h;

    // Change visual states via application input tracking
    if (btn.label === "START" && isStarted) {
        ctx.fillStyle = "#b2bec3"; // De-emphasize once started
    } else {
        ctx.fillStyle = isHovered ? "#00cec9" : "#0984e3";
    }

    // Render Container Geometry
    ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#ffffff";
    ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);

    // Setup Text Geometry Variables
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    let textOut = btn.label;
    if (btn.label === "PAUSE" && isStarted && !isRunning) {
        textOut = "RESUME";
    }
    ctx.fillText(textOut, btn.x + btn.w / 2, btn.y + btn.h / 2);
}


/* =========================================================================
   3. RASTERIZATION STAGE (GPU Conversion: Transforming Primitives into Screen Pixels)
   ========================================================================= */

function rasterizeFrame() {
    // Clear screen pixels across the canvas bounding box viewport frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Rasterize structural background layout
    buildRoadGeometry();

    // Rasterize Traffic Control Box Tower
    ctx.fillStyle = "#2d3436";
    ctx.fillRect(trafficLight.x, trafficLight.y, 34, 90);
    ctx.strokeRect(trafficLight.x, trafficLight.y, 34, 90);

    // Rasterize individual illumination light bulb elements
    // Red Bulb
    ctx.beginPath();
    ctx.fillStyle = trafficLight.state === "red" ? "#ff7675" : "#2d0000";
    ctx.arc(trafficLight.x + 17, trafficLight.y + 20, 10, 0, Math.PI * 2);
    ctx.fill();

    // Yellow Bulb
    ctx.beginPath();
    ctx.fillStyle = trafficLight.state === "yellow" ? "#ffeaa7" : "#332200";
    ctx.arc(trafficLight.x + 17, trafficLight.y + 45, 10, 0, Math.PI * 2);
    ctx.fill();

    // Green Bulb
    ctx.beginPath();
    ctx.fillStyle = trafficLight.state === "green" ? "#55efc4" : "#002d00";
    ctx.arc(trafficLight.x + 17, trafficLight.y + 70, 10, 0, Math.PI * 2);
    ctx.fill();

    // Iteratively loop through array values and rasterize cars
    cars.forEach(car => {
        buildCarGeometry(car);
    });

    // Rasterize Pedestrian Node
    ctx.fillStyle = pedestrian.isCrossing ? "#fdcb6e" : "#ffeaa7";
    ctx.beginPath();
    ctx.arc(pedestrian.x, pedestrian.y, pedestrian.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#000000";
    ctx.stroke();

    // Rasterize Interactive Panel Controller Buttons UI inside Canvas Viewport
    buildButtonGeometry(startBtnGraphic);
    buildButtonGeometry(pauseBtnGraphic);
}


/* =========================================================================
   4. ENGINE SIMULATION CORE CONTROLLER LOOP
   ========================================================================= */

function coreExecutionLoop() {
    if (isRunning) {
        updateSimulation(); // Application Data Processing Step
    }
    rasterizeFrame();      // Paint pipeline buffer onto HTML UI layer

    frameId = requestAnimationFrame(coreExecutionLoop);
}

// Mouse movement listeners to execute real-time geometry updates for button rendering
canvas.addEventListener("mousemove", (event) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = event.clientX - rect.left;
    mouseY = event.clientY - rect.top;
    
    // Force immediate re-render on hover event frames if simulation engine loop is paused
    if (!isRunning) {
        rasterizeFrame();
    }
});

// Click Interaction Handler Mapping Canvas Coordinates to Controls
canvas.addEventListener("click", () => {
    // 1. Did user click the START button?
    if (mouseX >= startBtnGraphic.x && mouseX <= startBtnGraphic.x + startBtnGraphic.w &&
        mouseY >= startBtnGraphic.y && mouseY <= startBtnGraphic.y + startBtnGraphic.h) {
        
        if (!isStarted) {
            isStarted = true;
            isRunning = true;
        }
    }

    // 2. Did user click the PAUSE / RESUME button?
    if (mouseX >= pauseBtnGraphic.x && mouseX <= pauseBtnGraphic.x + pauseBtnGraphic.w &&
        mouseY >= pauseBtnGraphic.y && mouseY <= pauseBtnGraphic.y + pauseBtnGraphic.h) {
        
        if (isStarted) {
            isRunning = !isRunning; // Toggle execution state flag
        }
    }
});

// Initial Render invocation setup phase
rasterizeFrame();
coreExecutionLoop();