import { firebaseApp, firestore } from "../fdb_fontend/firestore_config.js"
import { addDoc, collection } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js'
import { uploadImage } from "../fdb_fontend/upload.js"

const $ = document.querySelector.bind(document)
const $$ = document.querySelectorAll.bind(document)

const header = $("header")

const username = $(".username").innerHTML
const post_btn = $(".post_btn")
const title_input = $(".title_input")
const description_input = $(".description_input")
const test_case_list = $(".test_case_list")
const add_test_case_btn = $('.add_test_case_btn')
const remove_test_case_btn = $('.remove_test_case_btn')
const difficult_list = $(".difficult_list")
const type_list = $(".type_list")
const test_case_control = $(".test_case_control")
const demo_code_block = $(".demo_code_block")
const test_case_block = $(".test_case_block")

const tag_block = $(".tag_block")
const tag_item = $$(".tag_item")

// test case config

const input_num_config = $(".input_num_config")
const title_input_config_list = $(".title_input_config_list")
const create_btn = $(".create_btn")
const test_case_config = $(".test_case_config")

// ---------------

const overflow = $(".overflow")
const loadder = $(".loadder")
const noti_content = $(".noti_content")
const ok_btn = $(".ok_btn")

// let inp_list = $$(".input_list")
let oup = $$(".oup")
let input_title = []

// let url = []
let text
let dem = 0

let options = {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
}

let formatter = new Intl.DateTimeFormat([], options);

function dataURLtoBlob(dataurl) {
    let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
}

function getInOupValue() {
    let inp_list = $$(".input_list")
    let oup = $$(".oup")
    let inp_oup = []
    let input_list = []
    let input_value = []
    let output_value = []

    inp_list.forEach((item) => {
        input_value = []
        item.querySelectorAll(".inp").forEach((i) => {
            // console.log(i.value.replaceAll("(","[").replaceAll(")","]"))
            input_value.push(i.value)
        })
        input_list.push(input_value)
    })

    oup.forEach((item) => {
        // console.log(JSON.parse(item.value.replaceAll("(","[").replaceAll(")","]").replaceAll("True", "true").replaceAll("False","false")))
        output_value.push(item.value)
    })

    for(let i = 0; i < output_value.length; i++) {
        inp_oup.push({
            input: input_list[i],
            output: output_value[i],
        })
    }

    console.log(inp_oup)

    return inp_oup
}

// function reset_oninput() {
//     inp = $$(".inp")
//     oup = $$(".oup")

//     inp.forEach((item, i) => {
//         item.oninput = () => {
//             if(item.scrollHeight < oup[i].scrollHeight) return
//             item.style.height = "5px";
//             oup[i].style.height = item.style.height;
//             item.style.height = (item.scrollHeight) + "px";
//             oup[i].style.height = item.style.height;
//         }
//     })
//     oup.forEach((item,i) => {
//         item.oninput = () => {
//             console.log(item.scrollHeight, inp[i].scrollHeight)
//             if(item.scrollHeight < inp[i].scrollHeight) return
//             item.style.height = "5px";
//             inp[i].style.height = item.style.height;
//             item.style.height = (item.scrollHeight) + "px";
//             inp[i].style.height =  item.style.height;
//         }
//     })
// }

// reset_oninput()

function toggle_mode(mode) {
    switch(mode) {
        case "task":
            test_case_control.style.display = "block"
            difficult_list.style.display = "block"
            demo_code_block.style.display = "block"
            description_input.style.display = "none"
            tag_block.style.display = "block"
            header.innerHTML = "tạo task"
            break
        case "post":
            test_case_control.style.display = "none"
            difficult_list.style.display = "none"
            demo_code_block.style.display = "none"
            description_input.style.display = "block"
            tag_block.style.display = "none"
            header.innerHTML = "tạo post"
        default:
            test_case_control.style.display = "none"
            difficult_list.style.display = "none"
            demo_code_block.style.display = "none"
            description_input.style.display = "block"
            tag_block.style.display = "none"
            header.innerHTML = "tạo post"
            break
    }
}

