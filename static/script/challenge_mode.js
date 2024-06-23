import { firebaseApp, firestore } from "../fdb_fontend/firestore_config.js"
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js'

const $ = document.querySelector.bind(document)
const $$ = document.querySelectorAll.bind(document)

const demo_code = $(".demo_code").innerHTML
const task_inp_oup = $(".task_inp_oup").innerHTML
const task_id = $("#task_id").innerHTML
const username = $(".username").innerHTML
// const challenger = $(".challenger").innerHTML

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
const test_case_result_err = $(".test_case_result_err")

// --------------

// submissions block

const submissions_list = $(".submissions_list")

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
let options = {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  }

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

    let formatter = new Intl.DateTimeFormat([], options);
    
    // console.log();

    fetch("/run_task", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            code: code,
            inp_oup: JSON.parse(task_inp_oup).slice(0, 2),
            time: formatter.format(new Date()),
        }),
    })
    .then(res => res.json())
    .then(data => {
        $$(".output_block").forEach(item => item.remove())
        if(data.status === "SE") {
            render_result(data, data.status)
            return
        }
        console.log(data)
        data.user_output.forEach((oup, i) => {
            if(oup.output_status === "AC") {
                test_case_nav_item[i].className = "test_case_nav_item accepted"
            } else {
                test_case_nav_item[i].className = "test_case_nav_item err"
            }
        })
        test_case_item.forEach((item,i) => {
            item.innerHTML += `
                <div class="output_block">
                    <hr style="width: 100%; margin: 10px 0;">
                    <div class="oup_title">output</div>
                    <div contenteditable="" name="" id="" class="oup">${JSON.stringify(data.output[i])}</div>
                    <div class="user_oup_title">your_output</div>
                    <div contenteditable="" name="" id="" class="your_oup ${data.user_output[i].output_status === "AC" ? "accepted" : "err"}">${JSON.stringify(data.user_output[i].output)}</div>
                </div>
            `
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
    let formatter = new Intl.DateTimeFormat([], options);
    fetch("/submit", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            code: code,
            inp_oup: JSON.parse(task_inp_oup),
            id: task_id,
            time: formatter.format(new Date()),
        }),
    })
    .then(res => res.json())
    .then(data => {
        render_result(data, data.status)
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

function capitalize(s)
{
    return s && s[0].toUpperCase() + s.slice(1);
}

function render_result(data, status) {
    // const result_type = $(".type")
    // const status = $(".status")
    // const display_result = $(".display_result")
    // const test_case_result_list = $(".test_case_result_list")
    result_status.className = data.status === "AC" ? "status accepted": "status err"
    result_type.className = data.status === "AC" ? "type accepted": "type err"
    display_result.className = data.status === "AC" ? "display_result accepted": "display_result err"

    result_status.innerHTML = data.status === "AC" ? "Accepted": data.status === "WA" ? "Wrong answer" : "Syntax error"
    test_case_result_list.innerHTML = ""

    if(status === "SE") {
        test_case_result_err.style.display = "block"
        test_case_result_err.innerHTML = data.err
        test_case_result_list.style.display = "none"
    } else {
        test_case_result_err.style.display = "none"
        test_case_result_list.style.display = "grid"
        data.user_output.forEach((oup, i) => {
            test_case_result_list.innerHTML += `
                <li tabindex="0" class="test_case_result_item ${oup.output_status === "AC" ? "accepted" : "err"}">
                    Test ${i+1}
                    <div class="text_case_InOu ${oup.output_status === "AC" ? "accepted" : "err"}">
                        <div class="text_case_oup_title">output =</div>
                        <div class="test_case_oup">${JSON.stringify(data.output[i])}</div>
                        <hr style="width: 100%; border: 1px solid #007BFF; margin-top: 14px">
                        <div class="user_oup_title">your output =</div>
                        <div class="user_oup">${typeof oup.output === 'boolean' ? capitalize(`${oup.output}`) : JSON.stringify(oup.output)}</div>
                    </div>
                </li>
            `
        })
        reset_result_item()
    }
    changeAnimation(resulttBtn, taskBtn.clientWidth + 5 + "%", resulttBtn.clientWidth + "px", "result", bDAnimationChild)
    
}

function reset_result_item() {
    test_case_result_item = $$(".test_case_result_item")
    test_case_result_item.forEach(item => {
        item.onblur = () => {
            item.querySelector(".text_case_InOu").classList.remove("appear")
        }
        
        item.onclick = () => {
            text_case_InOu.forEach(i => i.classList.remove("appear"))
            item.querySelector(".text_case_InOu").classList.add("appear")
        }
    })
}

function hangle_view_code(code_history) {
    const submissions_items = $$(".submissions_item")
    submissions_items.forEach((item,i) => {
        item.querySelector(".view_code_btn").onclick = () => {
            submissions_items.forEach(item => {
                item.classList.remove("choosen")
            })
            item.classList.add("choosen")
            session.setValue(code_history[i])
        }
    })
}

async function render_summissions(isfirstRender = false) {
    const task_ref = doc(firestore, "task", task_id);
    const task_doc = await getDoc(task_ref)
    const task_data = task_doc.data()
    // console.log(task_data)
    let code_history = []

    if(task_data.challenger.hasOwnProperty(username)) {
        const user_submissions = task_data.challenger[username].submissions
        user_submissions.reverse().forEach(submissions => {
            code_history.push(submissions.code)
            submissions_list.innerHTML += `
                <li class="submissions_item">
                    <div class="submissions_status ${submissions.status === "AC" ? "accepted": "err"}">${submissions.status === "AC" ? "Accepted": submissions.status === "WA" ? "Wrong answer" : "Syntax error"}</div>
                    <div class="submissions_time">${submissions.submit_time}</div>
                    <div class="submissions_test_finished">${submissions.test_finished}</div>
                    <div class="view_code_btn">view code</div>
                </li>
            `
        })
        hangle_view_code(code_history)
        if(isfirstRender) {
            session.setValue(task_data.challenger[username].current_submit.code)
        }
    }
    
}
// console.log(demo_code)

render_summissions(true)

function toggleMode(mode) {
    all_block.forEach(item => item.style.display = "none")
    // console.log(mode)
    switch (mode) {
        case "task":
            task_block.style.display = "block"
            break
        case "result":
            console.log("Result")
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