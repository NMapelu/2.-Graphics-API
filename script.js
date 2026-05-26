const canvas = document.getElementById("trafficCanvas");
const ctx = canvas.getContext("2d");

const button = document.getElementById("controlBtn");

// Controls simulation state
let running = false;
let animationId = null;

/*
    Traffic light is now placed beside the road
*/
const trafficLight = {
    x: 780,
    y: 120,
    width: 30,
    height: 100,
    state: "green",
    timer: 0
};

/*
    Cars now move RIGHT → LEFT (like real roads depending on lane direction)
*/
const cars = [
    { x: 900, y: 220, width: 60, height: 30, color: "red", speed: 2 },
    { x: 1100, y: 300, width: 60, height: 30, color: "blue", speed: 3 }
];

/* ---------------------------
   APPLICATION STAGE
----------------------------*/

// Toggle start / pause / resume
button.addEventListener("click", () => {

    running = !running;

    if (running) {
        button.textContent = "Pause";
        animate();
    } else {
        button.textContent = "Resume";
        cancelAnimationFrame(animationId);
    }
});

// Traffic light switching logic
function updateTrafficLight() {

    trafficLight.timer++;

    if (trafficLight.timer > 300) {

        trafficLight.state =
            trafficLight.state === "green" ? "red" : "green";

        trafficLight.timer = 0;
    }
}

// Move cars (now right to left)
function updateCars() {

    cars.forEach(car => {

        // Stop at red light zone
        if (
            trafficLight.state === "red" &&
            car.x < 650 &&
            car.x > 520
        ) {
            return; // car waits
        }

        car.x -= car.speed;

        // reset position when it leaves screen
        if (car.x < -100) {
            car.x = canvas.width + Math.random() * 200;
        }
    });
}

/* ---------------------------
   GEOMETRY STAGE
----------------------------*/

// Road
function drawRoad() {

    ctx.fillStyle = "#555";
    ctx.fillRect(0, 180, canvas.width, 180);

    // lane markings
    ctx.strokeStyle = "white";
    ctx.lineWidth = 4;

    for (let i = 0; i < canvas.width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 270);
        ctx.lineTo(i + 20, 270);
        ctx.stroke();
    }
}

// Traffic light (now beside road)
function drawTrafficLight() {

    ctx.fillStyle = "black";
    ctx.fillRect(trafficLight.x, trafficLight.y, trafficLight.width, trafficLight.height);

    // red light
    ctx.beginPath();
    ctx.fillStyle = trafficLight.state === "red" ? "red" : "#550000";
    ctx.arc(795, 150, 10, 0, Math.PI * 2);
    ctx.fill();

    // green light
    ctx.beginPath();
    ctx.fillStyle = trafficLight.state === "green" ? "lime" : "#003300";
    ctx.arc(795, 200, 10, 0, Math.PI * 2);
    ctx.fill();
}

// Cars
function drawCars() {

    cars.forEach(car => {

        ctx.fillStyle = car.color;
        ctx.fillRect(car.x, car.y, car.width, car.height);

        // wheels
        ctx.fillStyle = "black";

        ctx.beginPath();
        ctx.arc(car.x + 15, car.y + 30, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(car.x + 45, car.y + 30, 6, 0, Math.PI * 2);
        ctx.fill();
    });
}

/* ---------------------------
   RASTERIZATION STAGE
----------------------------*/

// Draw everything on screen
function render() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawRoad();
    drawTrafficLight();
    drawCars();
}

// Main loop
function animate() {

    updateTrafficLight();
    updateCars();
    render();

    animationId = requestAnimationFrame(animate);
}

// initial frame
render();