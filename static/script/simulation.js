import { createSimulation } from "./simulation_model.js";

const simulation = createSimulation("canvas", [
    [-1,-1,-1,-1,-1],
    [-1, 0, 0, 0,-1],
    [ 1, 0, 0, 0,-1],
    [ 1, 0, 0, 0, 1],
    [ 1, 1, 1, 1, 1],
])

simulation.start()