post_btn.onclick = () => {
    // console.log({
    //     task_name: title_input.value,
    //     accepted_count: 0,
    //     challenger: [],
    //     content: text,
    //     submission_count: 0,
    //     inp_oup: getInOupValue(),
    //     tag: {
    //         difficult: difficult_list.value,
    //     },
    //     // demo_code: JSON.stringify(demo_code),
    //     input_title: input_title,
    // })
    // return
    let url = []
    text = editor.getData()
    let default_url = []
    let editor_url = text.match(/src="([^"]+)"/g)
    let isTDU = false
    const demo_code = $(".demo_code").value

    overflow.style.display = "grid"
    loadder.style.display = "block"

    try {
        if(editor_url) {
            editor_url.forEach((url) => {
                if(url.indexOf("http") === -1) {
                    default_url.push(url.replace("src=\"","").replace("\"","").replaceAll("amp;", ""))
                    isTDU = true
                }
            })
    
            if(!isTDU) {
                url.push(editor_url[0].replace("src=\"","").replace("\"","").replaceAll("amp;", ""))
                console.log(editor_url[0].replace("src=\"","").replace("\"","").replaceAll("amp;", ""))
                console.log(text)
                if(type_list.value === "post") {
                    const docRef = addDoc(collection(firestore, "post"), {
                        author: username,
                        content: text,
                        image_url: url,
                        title: title_input.value,
                        description: description_input.value,
                        post_id: `${new Date().getTime()}`,
                        upload_time: formatter.format(new Date()),
                    })
                } else if(type_list.value === "task") {
                    console.log(getInOupValue())
                    fetch("/upload_task", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            author: username,
                            task_name: title_input.value,
                            accepted_count: 0,
                            challenger: [],
                            content: text,
                            submission_count: 0,
                            inp_oup: getInOupValue(),
                            tag: {
                                difficult: difficult_list.value,
                                skill_require: $$(".tag_item.selected").map(item => ({name: item.innerHTML, link: item.dataset.link}))
                            },
                            demo_code: JSON.stringify(demo_code),
                            input_title: input_title,
                        }),
                    })
                    .then(res => res.json())
                    .then(data => {
                        if(data === "err") {
                            throw data
                        } 
                        console.log(data)
                    })
                    .catch(err => {throw err})
                    // const docRef = addDoc(collection(firestore, "task"), {
                    //     author: username,
                    //     task_name: title_input.value,
                    //     accepted_count: 0,
                    //     challenger: [],
                    //     content: text,
                    //     submission_count: 0,
                    //     inp_oup: getInOupValue(),
                    //     tag: {
                    //         difficult: difficult_list.value,
                    //         skill_require: $$(".tag_item.selected").map(item => ({name: item.innerHTML, link: item.dataset.link}))
                    //     },
                    //     demo_code: JSON.stringify(demo_code),
                    //     input_title: input_title,
                    // })
                }
            } else {
                default_url.forEach((item, i) => {
                    uploadImage(dataURLtoBlob(item)).then(new_url => {
                        text = text.replace(item, new_url)
                        if(i === editor_url.length - 1) {
                            if(type_list.value === "post") {
                                const docRef = addDoc(collection(firestore, "post"), {
                                    author: username,
                                    content: text,
                                    image_url: url,
                                    title: title_input.value,
                                    description: description_input.value,
                                    post_id: `${new Date().getTime()}`,
                                    upload_time: formatter.format(new Date()),
                                })
                            } else if(type_list.value === "task") {
                                fetch("/upload_task", {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                        author: username,
                                        task_name: title_input.value,
                                        accepted_count: 0,
                                        challenger: [],
                                        content: text,
                                        submission_count: 0,
                                        inp_oup: getInOupValue(),
                                        tag: {
                                            difficult: difficult_list.value,
                                            skill_require: $$(".tag_item.selected").map(item => ({name: item.innerHTML, link: item.dataset.link}))
                                        },
                                        demo_code: JSON.stringify(demo_code),
                                        input_title: input_title,
                                    }),
                                })
                                .then(res => res.json())
                                .then(data => {
                                    if(data === "err") {
                                        throw data
                                    } 
                                    console.log(data)
                                })
                                .catch(err => {throw err})
                                // console.log(getInOupValue())
                                // const docRef = addDoc(collection(firestore, "task"), {
                                //     author: username,
                                //     task_name: title_input.value,
                                //     accepted_count: 0,
                                //     challenger: [],
                                //     content: text,
                                //     submission_count: 0,
                                //     inp_oup: getInOupValue(),
                                //     tag: {
                                //         difficult: difficult_list.value,
                                //         skill_require: $$(".tag_item.selected").map(item => ({name: item.innerHTML, link: item.dataset.link}))
                                //     },
                                //     demo_code: JSON.stringify(demo_code),
                                //     input_title: input_title,
                                // })
                            }
                        }
                    })
                })
            }
        } else {
            if(type_list.value === "post") {
                const docRef = addDoc(collection(firestore, "post"), {
                    author: username,
                    content: text,
                    image_url: url,
                    title: title_input.value,
                    description: description_input.value,
                    post_id: `${new Date().getTime()}`,
                    upload_time: formatter.format(new Date()),
                })
            } else if(type_list.value === "task") {
                let tags = Array.from($$(".tag_item.selected")).map(item => ({name: item.innerHTML, link: item.dataset.link}))
                fetch("/upload_task", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        author: username,
                        task_name: title_input.value,
                        accepted_count: 0,
                        challenger: [],
                        content: text,
                        submission_count: 0,
                        inp_oup: getInOupValue(),
                        tag: {
                            difficult: difficult_list.value,
                            skill_require: tags
                        },
                        demo_code: JSON.stringify(demo_code),
                        input_title: input_title,
                    }),
                })
                .then(res => res.json())
                .then(data => {
                    if(data === "err") {
                        throw data
                    } 
                    console.log(data)
                })
                .catch(err => {throw err})
            }
        }

        loadder.style.display = "none"
        noti_content.style.display = "block"
        noti_content.innerHTML = "Thành công"
        noti_content.classList.add("success")
    } catch(err) {
        loadder.style.display = "none"
        noti_content.style.display = "block"
        noti_content.innerHTML = err.message
        noti_content.classList.add("err")
    }
}

