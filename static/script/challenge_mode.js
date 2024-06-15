// import { firebaseApp, firestore } from "../fdb_fontend/firestore_config.js"
// import { addDoc, collection } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js'

const $ = document.querySelector.bind(document)
const $$ = document.querySelectorAll.bind(document)

const demo_code = $(".demo_code").innerHTML
const task_inp_oup = $(".task_inp_oup").innerHTML
const task_id = $("#task_id").innerHTML

const submitBtn = $(".coding_module-nav--submitBtn.btn")
const runBtn = $(".coding_module-nav--runBtn")
const loader = $(".coding_module-nav--submitBtn.loader")

const uniNavItem = $$(".utility_nav-block--item")
const taskBtn = $(".bot_display_nav-block--item.task")
const resulttBtn = $(".bot_display_nav-block--item.result")
const submissionsBtn = $(".bot_display_nav-block--item.submissions")
const task_block = $(".bot_display-task")
const result_block = $(".bot_display-result")
const submissions_block = $(".bot_display-submissions")
const all_block = $$(".bot_display-item")

// result block

const result_type = $(".type")
const result_status = $(".status")
const display_result = $(".display_result")
const test_case_result_list = $(".test_case_result_list")
let test_case_result_item = $$(".test_case_result_item")
let text_case_InOu = $$(".text_case_InOu")

// --------------

// test case nav list

const test_case_nav_item = $$(".test_case_nav_item")
const test_case_item = $$(".test_case_item")
const inp = $$(".inp")

// --------------


const animation = $(".utility_nav-block .animation")
const animationChild = $(".utility_nav-block .animation .children")
const bDAnimation = $(".bot_display_nav-block .animation")
const bDAnimationChild = $(".bot_display_nav-block .animation .children")
const botDisplayBlock = $$(".bot_display-video-item")


var editor = ace.edit("coding_module-coding_block");

editor.setOptions({
    mode: "ace/mode/python",
    selectionStyle: "text",
    theme: "ace/theme/dracula",
});

runBtn.onclick = () => {
    const code = editor.getValue()

    test_case_nav_item.forEach(item => {
        item.querySelector(".test_case_nav_title").classList.toggle("appear")
    })

    fetch("/run_task", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            code: code,
            inp_oup: JSON.parse(task_inp_oup),
        }),
    })
    .then(res => res.json())
    .then(data => {
        data.user_output.forEach((oup, i) => {
            if(oup.output_status === "AC") {
                test_case_nav_item[i].className = "test_case_nav_item accepted"
            } else {
                test_case_nav_item[i].className = "test_case_nav_item err"
            }
        })
    })
    test_case_nav_item.forEach(item => {
        item.querySelector(".test_case_nav_title").classList.toggle("appear")
    })
}

submitBtn.onclick = () => {
    const code = editor.getValue()
    submitCode(code)
}


function submitCode(code) {
    console.log({
        code: code,
        inp_oup: JSON.parse(task_inp_oup),
        id: task_id
    })

    fetch("/submit", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            code: code,
            inp_oup: JSON.parse(task_inp_oup),
            id: task_id
        }),
    })
    .then(res => res.json())
    .then(data => {
        console.log(data)
        render_result(data)
    })
    .catch(err => console.log(err))
    .finally(() => {
    })
}

const session = editor.getSession();
session.setMode('ace/mode/python');

editor.getSession().on('change', function() {
    // if(submitBtn.dataset.saved = "true") {
    //     submitBtn.style.backgroundColor = "#1E1E1E"
    //     submitBtn.style.color = "#fff"
    // }
});

session.setValue(JSON.parse(demo_code))

// fetch("/get_code")
// .then(res => res.json())
// .then(data => {
//         session.setValue(data)
// })
// .catch(err => console.error(err))

function render_result(data) {
    // const result_type = $(".type")
    // const status = $(".status")
    // const display_result = $(".display_result")
    // const test_case_result_list = $(".test_case_result_list")
    result_status.className = data.status === "AC" ? "status accepted": "status err"
    result_type.className = data.status === "AC" ? "type accepted": "type err"
    display_result.className = data.status === "AC" ? "display_result accepted": "display_result err"

    result_status.innerHTML = data.status === "AC" ? "Accepted": data.status === "WA" ? "Wrong answer" : "Syntax error"
    test_case_result_list.innerHTML = ""

    data.user_output.forEach((oup, i) => {
        test_case_result_list.innerHTML += `
            <li tabindex="0" class="test_case_result_item ${oup.output_status === "AC" ? "accepted" : "err"}">
                Test ${i+1}
                <div class="text_case_InOu ${oup.output_status === "AC" ? "accepted" : "err"}">
                    <div class="text_case_oup_title">output =</div>
                    <div class="test_case_oup">${data.output[i]}</div>
                    <hr style="width: 100%; border: 1px solid #007BFF; margin-top: 14px">
                    <div class="user_oup_title">your output =</div>
                    <div class="user_oup">${oup.output}</div>
                </div>
            </li>
        `
    })

    reset_result_item()

}

function reset_result_item() {
    test_case_result_item = $$(".test_case_result_item")
    test_case_result_item.forEach(item => {
        item.onblur = () => {
            console.log(123)
            item.querySelector(".text_case_InOu").classList.remove("appear")
        }
        
        item.onclick = () => {
            console.log("Asd")
            text_case_InOu.forEach(i => i.classList.remove("appear"))
            item.querySelector(".text_case_InOu").classList.add("appear")
        }
    })
}

function toggleMode(mode) {
    all_block.forEach(item => item.style.display = "none")
    console.log(mode)
    switch (mode) {
        case "task":
            task_block.style.display = "block"
            break
        case "result":
            result_block.style.display = "block"
            break
        case "submissions":
            submissions_block.style.display = "block"
            break
        default:
            break
    }
}

function changeAnimation(e, right, width, mode, animationChild) {
    $$(".bot_display_nav-block--item").forEach(ele => ele.style.color = "#ccc")
    e.style.color = "#fff"
    animationChild.style.right = right;
    animationChild.style.width = width;
    toggleMode(mode)
}

function scrollToView(element) {
    if(!element) return
    setTimeout(() => {
        element.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
        })
    }, 200)
}

taskBtn.onclick = (e) => {
    // console.log("Asdadss")
    changeAnimation(taskBtn, `${100 - (e.target.clientWidth / bDAnimation.clientWidth * 100)}%`, e.target.clientWidth + "px", "task", bDAnimationChild)
}

resulttBtn.onclick = (e) => {
    changeAnimation(resulttBtn, taskBtn.clientWidth + 5 + "%", e.target.clientWidth + "px", "result", bDAnimationChild)
}

submissionsBtn.onclick = (e) => {
    changeAnimation(submissionsBtn, "0", e.target.clientWidth + "px", "submissions", bDAnimationChild)
}

inp.forEach(item => {
    item.oninput = () => {
        console.log("adss")
        item.style.height = "5px";
        item.style.height = (item.scrollHeight) + "px";
    }
})


test_case_nav_item.forEach((item, i) => {
    item.onclick = () => {
        test_case_item.forEach(i => i.classList.remove("appear"))
        test_case_nav_item.forEach(i => i.classList.remove("choosen"))
        item.classList.add("choosen")
        test_case_item[i].classList.add("appear")
    }
})