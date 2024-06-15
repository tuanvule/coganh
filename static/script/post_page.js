const $ = document.querySelector.bind(document)
const $$ = document.querySelectorAll.bind(document)

const post_item = $$(".posts_item")

post_item.forEach((item) => {
    const id = item.querySelector(".review_title").dataset.id
    item.onclick = () => {
        console.log(`/post/${id}`)
        fetch(`/get_post/${id}`)
        .then(res => res.json())
        .then(data => {
            console.log(data)
        })
        .catch(err => {
            // window.location.href = `http://127.0.0.1:5000/post`
        })
    }
})
