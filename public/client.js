let userIsLoggedIn = false;
let sessionData = {}

setInterval(function() {
    let carousel = document.getElementById('artworks-carousel');
    
    if(!carousel) return; // If carousel doesn't exist, do nothing

    if (carousel.scrollWidth - carousel.scrollLeft <= carousel.offsetWidth) {
        carousel.scrollLeft = 0;
    }else{
        carousel.scrollBy({ left: 10, behavior: 'smooth' }); // Scrolls by 10px
    }
    
}, 50); // Change every 50 milliseconds


function changeNavBgColour(){
    if(window.location.pathname !== '/'){
        let header = document.getElementsByTagName('header')[0];
        header.style.backgroundColor = '#f8f7f4';
    }
}

async function registerUser(){
    let username = document.getElementById('username').value;
    let password = document.getElementById('password').value;
    
    if(userIsLoggedIn){
        alert('User already logged in, please log out first');
        return;
    }
    let response = await fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({username: username, password: password}),
    });
    
    if(response.status === 201){
        window.location.href = '/artworks';
    }else{
        const errorText = await response.text();
        console.log(errorText);
        alert(errorText);
    }
}

async function loginUser(){
    let username = document.getElementById('username').value;
    let password = document.getElementById('password').value;

    if(userIsLoggedIn){
        alert('User already logged in, please log out first');
        return;
    }
    let response = await fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({username: username, password: password}),
    });

    if(response.status === 200){
        window.location.href = '/artworks';
    }else if(response.status === 404){
        alert('Username does not exist');
    }else if(response.status === 400){
        alert('Incorrect password');
    }else{
        alert('Error logging in');
    }
}

async function checkSession() {
    try {
        const response = await fetch('/check-session');
        sessionData = await response.json();
        if (sessionData.loggedIn) {
            userIsLoggedIn = true;
            console.log('User is logged in:', sessionData.user);
        } else {
            userIsLoggedIn = false;
            console.log('User is not logged in');
        }
    } catch (error) {
        userIsLoggedIn = false;
        console.error('Error checking session:', error);
    }
}

function goToProfile(){
    if(!userIsLoggedIn){
        alert('Please log in first');
        return;
    }

    console.log(sessionData);
    window.location.href = `/users/${sessionData.user.id}`;
}

async function logoutUser(){
    let response = await fetch('/logout', {
        method: 'GET',
    });

    if(response.status === 200){
        userIsLoggedIn = false;
        window.location.href = '/';
    }else{
        alert('Error logging out');
    }
}

async function likeArtwork(){
    if(!userIsLoggedIn){
        alert('Please log in first');
        return;
    }

    let currentUrl = window.location.href;
    let artworkId = currentUrl.split('/').pop();
    let userId = sessionData.id;

    let response = await fetch(`/artworks/${artworkId}/like`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
       // body: JSON.stringify({userId: userId, id:artworkId}),
    });

    if(response.status === 200){
        window.location.reload();
    }else if(response.status === 400){
        alert('User not logged in');
    }else{
        alert('Error liking artwork');
    }
}

