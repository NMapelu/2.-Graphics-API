const canvas = document.getElementById("trafficCanvas");
const ctx = canvas.getContext("2d");

const btn = document.getElementById("toggleBtn");

let running = false;
let frameId = null;

/*
    TRAFFIC LIGHT (controls both cars + pedestrians)
*/
const trafficLight = {
    state: "green",
    timer: 0
};

/*
    CARS: two lanes (top and bottom road)
*/
const cars = [
    { x: 900, y: 200, w: 60, h: 30, speed: 2, color: "red" },
    { x: 1100, y: 200, w: 60, h: 30, speed: 3, color: "blue" },

    { x: -100, y: 300, w: 60, h: 30, speed: 2.5, color: "green" },
    { x: -300, y: 300, w: 60, h: 30, speed: 2, color: "orange" }
];

/*
    PEDESTRIAN (simple crossing)
*/
const pedestrian = {
    x: 430,
    y: 120,
    size: 15,
    direction: 1,
    speed: 1
};

/* =========================
   START / PAUSE BUTTON
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

/* =========================
   APPLICATION STAGE
========================= */

function updateTrafficLight() {

    trafficLight.timer++;

    if (trafficLight.timer > 250) {

        trafficLight.state =
            trafficLight.state === "green" ? "red" : "green";

        trafficLight.timer = 0;
    }
}

/*
    Cars stop at intersection (more realistic logic)
*/
function updateCars() {

    cars.forEach(car => {

        const atIntersection = car.x < 500 && car.x > 350;

        if (trafficLight.state === "red" && atIntersection) {
            return; // stop car
        }

        car.x -= car.speed;

        if (car.x < -100) {
            car.x = 950 + Math.random() * 200;
        }
    });
}

/*
    Pedestrian only crosses when cars are stopped
*/
function updatePedestrian() {

    if (trafficLight.state === "red") {
        pedestrian.x += pedestrian.speed * pedestrian.direction;
    }

    // reset walk
    if (pedestrian.x > 900) {
        pedestrian.x = 0;
    }
}

/* =========================
   GEOMETRY STAGE
========================= */

function drawRoad() {

    // horizontal road
    ctx.fillStyle = "#555";
    ctx.fillRect(0, 180, 900, 200);

    // vertical road (intersection)
    ctx.fillRect(380, 0, 140, 500);

    // lane markings
    ctx.strokeStyle = "white";
    ctx.lineWidth = 3;

    for (let i = 0; i < 900; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 280);
        ctx.lineTo(i + 20, 280);
        ctx.stroke();
    }

    // pedestrian crossing
    ctx.fillStyle = "white";
    for (let i = 200; i < 350; i += 20) {
        ctx.fillRect(410, i, 20, 10);
    }
}

function drawTrafficLight() {

    ctx.fillStyle = "black";
    ctx.fillRect(820, 20, 30, 90);

    // red light
    ctx.beginPath();
    ctx.fillStyle = trafficLight.state === "red" ? "red" : "#550000";
    ctx.arc(835, 45, 10, 0, Math.PI * 2);
    ctx.fill();

    // green light
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

function drawPedestrian() {

    ctx.fillStyle = "yellow";
    ctx.fillRect(pedestrian.x, pedestrian.y, pedestrian.size, pedestrian.size);
}

/* =========================
   RASTERIZATION STAGE
========================= */

function render() {

    ctx.clearRect(0, 0, 900, 500);

    drawRoad();
    drawTrafficLight();
    drawCars();
    drawPedestrian();
}

/* =========================
   LOOP
========================= */

function loop() {

    updateTrafficLight();
    updateCars();
    updatePedestrian();

    render();

    frameId = requestAnimationFrame(loop);
}

// initial frame
render();