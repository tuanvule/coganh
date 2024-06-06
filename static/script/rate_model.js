const $ = document.querySelector.bind(document)
const $$ = document.querySelectorAll.bind(document)

function createRateModel(rate_dom, data) {
    let doom_main = $(rate_dom)
    let doom_main_$ = doom_main.querySelector.bind(doom_main)
    let doom_main_$$ = doom_main.querySelectorAll.bind(doom_main)
    doom_main_$(".ske_loading").style.display = "none"
    doom_main_$(".loader").style.display = "none"
    return ({
        doom_img_loader: doom_main_$(".img_list"),
        doom_img_item: null,
        arrow_left: doom_main_$(".arrow_left"),
        arrow_right: doom_main_$(".arrow_right"),
        doom_rate_item: null,
        doom_img_counter: doom_main_$(".counter"),
        doom_player_you: doom_main_$(".player.you .content"),
        doom_player_enemy: doom_main_$(".player.enemy .content"),
        cur_img: 0,
        move_count: 0,

        get_rate_list_detail() {
            return doom_main_$(".rate_list .detail")
        },

        get_rate_item: function(index) {
            const rate_item = doom_main_$$(".rate_item")
            if(index) {
                return rate_item[index]
            }
            return rate_item
        },

        render(side) {
            const rate_list_detail = this.get_rate_list_detail()
            let type_count = [
                {
                    "Tốt nhất": 0,
                    "Tốt": 0,
                    "Bình thường": 0,
                    "Tệ": 0,
                },
                {
                    "Tốt nhất": 0,
                    "Tốt": 0,
                    "Bình thường": 0,
                    "Tệ": 0,
                }
            ]

            this.move_count = data.length

            doom_main_$(".move_count").innerHTML = `MOVE: ${this.move_count}`
            if(side === 1) {
                this.doom_player_you.classList.add("blue")
                this.doom_player_enemy.classList.add("red")
            } else {
                this.doom_player_enemy.classList.add("blue")
                this.doom_player_you.classList.add("red")
            }

            data.forEach((rate,i) => {
                let res = {
                    type: "",
                    icon: ""
                }

                type_count[i % 2 === 0 ? 0 : 1][rate.type]++
                if (rate.type === "Tốt nhất") {
                    res.type = rate.type
                    res.icon = `<img class="rate_item-you_img" src="../static/img/brilliant_icon.png" alt="">`
                } else if(rate.type === "Tệ") {
                    res.icon = `<img class="rate_item-you_img" src="../static/img/bad_icon.png" alt="">`
                    res.type = rate.type
                } else if(rate.type === "Tốt") {
                    res.icon = `<img class="rate_item-you_img" src="../static/img/good_icon.png" alt="">`
                    res.type = rate.type
                }

                if(side === 1) {
                    rate_list_detail.innerHTML += `
                        <li class="rate_item">
                            <div class="rate_item-you">${i % 2 === 0 ? res.icon + res.type : ""}</div>
                            <div class="rate_item-move">${rate.move.sellected_pos + " => " + rate.move.new_pos}</div>
                            <div class="rate_item-opp">${i % 2 !== 0 ? res.type + res.icon : ""}</div>
                        </li>
                    `
                } else {
                    rate_list_detail.innerHTML += `
                        <li class="rate_item">
                            <div class="rate_item-you">${i % 2 !== 0 ? res.icon + res.type : ""}</div>
                            <div class="rate_item-move">${rate.move.sellected_pos + " => " + rate.move.new_pos}</div>
                            <div class="rate_item-opp">${i % 2 === 0 ? res.type + res.icon : ""}</div>
                        </li>
                    `
                }

                this.doom_img_loader.innerHTML += `
                    <li style="display: none;" class="img_item default"><img src=${rate.img_url} alt=""></li>
                `
            });

            const overview = doom_main_$(".overview")

            if(side === -1) type_count = type_count.reverse()

            for(let i = 0; i < 4; i++) {
                if(i === 0) {
                    overview.innerHTML += `
                        <li class="excellent_count">
                            <div class="excellent_count-you">${type_count[0]["Tốt nhất"]}</div>
                            <div class="excellent_count-title excellent">TỐT NHẤT</div>
                            <div class="excellent_count-opp">${type_count[1]["Tốt nhất"]}</div>
                        </li>
                    `
                }
                if(i === 1) {
                    overview.innerHTML += `
                        <li class="excellent_count">
                            <div class="excellent_count-you">${type_count[0]["Tốt"]}</div>
                            <div class="excellent_count-title good">TỐT</div>
                            <div class="excellent_count-opp">${type_count[1]["Tốt"]}</div>
                        </li>
                    `
                }
                if(i === 2) {
                    overview.innerHTML += `
                        <li class="excellent_count">
                            <div class="excellent_count-you">${type_count[0]["Bình thường"]}</div>
                            <div class="excellent_count-title normal">BÌNH THƯỜNG</div>
                            <div class="excellent_count-opp">${type_count[1]["Bình thường"]}</div>
                        </li>
                    `
                }
                if(i === 3) {
                    overview.innerHTML += `
                        <li class="excellent_count">
                            <div class="excellent_count-you">${type_count[0]["Tệ"]}</div>
                            <div class="excellent_count-title bad">TỆ</div>
                            <div class="excellent_count-opp">${type_count[1]["Tệ"]}</div>
                        </li>
                    `
                }
            }
            this.doom_img_item = doom_main_$$(".img_item")
            this.doom_rate_item = doom_main_$$(".rate_item")
        },

        toggle_rate(preI, newI) {
            this.doom_rate_item[preI-1]?.classList.toggle("sellected")
            this.doom_rate_item[newI-1]?.classList.toggle("sellected")
            this.scrollToView(this.doom_rate_item[newI-1])
        },

        tonggle_img(preI, newI) {
            if(newI < 0) {
                newI = this.doom_img_item.length - 1
                this.cur_img = newI + 1
                this.tonggle_img(preI, newI)
                return
            } else if(newI > this.doom_img_item.length - 1) {
                newI = 0
                this.cur_img = newI - 1
                this.tonggle_img(preI, newI)
                return
            }
            if(newI >= 0 && newI <= this.doom_img_item.length - 1) {
                // console.log(this.doom_rate_item)
                this.doom_img_counter.innerHTML = newI
                this.doom_img_item[preI].style.display = "none"
                this.doom_img_item[newI].style.display = "block"
                this.toggle_rate(preI, newI)
            }

            // if(newI <= 0) {
            //     this.arrow_left.classList.add("hide")
            // } else {
            //     this.arrow_left.classList.remove("hide")
            // }

            // if(newI === this.doom_img_item.length - 1) {
            //     this.arrow_right.classList.add("hide")
            // } else {
            //     this.arrow_right.classList.remove("hide")
            // }
        },

        scrollToView(element) {
            if(!element) return
            setTimeout(() => {
                element.scrollIntoView({
                    behavior: "smooth",
                    block: "nearest",
                })
            }, 200)
        },

        handle_event() {
            this.arrow_left.onclick = () => {
                this.tonggle_img(this.cur_img, this.cur_img - 1)
                this.cur_img--
            }
            this.arrow_right.onclick = () => {
                this.tonggle_img(this.cur_img, this.cur_img + 1)
                this.cur_img++
                
            }
            this.doom_rate_item.forEach((item, i) => {
                item.onclick = () => {
                    this.tonggle_img(this.cur_img, i+1)
                    this.cur_img = i + 1
                }
            })
            document.onkeyup = (e) => {
                if(e.code === "ArrowUp" || e.code === "KeyW") {
                    this.tonggle_img(this.cur_img, this.cur_img - 1)
                    this.cur_img--
                } else if(e.code === "ArrowDown" || e.code === "KeyS") {
                    this.tonggle_img(this.cur_img, this.cur_img + 1)
                    this.cur_img++
                }
            }
        },

        start(side=1) {
            this.render(side)
            this.handle_event()
        }
    })
    
}