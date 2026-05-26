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
   1. APPLICATION STAGE (CPU: Simulation Logic, System Data, & Objects)
   ========================================================================= */

// Traffic Light Core States
const trafficLight = {
    state: "green", // green, yellow, red
    timer: 0,
    x: 550,          // Positioned off-road at the intersection corner
    y: 70
};

// Two-way Multi-Lane Cars Data Structure with dynamic physics boundaries
const cars = [
    // Top Lane Base Y = 210 (Moving Right to Left -> Speed is negative)
    { id: 1, x: 950,  y: 210, targetY: 210, w: 55, h: 28, baseSpeed: -2.0, speed: -2.0, color: "#d63031", lane: "top", overtakeState: 0 },
    { id: 2, x: 1250, y: 210, targetY: 210, w: 55, h: 28, baseSpeed: -3.5, speed: -3.5, color: "#0984e3", lane: "top", overtakeState: 0 },

    // Bottom Lane Base Y = 310 (Moving Left to Right -> Speed is positive)
    { id: 3, x: -100, y: 310, targetY: 310, w: 55, h: 28, baseSpeed: 2.2,  speed: 2.2,  color: "#e17055", lane: "bottom", overtakeState: 0 },
    { id: 4, x: -400, y: 310, targetY: 310, w: 55, h: 28, baseSpeed: 3.8,  speed: 3.8,  color: "#e84393", lane: "bottom", overtakeState: 0 }
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

    // B. Handle Car Movement Dynamics, Separation, and Overtaking
    updateCars();

    // C. Pedestrian Route updates
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

// Sub-logic for Car Spacing, Movement, and Smooth Overtaking Manoeuvres
function updateCars() {
    cars.forEach((car) => {
        // Calculate exact bounding boxes for spatial accuracy regardless of direction
        const carLeft = car.x;
        const carRight = car.x + car.w;

        // --- 1. INTERSECTION LIGHT CHECK ---
        let atStopLine = false;
        if (trafficLight.state === "red" && car.overtakeState === 0) {
            if (car.lane === "top" && carRight > 540 && carLeft < 570) atStopLine = true;
            if (car.lane === "bottom" && carLeft < 360 && carRight > 330) atStopLine = true;
        }
        if (atStopLine) return; // Full stop at intersection

        // --- 2. CAR PROXIMITY DETECTION & OVERTAKING DECISION TREE ---
        let carAhead = null;
        let minGap = 85; // Safe buffer margin

        cars.forEach((other) => {
            if (car.id === other.id || car.lane !== other.lane) return;

            const otherLeft = other.x;
            const otherRight = other.x + other.w;

            if (car.lane === "top") {
                // Top lane moves LEFT: An 'other' car is ahead if its X coordinate value is lower
                if (otherLeft < carLeft && (carLeft - otherRight) < minGap && (carLeft - otherRight) > -20) {
                    carAhead = other;
                }
            } else {
                // Bottom lane moves RIGHT: An 'other' car is ahead if its X coordinate value is higher
                if (otherRight > carRight && (otherLeft - carRight) < minGap && (otherLeft - carRight) > -20) {
                    carAhead = other;
                }
            }
        });

        // --- 3. EXECUTE OVERTAKE STATE MACHINE ---
        const laneOffset = 42; // Width offset to move into the shoulder/passing lane space
        const baseLaneY = car.lane === "top" ? 210 : 310;

        if (carAhead && car.overtakeState === 0) {
            // Path blocked! If we are moving faster than the car ahead, initiate an overtake
            if (Math.abs(car.baseSpeed) > Math.abs(carAhead.speed)) {
                car.overtakeState = 1; // Veer out
                car.targetY = car.lane === "top" ? baseLaneY - laneOffset : baseLaneY + laneOffset;
                car.speed = car.baseSpeed * 1.3; // Boost speed temporarily to safely execute cross
            } else {
                // Otherwise, match speed cleanly to prevent a rear-end collision
                return;
            }
        }

        // State 1: Monitor Passing clearance
        if (car.overtakeState === 1) {
            // Check if we have completely cleared past the target front vehicle boundary
            let cleared = false;
            if (car.lane === "top" && (!carAhead || carRight < carAhead.x - 40)) cleared = true;
            if (car.lane === "bottom" && (!carAhead || carLeft > (carAhead.x + carAhead.w) + 40)) cleared = true;

            if (cleared) {
                car.overtakeState = 2; // Signal transition back to primary lane
                car.targetY = baseLaneY;
            }
        }

        // State 2: Check if vehicle has arrived back home safely
        if (car.overtakeState === 2 && Math.abs(car.y - baseLaneY) < 1) {
            car.overtakeState = 0; // Return to standard cruise monitoring
            car.speed = car.baseSpeed; // Reset back to standard pacing metrics
        }

        // --- 4. APPLY LERPed GEOMETRY POSITION MOVEMENTS ---
        // Smoothly interpolate current Y position to target lane Y position changes
        car.y += (car.targetY - car.y) * 0.1;
        car.x += car.speed;

        // --- 5. RECYCLE OFF-SCREEN ELEMENTS ---
        if (car.lane === "top" && car.x < -80) {
            car.x = 950 + Math.random() * 150;
            car.overtakeState = 0;
            car.targetY = baseLaneY;
            car.y = baseLaneY;
            car.speed = car.baseSpeed;
        } 
        if (car.lane === "bottom" && car.x > 980) {
            car.x = -100 - Math.random() * 150;
            car.overtakeState = 0;
            car.targetY = baseLaneY;
            car.y = baseLaneY;
            car.speed = car.baseSpeed;
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

// Generate Vehicle Outlines, Indicator Animations, and Wheel Placements
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

    // Overtake Blinker Animation Indicator (Flashes yellow while changing lanes)
    if (car.overtakeState > 0 && Math.floor(Date.now() / 150) % 2 === 0) {
        ctx.fillStyle = "#ffb142";
        if (car.lane === "top") {
            ctx.fillRect(car.x + 4, car.y - 2, 6, 4); // Left Indicator Corner
        } else {
            ctx.fillRect(car.x + car.w - 10, car.y + car.h - 2, 6, 4); // Right Indicator Corner
        }
    }

    // Wheel Accents Primitives
    ctx.fillStyle = "#1e272e";
    ctx.fillRect(car.x + 8, car.y - 4, 10, 4);
    ctx.fillRect(car.x + car.w - 18, car.y - 4, 10, 4);
    ctx.fillRect(car.x + 8, car.y + car.h, 10, 4);
    ctx.fillRect(car.x + car.w - 18, car.y + car.h, 10, 4);
}

// Define UI Button Geometry & Canvas Interactions
function buildButtonGeometry(btn) {
    const isHovered = mouseX >= btn.x && mouseX <= btn.x + btn.w &&
                      mouseY >= btn.y && mouseY <= btn.y + btn.h;

    if (btn.label === "START" && isStarted) {
        ctx.fillStyle = "#b2bec3"; // De-emphasize once running
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
   3. RASTERIZATION STAGE (GPU Pixel Output)
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

    // Rasterize UI Panel Controls inside Canvas Viewport
    buildButtonGeometry(startBtnGraphic);
    buildButtonGeometry(pauseBtnGraphic);
}


/* =========================================================================
   4. ENGINE SIMULATION CORE LOOP
   ========================================================================= */

function coreExecutionLoop() {
    if (isRunning) {
        updateSimulation(); // Application logic processing step
    }
    rasterizeFrame();      // Paint pipeline buffer onto HTML UI layer

    frameId = requestAnimationFrame(coreExecutionLoop);
}

// Mouse movement tracking for real-time hover calculations
canvas.addEventListener("mousemove", (event) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = event.clientX - rect.left;
    mouseY = event.clientY - rect.top;
    
    if (!isRunning) {
        rasterizeFrame();
    }
});

// Click Interaction Handler mapping canvas coordinates to controls
canvas.addEventListener("click", () => {
    // 1. Clicked START button
    if (mouseX >= startBtnGraphic.x && mouseX <= startBtnGraphic.x + startBtnGraphic.w &&
        mouseY >= startBtnGraphic.y && mouseY <= startBtnGraphic.y + startBtnGraphic.h) {
        
        if (!isStarted) {
            isStarted = true;
            isRunning = true;
        }
    }

    // 2. Clicked PAUSE / RESUME button
    if (mouseX >= pauseBtnGraphic.x && mouseX <= pauseBtnGraphic.x + pauseBtnGraphic.w &&
        mouseY >= pauseBtnGraphic.y && mouseY <= pauseBtnGraphic.y + pauseBtnGraphic.h) {
        
        if (isStarted) {
            isRunning = !isRunning; 
        }
    }
});

// Initial invocation setup phase
rasterizeFrame();
coreExecutionLoop();