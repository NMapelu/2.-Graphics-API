const canvas = document.getElementById("trafficCanvas");
const ctx = canvas.getContext("2d");

const btn = document.getElementById("toggleBtn");

let running = false;
let frameId = null;

/*
    Traffic light is clearly OUTSIDE the road area (top-right corner)
*/
const trafficLight = {
    x: 820,
    y: 20,
    state: "green",
    timer: 0
};

/*
    Cars now start from RIGHT side and move LEFT
*/
const cars = [
    { x: 900, y: 220, w: 60, h: 30, color: "red", speed: 2 },
    { x: 1100, y: 300, w: 60, h: 30, color: "blue", speed: 3 }
];

/* =========================
   APPLICATION STAGE
========================= */

btn.addEventListener("click", () => {

    running = !running;

    if (running) {
        btn.textContent = "Pause";
        loop();
    } else {
        btn.textContent = "Resume";
        cancelAnimationFrame(frameId);
    }
});

// traffic light switching
function updateLight() {
    trafficLight.timer++;

    if (trafficLight.timer > 300) {
        trafficLight.state =
            trafficLight.state === "green" ? "red" : "green";

        trafficLight.timer = 0;
    }
}

// car movement logic (RIGHT → LEFT)
function updateCars() {

    cars.forEach(car => {

        // stop zone near intersection
        const stopZone = car.x < 650 && car.x > 520;

        if (trafficLight.state === "red" && stopZone) {
            return; // car waits
        }

        car.x -= car.speed;

        // reset when off screen
        if (car.x < -100) {
            car.x = 950 + Math.random() * 200;
        }
    });
}

/* =========================
   GEOMETRY STAGE
========================= */

function drawRoad() {

    ctx.fillStyle = "#555";
    ctx.fillRect(0, 180, 900, 180);

    // lane markings
    ctx.strokeStyle = "white";
    ctx.lineWidth = 4;

    for (let i = 0; i < 900; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 270);
        ctx.lineTo(i + 20, 270);
        ctx.stroke();
    }
}

function drawTrafficLight() {

    ctx.fillStyle = "black";
    ctx.fillRect(trafficLight.x, trafficLight.y, 30, 90);

    // red
    ctx.beginPath();
    ctx.fillStyle = trafficLight.state === "red" ? "red" : "#550000";
    ctx.arc(835, 45, 10, 0, Math.PI * 2);
    ctx.fill();

    // green
    ctx.beginPath();
    ctx.fillStyle = trafficLight.state === "green" ? "lime" : "#003300";
    ctx.arc(835, 85, 10, 0, Math.PI * 2);
    ctx.fill();
}

function drawCars() {

    cars.forEach(car => {

        ctx.fillStyle = car.color;
        ctx.fillRect(car.x, car.y, car.w, car.h);

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

/* =========================
   RASTERIZATION STAGE
========================= */

function render() {
    ctx.clearRect(0, 0, 900, 500);

    drawRoad();
    drawTrafficLight();
    drawCars();
}

/* =========================
   LOOP CONTROL
========================= */

function loop() {

    updateLight();
    updateCars();
    render();

    frameId = requestAnimationFrame(loop);
}

// initial render
render();