async function unlikeArtwork(){
    if(!userIsLoggedIn){
        alert('Please log in first');
        return;
    }

    let currentUrl = window.location.href;
    let artworkId = currentUrl.split('/').pop();
    let userId = sessionData.id;

    let response = await fetch(`/artworks/${artworkId}/unlike`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if(response.status === 200){
        window.location.reload();
    }else if(response.status === 400){
        alert('User not logged in');
    }else{
        alert('Error liking artwork');
    }
}

async function followUser(){
    if(!userIsLoggedIn){
        alert('Please log in first');
        return;
    }

    let currentUrl = window.location.href;
    let artistId = currentUrl.split('/').pop();
    let targetRoute = currentUrl.split('/')[3];

    let response = await fetch(`/${targetRoute}/${artistId}/follow`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if(response.status === 200){
        window.location.reload();
    }else if(response.status === 400){
        console.log(await response.text());
        alert("User not logged in");
    }else{
        alert('Error following artist');
    }
}

async function unfollowUser(){
    if(!userIsLoggedIn){
        alert('Please log in first');
        return;
    }

    let currentUrl = window.location.href;
    let artistId = currentUrl.split('/').pop();
    console.log(currentUrl.split('/'));
    let targetRoute = currentUrl.split('/')[3];

    let response = await fetch(`/${targetRoute}/${artistId}/unfollow`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if(response.status === 200){
        window.location.reload();
    }else if(response.status === 400){
        alert('User not logged in');
    }else{
        alert('Error following artist');
    }
}


async function createReview(){
    if(!userIsLoggedIn){
        alert('Please log in first');
        return;
    }

    let currentUrl = window.location.href;
    let artworkId = currentUrl.split('/').pop();
    let comment = document.getElementById('review').value;

    let response = await fetch(`/reviews/${artworkId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({comment: comment}),
    });

    if(response.status === 201){
        window.location.reload();
    }else if(response.status === 400){
        alert('User not logged in');
    }else{
        alert('Error creating review');
    }
}

async function deleteReview(reviewId){
    let response = await fetch(`/reviews/${reviewId}`, {
        method: 'DELETE',
    });

    if(response.status === 204){
        window.location.reload();
    }else{
        console.error(response.status, response.statusText);
        alert('Error deleting review');
    }
}

async function createArtwork(){
    if(!userIsLoggedIn){
        alert('Please log in first');
        return;
    }

    let title = document.getElementById('title').value;
    let description = document.getElementById('description').value;
    let category = document.getElementById('category').value;
    let medium = document.getElementById('medium').value;
    let image = document.getElementById('image-url').value;
    let year = document.getElementById('year').value;
    let tags = document.getElementById('tags').value;

    if(title.trim() === '' || description.trim() === '' || category.trim() === '' || medium.trim() === '' || image.trim() === ''){
        alert('Please fill in all fields');
        return;
    }

    if(year < 0 || year > 2023){
        alert('Please enter a valid year');
        return;
    }

    let formData = {
        title: title,
        description: description,
        category: category,
        medium: medium,
        image: image,
        year: year,
        tags: tags,
    }

    let response = await fetch(`/artworks/new`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
    });

    if(response.status === 201){
        const artwork = await response.json();
        window.location.href = `/artworks/${artwork.id}`;
    }else if(response.status === 400){
        alert('User not logged in');
    }else{
        alert('Error creating artwork');
    }
}


async function createWorkshop(){
    if(!userIsLoggedIn){
        alert('Please log in first');
        return;
    }

    let title = document.getElementById('title').value;
    let description = document.getElementById('description').value;

    if(title.trim() === '' || description.trim() === ''){
        alert('Please fill in all fields');
        return;
    }

    let formData = {
        title: title,
        description: description,
    }

    let response = await fetch(`/workshops/new`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
    });

    if(response.status === 201){
        const workshop = await response.json();
        window.location.href = `/workshops/${workshop.id}`;
    }else if(response.status === 400){
        alert('User not logged in');
    }else{
        alert('Error creating workshop');
    }
}

async function enrollInWorkshop(){
    if(!userIsLoggedIn){
        alert('Please log in first');
        return;
    }

    let currentUrl = window.location.href;
    let workshopId = currentUrl.split('/').pop();

    let response = await fetch(`/workshops/${workshopId}/enroll`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if(response.status === 200){
        window.location.reload();
    }else if(response.status === 400){
        alert('User not logged in');
    }else{
        alert('Error enrolling in workshop');
    }
}

async function unEnrollInWorkshop(){
    if(!userIsLoggedIn){
        alert('Please log in first');
        return;
    }

    let currentUrl = window.location.href;
    let workshopId = currentUrl.split('/').pop();

    let response = await fetch(`/workshops/${workshopId}/unenroll`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if(response.status === 200){
        window.location.reload();
    }else if(response.status === 400){
        alert('User not logged in');
    }else{
        alert('Error enrolling in workshop');
    }
}


async function search(event){
    event.preventDefault(); // Prevents the form from submitting traditionally

    let searchTerm = document.getElementById('search-bar').value;

    if(searchTerm.trim() === ''){
        alert('Please enter a search term');
        return;
    }

    window.location.href = `/artworks?q=${encodeURIComponent(searchTerm)}`;
}


function nextPage(){
    const currentUrl = window.location.href;
    const urlParams = new URLSearchParams(new URL(currentUrl).search);
    const page = urlParams.get('page') || 1;
    const q = urlParams.get('q') || '';

    if(page >= 4) return;

    window.location.href = `/artworks?page=${Number(page) + 1}?q=${q}`;
}

function previousPage(){
    const currentUrl = window.location.href;
    const urlParams = new URLSearchParams(new URL(currentUrl).search);
    const page = urlParams.get('page') || 1;
    const q = urlParams.get('q') || '';

    if(page <= 1) return;   
    window.location.href = `/artworks?page=${Number(page) - 1}?q=${q}`;
}

async function switchAccountType(){
    if(!userIsLoggedIn){
        alert('Please log in first');
        return;
    }

    let response = await fetch(`/users/${sessionData.user.id}/switch-account-type`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if(response.status === 200){
        alert('Account type switched');
        window.location.reload();
    }else if(response.status === 400){
        alert('User not logged in');
    }else{
        alert('Error switching account type');
    }
}


function handleNotificationsDropdown() {
    let dropdown = document.querySelector('.dropbtn');
    dropdown.addEventListener('click', function(event) {
        let dropdownContent = document.getElementById('dropdown-content');
        dropdownContent.style.display = dropdownContent.style.display === 'block' ? 'none' : 'block';
        event.stopPropagation();
    });

    document.addEventListener('click', function() {
        document.getElementById('dropdown-content').style.display = 'none';
    });
}

async function getNotifications(){
    if(!userIsLoggedIn){
        alert('Please log in first');
        return;
    }

    let response = await fetch('/get-notifications', {
        method: 'GET',
    });

    if(response.status === 200){
        let notifications = await response.json();
        let dropdownContent = document.getElementById('dropdown-content');
        let notificationList = document.getElementById('notification-list');
        notificationList.innerHTML = '';

        if(notifications.length === 0){
            let noNotifications = document.createElement('p');
            noNotifications.innerHTML = 'No notifications';
            notificationList.appendChild(noNotifications);
        }else{
            notifications.forEach(notification => {
                let notificationItem = document.createElement('a');
                notificationItem.href = notification.link;
                notificationItem.innerHTML = notification.message;
                notificationList.appendChild(notificationItem);
            });
        }

    }M
}
document.addEventListener('DOMContentLoaded', (event) => {
    checkSession();
    changeNavBgColour();
});
