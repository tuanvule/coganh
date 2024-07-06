import { createBoardSimulation } from "./board_simulation_model.js";
import { createTreeSimulation } from "./tree_simulation_model.js";

const $ = document.querySelector.bind(document)
const $$ = document.querySelectorAll.bind(document)

const run_btn = $(".run_btn")
let action = $(".action").innerHTML
const simulation_type = $(".simulation_type").innerHTML

const O_C_btn = $(".O_C_btn i")
const open_code_btn = $(".open_code_btn i")

const setting_bar = $(".setting_bar")
const action_block = $(".action_block")
const play_animation_controller = $(".play_animation_controller")
const duration_bar = $(".duration_bar")
duration_bar.value = 0
const visualize_speed = $(".visualize_speed")
const pre_action = $(".pre_action")
const play_btn = $(".play_btn")
const pause_btn = $(".pause_btn")
const next_action = $(".next_action")
let isDragging = false;


duration_bar.onchange = (e) => {
  if(simulation_type === "tree") {
    simulation.animation_index = Math.round((simulation.action.length-1) * (e.target.value / 100))
  } else if(simulation_type === "board") {
    simulation.animation_index = Math.round((simulation.run_task.length-1) * (e.target.value / 100))
  }
  simulation.Pause()
  simulation.play_one_frame(simulation.animation_index)
  // simulation.play_animation()
  // duration_bar.value = (simulation.animation_index / (simulation.action.length - 1)) * 100
  // console.log(simulation.is_animation_end)
  // console.log(simulation.is_hightlight_result)
  // console.log()
}

visualize_speed.onchange = () => {
  simulation.speed = Number(visualize_speed.value)
}

pre_action.onclick = async () => {
  simulation.Pause()
  if(simulation.animation_index > 0) {
    simulation.animation_index -= 1
    await simulation.play_one_frame(simulation.animation_index)
    duration_bar.value = (simulation.animation_index / (simulation[(simulation_type === "tree" ? "action" : "run_task")].length - 1)) * 100
  }
}

next_action.onclick = async () => {
  console.log(simulation.animation_index)
  simulation.Pause()
  if(simulation.animation_index < simulation[(simulation_type === "tree" ? "action" : "run_task")].length - 1) {
    if(simulation_type === "tree" || simulation.moves.length !== 0) simulation.animation_index += 1
    await simulation.play_one_frame(simulation.animation_index)
    duration_bar.value = (simulation.animation_index / (simulation[(simulation_type === "tree" ? "action" : "run_task")].length - 1)) * 100
  }
}

play_btn.onclick = () => {
  // simulation.Play()
  simulation.isPaused = false
  simulation.play_animation(simulation.animation_index)
}

pause_btn.onclick = () => {
  simulation.isPaused = true
  // simulation.play_animation(simulation.animation_index)
}

// let [x,y] = your_pos[Math.round(Math.random() * (your_pos.length - 1))]

window.addEventListener('beforeunload', function () {
  window.scrollTo(1500 - innerWidth/2,1500 - innerHeight/2 + 60)
});

// Also set scroll position to top on page load
window.addEventListener('load', function () {
    window.scrollTo(1500 - innerWidth/2,1500 - innerHeight/2 + 60)

});


// let simulation = createsimulationSimulation()
// simulation.start()

let simulation 
if(simulation_type === "board") {
  simulation = createBoardSimulation("canvas")
  simulation.choose_chess([simulation.chosed_chess])
  simulation.run_task = JSON.parse(action.replaceAll("9999", (simulation.chosed_chess[0] + simulation.chosed_chess[1]) % 2 === 0 ? "4" : "6"))
  simulation.start()
  // simulation.run_task = JSON.parse(action.replaceAll("9999", (simulation.chosed_chess[0] + simulation.chosed_chess[1]) % 2 === 0 ? "4" : "6"))

} else if(simulation_type === "tree") {
  simulation = createTreeSimulation()
  simulation.start()
}

run_btn.onclick = () => {
  if(simulation_type === "board") {
    if(simulation.isErr) {
      simulation.setting_board.style.animation = "none"
      setTimeout(() => {
          simulation.setting_board.style.animation = "horizontal-shaking .1s linear"
      }, 10);
      return
  }
      // simulation.return_value_ouput.style.display = "none"
    simulation.start()
    simulation.chosed_chess = simulation.chosed_chess
    simulation.play_animation()
    simulation.Play()
  } else if(simulation_type === "tree") {
    simulation.run_algorithm("minimax")
    simulation.isPaused = false
    simulation.play_visualize()
  }
}

let startX, startY;
let scrollLeft, scrollTop;

const content = document.querySelector('body');

window.addEventListener('load', (event) => {
    window.scrollTo(0, 0);
});

content.addEventListener('mousedown', (e) => {
  isDragging = true;
  startX = e.clientX;
  startY = e.clientY;
  scrollLeft = window.scrollX;
  scrollTop = window.scrollY;
  content.style.cursor = 'grabbing'; // Thay đổi con trỏ chuột
//   e.preventDefault(); // Ngăn chặn sự kiện mặc định
});

content.addEventListener('mouseup', () => {
  isDragging = false;
  content.style.cursor = 'default'; // Khôi phục con trỏ chuột
});

content.addEventListener('mouseleave', () => {
  isDragging = false;
  content.style.cursor = 'default'; // Khôi phục con trỏ chuột
});

content.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  const x = e.clientX;
  const y = e.clientY;
  const walkX = (x - startX);
  const walkY = (y - startY);
  window.scrollTo(scrollLeft - walkX, scrollTop - walkY);
});

O_C_btn.onclick = () => {
  setting_bar.classList.toggle("appear")
}

open_code_btn.onclick = () => {
  action_block.classList.toggle("appear")
}

action_block.onmousemove = () => {
  isDragging = false
}

play_animation_controller.onmousemove = () => {
  isDragging = false
}

setting_bar.onmousemove = () => {
  isDragging = false
}

// window.onclick = () => {
  
// }