create_btn.onclick = () => {
    input_title = []
    const title_input_config_items = $$(".title_input_config_item")
    title_input_config_items.forEach(item => {
        input_title.push(item.value)
    })
    test_case_block.style.display = "flex"
    test_case_config.style.display = "none"
}

ok_btn.onclick = () => {
    overflow.style.display = "none"
}

add_test_case_btn.onclick = () => {
    let block = document.createElement('div')
    block.classList = "test_case_item"

    let input_list = document.createElement('input_list')
    input_list.classList = "input_list"

    input_title.forEach(item => {
        let inp = document.createElement('textarea')
        inp.classList = "input_item inp"
        inp.placeholder = item
        inp.setAttribute("row", "1")
        input_list.appendChild(inp)
    })

    let oup = document.createElement('textarea')
    oup.classList = "oup"
    oup.setAttribute("row", "1")
    let check_box = document.createElement('input')
    check_box.type = "checkbox"
    check_box.style = "width: 20px; height: 20px;"
    check_box.classList = "check_box"
    check_box.dataset.index = dem

    block.appendChild(input_list)
    block.appendChild(oup)
    block.appendChild(check_box)
    test_case_list.appendChild(block)
    dem++

    console.log(input_title)

    // test_case_list.innerHTML += `
    //     <div class="test_case_item">
    //         <div class="input_list">
    //             ${(input_title.map(item => `
    //                 <textarea placeholder="${item}" rows="1" type="text" class="input_item inp"></textarea>    
    //             `)).join("")}
    //         </div>
    //         <input type="text" class="oup">
    //         <input type="checkbox" style="width: 20px; height: 20px;" class="check_box" data-index="${dem}">
    //     </div>
    // `
}

remove_test_case_btn.onclick = () => {
    
    const checked_box = $$(".check_box:checked")
    const input_lists = $$(".input_list")
    if(input_lists.length - checked_box.length < 2) return
    let test_case_item = $$(".test_case_item")
    console.log(checked_box)

    checked_box.forEach(item => {
        console.log(test_case_item[item.dataset.index])
        test_case_item[item.dataset.index].remove()
    })

    test_case_item = $$(".test_case_item")

    test_case_item.forEach((item, i) => {
        item.querySelector(".check_box").dataset.index = i
    })
    dem -= checked_box.length
}

type_list.onchange = (e) => {
    toggle_mode(e.target.value)
    // console.log(e.target.value)
}

input_num_config.oninput = (e) => {
    if(input_num_config.value > 5) {
        input_num_config.value = 5
    }
    let item = []
    console.log(e.target.value)
    for(let  i = 0; i < e.target.value; i++) {
        item.push(`
            <input placeholder="Enter input name" type="text" class="title_input_config_item">
        `.replaceAll(" , ", ""))
    }

    title_input_config_list.innerHTML = (item.map(a => a)).join("")
}

tag_item.forEach(item => {
    item.onclick = () => {
        if(item.classList.contains("selected")) {
            item.classList.remove("selected")
            return
        }
        item.classList.add("selected")
    }
})