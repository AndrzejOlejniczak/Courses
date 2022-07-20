const postBox = document.getElementById('posts-box')
const spinnerBox = document.getElementById('spinner-box')
const loadBtn = document.getElementById('load-btn')
const endBox = document.getElementById('end-box')

const postForm = document.getElementById('post-form')
const formTitle = document.getElementById('id_title')
const formBody = document.getElementById('id_body')
const csrf = document.getElementsByName('csrfmiddlewaretoken')
console.log(csrf)

const dropzone = document.getElementById('my-dropzone')
const addBtn= document.getElementById('add-btn')
const closeBtns = [...document.getElementsByClassName('add-modal-close')]

const url = window.location.href
console.log(url)

const alertBox = document.getElementById('alert-box')



let visible = 3

const getCookie = (name) => {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
const csrftoken = getCookie('csrftoken');

const postDeleted = localStorage.getItem('title')
if (postDeleted){
    handleAlerts('danger', `deleted "${postDeleted}"`)
    localStorage.clear()
}

const likeUnlikePosts = ()=> {
    const likeUnlikeForms = [... document.getElementsByClassName('like-unlike-forms')]
    likeUnlikeForms.forEach(form=> form.addEventListener('submit', e=>{
        e.preventDefault()
        const clickedId = e.target.getAttribute('data-form-id')
        const clickedBtn = document.getElementById(`like-unlike-${clickedId}`)

        $.ajax({
            type: 'POST',
            url: "/like-unlike/", 
            data: {
                'csrfmiddlewaretoken': csrftoken,
                'pk': clickedId,
            },
            success: function(response) {
                console.log(response)
                clickedBtn.textContent = response.liked ? `Unlike (${response.count})`: `Like (${response.count})`
            },
            error: function(error) {
                console.log(error)
            }, 
        })
    }))
}

const getData = () => {
    $.ajax({
        type: 'GET',
        url: `/data/${visible}`,
        success: function(response){
            console.log(response)
            const data = response.data
            setTimeout(()=> {
                spinnerBox.classList.add('not-visible')
                console.log(data)
                data.forEach(el => {
                    postBox.innerHTML += `
                        <div class="card mb-2" >
                            <div class="card-body">
                                <h5 class="card-title">${el.title}</h5>
                                <p class="card-text">${el.body}</p>
                            </div>
                            <div class="card-footer">
                                <div class="row">
                                    <div class="col-1">
                                        <a href="${url}${el.id}" class="btn btn-primary">Details</a>
                                    </div>
                                    <div class="col-1">
                                        <form class="like-unlike-forms" data-form-id="${el.id}">
                                            <button href="#" class="btn btn-primary" id="like-unlike-${el.id}">${el.liked ? `Unlike (${el.count})`: `Like (${el.count})`}</button>

                                        </form>
                                    </div>
                                </div>
                                
                            </div>
                        </div>
                        `
                });
                likeUnlikePosts()
            }, 100)
            console.log(response.size)
            if (response.size === 0) {
                endBox.textContent = 'No posts added yet'
            }
            else if (response. size <= visible) {
                loadBtn.classList.add('not-visisble')
                endBox.textContent = 'No more posts to load'
            }
        },
        error: function(error){
            console.log(error)
        }
    });
}

let newPostId = null
postForm.addEventListener('submit', e=> {
    e.preventDefault()

    $.ajax({
        type: 'POST',
        url: '',
        data: {
            'csrfmiddlewaretoken': csrf[0].value,
            'title': formTitle.value,
            'body': formBody.value,
        },
        success: function(response){
            console.log(response)
            newPostId = response.id
            postBox.insertAdjacentHTML('afterbegin', ` 
                <div class="card mb-2" >
                    <div class="card-body">
                        <h5 class="card-title">${response.title}</h5>
                        <p class="card-text">${response.body}</p>
                    </div>
                    <div class="card-footer">
                        <div class="row">
                            <div class="col-1">
                                <button href="${url}${response.id}" class="btn btn-primary">Details</button>
                            </div>
                            <div class="col-1">
                                <form class="like-unlike-forms" data-form-id="${response.id}">
                                    <button href="#" class="btn btn-primary" id="like-unlike-${response.id}">Like</button>

                                </form>
                            </div>
                        </div>
                        
                    </div>
                </div>               
            `)
            likeUnlikePosts()
            // $('#addPostModal').modal('hide')
            handleAlerts('success', 'New post added')
            // postForm.reset()
        },
        error: function(error){
            console.log(error)
            handleAlerts('danger', 'Something went wrong') 
        }
    })
})

loadBtn.addEventListener('click', ()=>{
    spinnerBox.classList.remove('not-visible')
    visible += 3
    getData()
})

addBtn.addEventListener('click', ()=>{
    dropzone.classList.remove('not-visible')
})

closeBtns.forEach(btn => btn.addEventListener('click', ()=>{
    postForm.reset()
    if (!dropzone.classList.contains('not-visible')) {
        dropzone.classList.add('not-visible')
    }
}))

Dropzone.autoDiscover = false
const myDropzone = new Dropzone('#my-dropzone', {
    url: 'upload/',
    init: function() {
        this.on('sending', function(file, xhr, formData) {
            formData.append('csrfmiddlewaretoken', csrftoken)
            formData.append('new_post_id', newPostId)
        })
    },
    maxFiles: 5,
    maxFilesize: 4,
    acceptedFiles: '.png, .jpg, .jpeg',

})

getData()