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

        render() {
            const rate_list_detail = this.get_rate_list_detail()
            let type_count = [
                {
                    "Tốt nhất": 0,
                    "Bình thường": 0,
                    "Tệ": 0,
                },
                {
                    "Tốt nhất": 0,
                    "Bình thường": 0,
                    "Tệ": 0,
                }
            ]

            this.move_count = data.length

            doom_main_$(".move_count").innerHTML = `MOVE: ${this.move_count}`

            data.forEach((rate,i) => {
                // if(rate.type !== "good") {
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
                }
                rate_list_detail.innerHTML += `
                    <li class="rate_item">
                        <div class="rate_item-you">${i % 2 === 0 ? res.icon + res.type : ""}</div>
                        <div class="rate_item-move">${rate.move.sellected_pos + " => " + rate.move.new_pos}</div>
                        <div class="rate_item-opp">${i % 2 !== 0 ? res.type + res.icon : ""}</div>
                    </li>
                `
                this.doom_img_loader.innerHTML += `
                    <li style="display: none;" class="img_item default"><img src=${rate.img_url} alt=""></li>
                `
            });

            const overview = doom_main_$(".overview")

            for(let i = 0; i < 3; i++) {
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
                            <div class="excellent_count-you">${type_count[0]["Bình thường"]}</div>
                            <div class="excellent_count-title good">BÌNH THƯỜNG</div>
                            <div class="excellent_count-opp">${type_count[1]["Bình thường"]}</div>
                        </li>
                    `
                }
                if(i === 2) {
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
            // this.doom_rate_item[0].classList.add("sellected")
        },

        toggle_rate(preI, newI) {
            this.doom_rate_item[preI-1]?.classList.toggle("sellected")
            this.doom_rate_item[newI-1].classList.toggle("sellected")
        },

        tonggle_img(preI, newI) {
            if(newI >= 0 && newI <= this.doom_img_item.length - 1) {
                // console.log(this.doom_rate_item)
                this.doom_img_counter.innerHTML = newI
                this.doom_img_item[preI].style.display = "none"
                this.doom_img_item[newI].style.display = "block"
                this.toggle_rate(preI, newI)
            }

            if(newI <= 0) {
                this.arrow_left.classList.add("hide")
            } else {
                this.arrow_left.classList.remove("hide")
            }

            if(newI === this.doom_img_item.length - 1) {
                this.arrow_right.classList.add("hide")
            } else {
                this.arrow_right.classList.remove("hide")
            }
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
                    this.tonggle_img(this.cur_img, i)
                    this.cur_img = i
                }
            })
            document.onkeyup = (e) => {
                console.log(e)
                if(e.code === "ArrowUp" || e.code === "KeyW") {
                    this.tonggle_img(this.cur_img, this.cur_img - 1)
                    this.cur_img--
                } else if(e.code === "ArrowDown" || e.code === "KeyS") {
                    this.tonggle_img(this.cur_img, this.cur_img + 1)
                    this.cur_img++
                }
            }
        },

        start() {
            this.render()
            this.handle_event()
        }
    })
    
}