import { firebaseApp, firestore } from "../fdb_fontend/firestore_config.js"
import { addDoc, collection } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js'
import { uploadImage } from "../fdb_fontend/upload.js"

const $ = document.querySelector.bind(document)
const $$ = document.querySelectorAll.bind(document)

const username = $(".username").innerHTML
const post_btn = $(".post_btn")
const title_input = $(".title_input")
const description_input = $(".description_input")
const test_case_list = $(".test_case_list")
const add_test_case_btn = $('.add_test_case_btn')
const remove_test_case_btn = $('.remove_test_case_btn')
const difficult_list = $(".difficult_list")
const tag_list = $(".tag_list")
const test_case_control = $(".test_case_control")
const demo_code_block = $(".demo_code_block")

const overflow = $(".overflow")
const loadder = $(".loadder")
const noti_content = $(".noti_content")
const ok_btn = $(".ok_btn")

let inp_list = $$(".input_list")
let oup = $$(".oup")


// let url = []
let text
let dem = 1

function dataURLtoBlob(dataurl) {
    let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
}

function getInOupValue() {
    let inp_oup = []
    let input_list = []
    let input_value = []
    let output_value = []

    inp_list.forEach((item) => {
        input_value = []
        item.querySelectorAll(".inp").forEach((i) => {
            input_value.push(i.value.replaceAll("(","[").replaceAll(")","]"))
        })
        input_list.push(input_value)
    })

    oup.forEach((item) => {
        output_value.push(item.value.replaceAll("(","[").replaceAll(")","]"))
    })

    for(let i = 0; i < output_value.length; i++) {
        inp_oup.push({
            input: input_list[i],
            output: output_value[i],
        })
    }

    return JSON.stringify(inp_oup)
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
            break
        case "post":
            test_case_control.style.display = "none"
            difficult_list.style.display = "none"
            demo_code_block.style.display = "none"
            description_input.style.display = "block"
        default:
            test_case_control.style.display = "none"
            difficult_list.style.display = "none"
            demo_code_block.style.display = "none"
            description_input.style.display = "block"
            break
    }
}

post_btn.onclick = () => {
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
                if(!url.indexOf("http")) {
                    default_url.push(dataURLtoBlob(url.replace("src=\"","").replace("\"","").replaceAll("amp;", "")))
                    isTDU = true
                }
            })
    
            if(!isTDU) {
                url.push(editor_url[0].replace("src=\"","").replace("\"","").replaceAll("amp;", ""))
                console.log(editor_url[0].replace("src=\"","").replace("\"","").replaceAll("amp;", ""))
                if(tag_list.value === "post") {
                    const docRef = addDoc(collection(firestore, "post"), {
                        author: username,
                        content: text,
                        image_url: url,
                        title: title_input.value,
                        description: description_input.value,
                        post_id: `${new Date().getTime()}`,
                        upload_time: `${new Date().getTime()}`
                    })
                } else if(tag_list.value === "task") {
                    console.log(getInOupValue())
                    const docRef = addDoc(collection(firestore, "task"), {
                        task_name: title_input.value,
                        accepted_count: 0,
                        challenger: [],
                        content: text,
                        failed: 0,
                        inp_oup: getInOupValue(),
                        tag: {
                            difficult: difficult_list.value,
                        },
                        demo_code: JSON.stringify(demo_code)
                        
                    })
                }
            }
    
            default_url.forEach((item, i) => {
                uploadImage(item).then(new_url => {
                    if(i === editor_url.length - 1) {
                        url.forEach((u,j) => {
                            text = text.replace(editor_url[j], ` src="${u}"`)
                        })
                        if(tag_list.value === "post") {
                            const docRef = addDoc(collection(firestore, "post"), {
                                author: username,
                                content: text,
                                image_url: url,
                                title: title_input.value,
                                description: description_input.value,
                                post_id: `${new Date().getTime()}`,
                                upload_time: `${new Date().getTime()}`
                            })
                        } else if(tag_list.value === "task") {
                            console.log(getInOupValue())
                            const docRef = addDoc(collection(firestore, "task"), {
                                task_name: title_input.value,
                                accepted_count: 0,
                                challenger: [],
                                content: text,
                                failed: 0,
                                inp_oup: getInOupValue(),
                                tag: {
                                    difficult: difficult_list.value,
                                },
                                demo_code: JSON.stringify(demo_code)
                                
                            })
                        }
                    }
                })
            })
        } else {
            if(tag_list.value === "post") {
                const docRef = addDoc(collection(firestore, "post"), {
                    author: username,
                    content: text,
                    image_url: url,
                    title: title_input.value,
                    description: description_input.value,
                    post_id: `${new Date().getTime()}`,
                    upload_time: `${new Date().getTime()}`
                })
            } else if(tag_list.value === "task") {
                console.log(getInOupValue())
                const docRef = addDoc(collection(firestore, "task"), {
                    task_name: title_input.value,
                    accepted_count: 0,
                    challenger: [],
                    content: text,
                    failed: 0,
                    inp_oup: getInOupValue(),
                    tag: {
                        difficult: difficult_list.value,
                    },
                    demo_code: JSON.stringify(demo_code)
                })
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
        console.log(err.message)
    }
}

ok_btn.onclick = () => {
    overflow.style.display = "none"
}

add_test_case_btn.onclick = () => {
    dem++
    let block = document.createElement('div')
    block.classList = "test_case_item"
    let inp = document.createElement('textarea')
    inp.classList = "inp"
    inp.setAttribute("row", "1")
    let oup = document.createElement('textarea')
    oup.classList = "oup"
    oup.setAttribute("row", "1")
    let check_box = document.createElement('input')
    check_box.type = "checkbox"
    check_box.style = "width: 20px; height: 20px;"
    check_box.classList = "check_box"
    check_box.dataset.index = dem

    block.appendChild(inp)
    block.appendChild(oup)
    block.appendChild(check_box)
    test_case_list.appendChild(block)

    // reset_oninput()

    // test_case_list.innerHTML += `
    //     <div class="test_case_item">
    //         <input type="text" class="inp">
    //         <input type="text" class="oup">
    //         <input type="checkbox" style="width: 20px; height: 20px;" class="check_box" data-index="${c}">
    //     </div>
    // `
}

remove_test_case_btn.onclick = () => {
    
    const checked_box = $$(".check_box:checked")
    if(inp.length - checked_box.length < 2) return
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

tag_list.onchange = (e) => {
    toggle_mode(e.target.value)
    // console.log(e.target.value)
}