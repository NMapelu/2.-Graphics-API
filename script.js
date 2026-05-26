const canvas = document.getElementById("trafficCanvas");
const ctx = canvas.getContext("2d");

// Traffic light details
const trafficLight = {
    x: 420,
    y: 150,
    width: 40,
    height: 120,
    state: "green",
    counter: 0
};

// Cars used in the simulation
const cars = [
    {
        x: 0,
        y: 220,
        width: 60,
        height: 30,
        color: "red",
        speed: 2
    },
    {
        x: -180,
        y: 300,
        width: 60,
        height: 30,
        color: "blue",
        speed: 3
    }
];


/*
    APPLICATION STAGE

    This is where the logic happens.
    Things like movement, traffic light timing,
    and animation updates are controlled here.
*/

// Changes the traffic light after some time
function updateTrafficLight() {

    trafficLight.counter++;

    // Switch light every few seconds
    if (trafficLight.counter > 300) {

        if (trafficLight.state === "green") {
            trafficLight.state = "red";
        } else {
            trafficLight.state = "green";
        }

        trafficLight.counter = 0;
    }
}

// Controls car movement
function updateCars() {

    cars.forEach(car => {

        // Cars stop when the light is red
        if (
            trafficLight.state === "red" &&
            car.x + car.width > 350 &&
            car.x < 420
        ) {

            // Car waits here

        } else {
            car.x += car.speed;
        }

        // Bring the car back after leaving the screen
        if (car.x > canvas.width) {
            car.x = -100;
        }
    });
}


/*
    GEOMETRY STAGE

    In this section, the shapes and positions
    of objects are defined before drawing.
*/

// Draws the road and lane markings
function drawRoad() {

    // Main road
    ctx.fillStyle = "#555";
    ctx.fillRect(0, 180, canvas.width, 180);

    // White lane divider
    ctx.strokeStyle = "white";
    ctx.lineWidth = 4;

    for (let i = 0; i < canvas.width; i += 40) {

        ctx.beginPath();
        ctx.moveTo(i, 270);
        ctx.lineTo(i + 20, 270);
        ctx.stroke();
    }
}

// Draw the traffic light
function drawTrafficLight() {

    // Pole/body
    ctx.fillStyle = "black";
    ctx.fillRect(
        trafficLight.x,
        trafficLight.y,
        trafficLight.width,
        trafficLight.height
    );

    // Red light
    ctx.beginPath();

    if (trafficLight.state === "red") {
        ctx.fillStyle = "red";
    } else {
        ctx.fillStyle = "#550000";
    }

    ctx.arc(440, 180, 12, 0, Math.PI * 2);
    ctx.fill();

    // Green light
    ctx.beginPath();

    if (trafficLight.state === "green") {
        ctx.fillStyle = "lime";
    } else {
        ctx.fillStyle = "#003300";
    }

    ctx.arc(440, 240, 12, 0, Math.PI * 2);
    ctx.fill();
}

// Draw all cars
function drawCars() {

    cars.forEach(car => {

        // Car body
        ctx.fillStyle = car.color;
        ctx.fillRect(car.x, car.y, car.width, car.height);

        // Wheels
        ctx.fillStyle = "black";

        ctx.beginPath();
        ctx.arc(car.x + 15, car.y + 30, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(car.x + 45, car.y + 30, 6, 0, Math.PI * 2);
        ctx.fill();
    });
}


/*
    RASTERIZATION STAGE

    This is where everything is finally drawn
    onto the canvas pixel by pixel.
*/

function renderScene() {

    // Clears previous frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw everything again
    drawRoad();
    drawTrafficLight();
    drawCars();
}


// Animation loop
function animate() {

    updateTrafficLight();
    updateCars();

    renderScene();

    requestAnimationFrame(animate);
}

// Start the simulation
animate();