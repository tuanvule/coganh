import { createBoardSimulation } from "./board_simulation_model.js";
import { createTreeSimulation } from "./tree_simulation_model.js";

const $ = document.querySelector.bind(document)
const $$ = document.querySelectorAll.bind(document)

const run_btn = $(".run_btn")
let action = $(".action").innerHTML
const simulation_type = $(".simulation_type").innerHTML
const simulation_name = $(".simulation_name").innerHTML

const O_C_btn = $(".O_C_btn i")
const open_code_btn = $(".open_code_btn i")
const side_select = $(".side_select")

const setting_bar = $(".setting_bar")
const action_block = $(".action_block")
const play_animation_controller = $(".play_animation_controller")
const play_pause_btn = $("#play_pause_btn")
const duration_bar = $(".duration_bar")
duration_bar.value = 0
const visualize_speed = $(".visualize_speed")
const pre_action = $(".pre_action")
const play_btn = $(".play_btn")
const pause_btn = $(".pause_btn")
const next_action = $(".next_action")
let isDragging = false;

const sBoard = $(".setting_item.sboard")
const sChooseChess = $(".setting_item.choose_chess")
const sVay_check = $(".setting_item.vay_check")
const sNode = $(".setting_item.node")
const sMinimaxTurn = $(".setting_item.minimax_turn")
const sChooseChessMove = $(".choose_chess_move")

// const your_chess = $$(".your_chess")

switch (simulation_name) {
  case "valid_move":
    sBoard.style.display = "flex"
    sChooseChess.style.display = "flex"
    break;
  case "vay":
    sBoard.style.display = "flex"
    sVay_check.style.display = "flex"
    break;
  case "ganh_chet":
    sBoard.style.display = "flex"
    sChooseChessMove.style.display = "flex"
    break
  default:
    sNode.style.display = "flex"
    sMinimaxTurn.style.display = "flex"
    break;
}


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
}

visualize_speed.onchange = () => {
  simulation.speed = Number(visualize_speed.value)
}

side_select.onchange = () => {
  simulation.config_run_task = (obj) => {
    let run_task = []
    for(let [x,y] of obj[side_select.value]) {
      let isHasMove = obj.valid_move_for_single_chess[side_select.value][`[${[x,y]}]`].length > 0
      run_task.push(...[
        ["RMH", "", 1000],
        ["hightlight", {row: [3,4,5,6], type: "run"}, 0],
        ["hightlight", {row: [((x+y)) % 2 === 0 ? 4 : 6], type: "true"}, 0],
        ["RMH", "", 1000],
        ["CC_M", ["valid", "valid_move_for_single_chess", side_select.value, `[${[x,y]}]`], 0],
        ["hightlight", {row: [(isHasMove ? [9,10] : 9)], type:(isHasMove ? "true" : "false")}, 0],
      ])
      if(isHasMove) {
        run_task.push(
          ["SDC", ["vay",false], 0]
        )
        obj.run_task = run_task
        return
      }
    }
    run_task.push(...[
      ["RMH", "", 1000],
      ["hightlight", {row: [12,13], type: "true"}, 0],
      ["FT", obj[side_select.value], 100],
    ])
    run_task.push(
      ["SDC", ["vay",true], 0]
    )
    obj.run_task = run_task
  }
  simulation.start()
  simulation.Pause()
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
    if(simulation_type === "tree" || simulation.moves.length !== 0 || simulation.all_move.your_pos.length !== 0 || simulation.opp_pos.length !== 0) simulation.animation_index += 1
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
  if(simulation_name === "valid_move") {
    simulation.is_single_chess = true
    simulation.chosed_chess = [[0,2]]
    simulation.choose_chess(simulation.chosed_chess)
  }
  simulation.start()
  if(simulation_name === "vay") {
    simulation.config_run_task = (obj) => {
      let run_task = []
      for(let [x,y] of obj[side_select.value]) {
        let isHasMove = obj.valid_move_for_single_chess[side_select.value][`[${[x,y]}]`].length > 0
        run_task.push(...[
          ["RMH", "", 1000],
          ["hightlight", {row: [3,4,5,6], type: "run"}, 0],
          ["hightlight", {row: [((x+y)) % 2 === 0 ? 4 : 6], type: "true"}, 0],
          ["RMH", "", 1000],
          ["CC_M", ["valid", "valid_move_for_single_chess", side_select.value, `[${[x,y]}]`], 0],
          ["hightlight", {row: [(isHasMove ? [9,10] : 9)], type:(isHasMove ? "true" : "false")}, 0],
        ])
        if(isHasMove) {
          run_task.push(
            ["SDC", ["vay",false], 0]
          )
          obj.run_task = run_task
          return
        }
      }
      run_task.push(
        ["FT", obj[side_select.value], 100]
      )
      run_task.push(
        ["SDC", ["vay",true], 0]
      )
      obj.run_task = run_task
    }
  }
  if(simulation_name === "valid_move") {
    simulation.run_task = JSON.parse(action.replaceAll("9999", (simulation.chosed_chess[0][0] + simulation.chosed_chess[0][1]) % 2 === 0 ? "4" : "6"))
  }
  if(simulation_name === "ganh_chet") {
    simulation.config_run_task = () => {
      const setting_board = $(".board")
      console.log([simulation.selected_pos,simulation.new_pos], simulation.opp_pos)
      let valid_remove = simulation.ganh_chet(simulation.new_pos, simulation.opp_pos, 1, -1)
      console.log(valid_remove)
      console.log([simulation.selected_pos,simulation.new_pos])
      let run_task = []
      run_task.push(...[
        ["render", JSON.parse(`[${setting_board.innerHTML.replaceAll("\n",",")}]`.replaceAll("],]","]]")), 0],
        ["hightlight", {row: [6], type: "true"}, 0],
        ["MC", [simulation.selected_pos,simulation.new_pos], 1000],
        ...simulation.opp_pos.map((pos) => ["CSC", pos, 500]),
        ["RMH", "", 0]
      ])
      if(valid_remove.length > 0) {
        run_task.push(...[
          ["FT", valid_remove, 1000],
          ["SDC", ["ganh_chet", [true, valid_remove]], 0],
          ["hightlight", {row: [7,8,9,10], type: "true"}, 0],
        ])
      } else {
        run_task.push(...[
          ["SDC", ["ganh_chet", [false, valid_remove]], 1000],
          ["hightlight", {row: [7,8,9], type: "false"}, 0],
        ])
      }
      simulation.run_task = run_task
    }
  }
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
  // simulation.move_chess([0,2], [1,2], 0)
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