const $ = document.querySelector.bind(document)
const $$ = document.querySelectorAll.bind(document)

const fight_btn = $(".fight_btn")
const create_room_btn = $(".create_room_btn")
let room_id

fetch("/get_room")
.then(res => res.json())
.then(data => {
    console.log(data)
    data.forEach((room) => {
        const {player_1} = room
        $(".room_list").innerHTML += `
            <li class="room">${player_1}</li>
        `
    })
})
.then(() => {
    let rooms = $$(".room")

    rooms.forEach((room) => {
        room.onclick = (e) => {
            rooms.forEach((e) => e.classList.remove("choose"))
            room.classList.add("choose")
            room_id = room.innerHTML
        }
    })
})

function createRoom() {
    let name = $(".user").innerHTML

    fetch("/create_room", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            player_1: name,
            ready_P1: 1,
            player_2: "",
            ready_P2: 0,
        }),
    })
    .then(res => res.json())
    .then(data => {
        console.log(data)
        localStorage.setItem("room_id", name)
        localStorage.setItem("user", name)
        window.location.href = "http://127.0.0.1:5000/human_human"
    })
}

create_room_btn.onclick = () => {
    console.log("abc")
    createRoom()
}

fight_btn.onclick = () => {
    console.log(room_id)
    if(!room_id) return
    let name = $(".user").innerHTML
    console.log("hello")
    fetch("/join_room", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            player_1: room_id,
            player_2: $(".user").innerHTML
        })
    })
    .then(res => res.json())
    .then(data => {
        console.log(data)
        localStorage.setItem("room_id", room_id)
        localStorage.setItem("user", name)
        window.location.href = "http://127.0.0.1:5000/human_human"
    })
}
