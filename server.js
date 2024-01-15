const express = require('express');
const app = express();


const session = require('express-session'); // Import session middleware

const mongoose = require('mongoose');
const port = process.env.PORT || 3000;
const mongo_url = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/term_project"

const { User, Artwork, Review, Workshop } = require('./database/models.js');

const { getNArtworks, getArtworkById, createArtwork, getArtworksByArtistId, createUser, createArtist, getUserById, getUserByUsername, deleteUser, likeArtwork, checkIfLiked, unlikeArtwork, followUser, unFollowUser, checkIfFollowing, createReview, deleteReview, getReviewById, createWorkshop, enrollInWorkshop, getWorkShopById, unEnrollFromWorkshop, getArtworkByText, addNotifications } = require('./database/databaseHelpers.js');

const { send404, send400, send500, send201, send200, send204, registerUser, generateRandomString, login } = require('./serverHelpers.js');

app.use(express.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(session({
    secret: generateRandomString(20),
    resave: false, //no need to save the session in session store if nothing is modified
    saveUninitialized: false, 
    cookie: { secure: false, httpOnly:true }, //since this will be a local app, we don't need to set secure to true
}))



mongoose.connect(mongo_url).then(async () => {
    console.log('Connected to database');
    app.listen(port, () => {
        console.log(`Listening on port ${port}`);
    });
})
.catch((err) => {
    console.log(err);
    throw err;
});


app.get('/', async (req, res) => {
    // const artworks = await getNArtworks(10);
    const artworks = await getArtworkByText('', 0, 10);
    console.log(artworks);
    let notifications = [];

    if(req.session.isLoggedIn){
        const userId = req.session.user.id;
        const user = await getUserById(userId);
        notifications = user.notifications;
    }

    console.log(notifications);
    res.render('pages/home', { artworks: artworks, isLoggedIn: req.session.isLoggedIn, notifications: notifications});
})

app.get('/login', async (req, res) => {
    let notifications = [];
    res.render('pages/login', { isLoggedIn: req.session.isLoggedIn, notifications: notifications});
})

app.post('/login', async (req, res) => {
    try {
        if(req.session.isLoggedIn){ //prevent logged in users from logging in again
            send400(res, 'User already logged in');
            return;
        }
        
        const user = await login(req.body);
        req.session.user = { id: user._id, username: user.username };
        req.session.isLoggedIn = true;
        send200(res, `User ${user.username} logged in successfully`);
    } catch (error) {
        console.log(error);
        if(error.message === 'User not found'){
            send404(res);
        }else if(error.message === 'Incorrect password'){
            send400(res);
        }else{
            send500(res, error.message);
        }
    }
})


app.get('/register', async (req, res) => {
    res.render('pages/register', { isLoggedIn: req.session.isLoggedIn, notifications: []});
})

app.post('/register', async (req, res) => {
    try {
        if(req.session.isLoggedIn){ //prevent logged in users from registering
            send400(res, 'User already logged in');
            return;
        } 
        const newUser = await registerUser(req.body);
        req.session.user = { id: newUser._id, username: newUser.username };
        req.session.isLoggedIn = true;
        send201(res, `User ${newUser.username} created successfully`);
    } catch (error) {
        console.log(error);
        send500(res, error.message);
    }
})

app.get('/logout', async (req, res) => {
    req.session.destroy(); // Destroy session
    res.redirect('/');
})

app.get('/artworks', async (req, res) => {
    // const artworks = await getNArtworks();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const query = req.query.q || '';
    console.log(req.query);
    console.log(query);
    const artworks = await getArtworkByText(query, skip, limit);

    let notifications = [];

    if(req.session.isLoggedIn){
        const userId = req.session.user.id;
        const user = await getUserById(userId);
        notifications = user.notifications;
    }
    res.render('pages/artworks', { artworks: artworks, isLoggedIn: req.session.isLoggedIn, notifications: notifications });
})

app.get('/artworks/new', async (req, res) => {

    let notifications = [];
    if(req.session.isLoggedIn){
        const userId = req.session.user.id;
        const user = await getUserById(userId);
        notifications = user.notifications;
        res.render('pages/newArtwork', { isLoggedIn: req.session.isLoggedIn, notifications: notifications });
    }else{
        res.redirect('/login');
    }
})

app.post('/artworks/new', async (req, res) => {
    try {
        if(!req.session.isLoggedIn){
            send400(res, 'User not logged in');
            return;
        }

        const artwork = {
            title: req.body.title,
            artist: req.session.user.id,
            description: req.body.description,
            category: req.body.category,
            medium: req.body.medium,
            image: req.body.image,
            tags: req.body.tags.split(','),
            reviews: [],
            dateTime: new Date(),
            likes: [],
            year: Number(req.body.year),
        }

        const artistId = req.session.user.id;
        const newArtwork = await createArtwork(artistId, artwork);
        //send201(res, artwork);

        const artist = await getUserById(artistId);

        addNotifications(artistId, { message: `Your artwork ${artwork.title} has been created`, link: `/artworks/${newArtwork._id}` });

        for(let i = 0; i < artist.followers.length; i++){
            addNotifications(artist.followers[i], { message: `A new artwork called ${artwork.title} has been created by ${artist.username}`, link: `/artworks/${newArtwork._id}` });
        }

        res.status(201).json({id:newArtwork._id});
        //res.redirect(`/artworks/${newArtwork._id}`);
    } catch (error) {
        if(error.message === 'An artwork with the title already exists.'){
            send400(res, error.message);
        }else{
            send500(res, error.message);
        }
    }
});

app.get('/artworks/:id', async (req, res) => {
    let notifications = [];
    const artwork = await getArtworkById(req.params.id);
    if(artwork){
        if(req.session.isLoggedIn){
            const artworkId = req.params.id;
            const userId = req.session.user.id;
            const artistId = artwork.artist._id;
            let user = await getUserById(userId);
            notifications = user.notifications;
            const hasLiked = await checkIfLiked(artworkId, userId);
            const isFollowing = await checkIfFollowing(userId, artistId);
            
            console.log(user);
            console.log(notifications);
            res.render('pages/artwork', { artwork: artwork, isLoggedIn: req.session.isLoggedIn, hasLiked: hasLiked, isFollowing: isFollowing, userId: userId, notifications: notifications });  
        }else{
            res.render('pages/artwork', { artwork: artwork, isLoggedIn: req.session.isLoggedIn, hasLiked: false, isFollowing: false, userId: null, notifications: notifications });  
        }
    }else {
        send404(res);
    }
})

app.get('/artists', async (req, res) => {
    let notifications = [];
    if(req.session.isLoggedIn){
        const userId = req.session.user.id;
        const user = await getUserById(userId);
        notifications = user.notifications;
    }
    const artists = await User.find({ isArtist: true });
    res.render('pages/artists', { artists: artists, isLoggedIn: req.session.isLoggedIn, notifications: notifications });
})

app.get('/users/:id', async (req, res) => {
    
    let isFollowing = false;
    const user = await getUserById(req.params.id);
    console.log(user);
    let notifications = [];
    
    const currentUserId = req.session.user ? req.session.user.id : null;
    if(currentUserId){
        isFollowing = await checkIfFollowing(currentUserId, req.params.id);
        notifications = user.notifications;
    }
    if (user) {
        res.render('pages/user', { user: user, isLoggedIn: req.session.isLoggedIn, isArtist: user.isArtist, userId: currentUserId, isFollowing: isFollowing, notifications: notifications  }); 
    } else {
        send404(res);
    }
})

app.put('/artworks/:id/like', async (req, res) => {
    try {
        if(!req.session.isLoggedIn){
            send400(res, 'User not logged in');
            return;
        }
        const artwork = await likeArtwork(req.params.id, req.session.user.id);
        send200(res);
    } catch (error) {
        console.log(error);
        send500(res, error.message);
    }
});

app.put('/artworks/:id/unlike', async (req, res) => {
    try {
        if(!req.session.isLoggedIn){
            send400(res, 'User not logged in');
            return;
        }
        const artwork = await unlikeArtwork(req.params.id, req.session.user.id);
        send200(res);
    } catch (error) {
        console.log(error);
        send500(res, error.message);
    }
});

app.put('/users/:id/follow', async (req, res) => { // Follow artist from artist page
    try {
        if(!req.session.isLoggedIn){
            send400(res, 'User not logged in');
            return;
        }
        
        const artistId = req.params.id;
        const userId = req.session.user.id;

        const artist = await getUserById(artistId);
        if(!artist){
            send404(res, 'Artist not found');
            return;
        }

        if(artistId === userId){ // Prevent self-follow
            send400(res, 'User cannot follow themselves');
            return;
        }

        await followUser(userId, artistId);
        console.log('followed user');
        send200(res);
    } catch (error) {
        console.log(error);
        send500(res, error.message);
    }
});

app.put('/artworks/:id/follow', async (req, res) => { // Follow artist from artwork page
    try {
        if (!req.session.isLoggedIn) {
            send400(res, 'User not logged in');
            return;
        }

        const artworkId = req.params.id;
        const userId = req.session.user.id;

        const artwork = await getArtworkById(artworkId);
        if (!artwork) {
            send404(res, 'Artwork not found');
            return;
        }

        const artistId = artwork.artist._id;
        
        // Prevent self-follow
        if (artistId === userId) {
            send400(res, 'User cannot follow themselves');
            return;
        }

        await followUser(userId, artistId);
        console.log('followed artist from artwork');
        send200(res);
    } catch (error) {
        console.log(error);
        send500(res, error.message);
    }
});


app.put('/users/:id/unfollow', async (req, res) => {
    try {
        if(!req.session.isLoggedIn){
            send400(res, 'User not logged in');
            return;
        }

        const artistId = req.params.id;
        const userId = req.session.user.id;

        const artist = await getUserById(artistId);
        if(!artist){
            send404(res, 'Artist not found');
            return;
        }

        if(artistId === userId){ // Prevent self-unfollow
            send400(res, 'User cannot unfollow themselves');
            return;
        }

        const user = await unFollowUser(userId, artistId);
        send200(res);
    } catch (error) {
        console.log(error);
        send500(res, error.message);
    }
});

app.put('/artworks/:id/unfollow', async (req, res) => { // Unfollow artist from artwork page
    try {
        if (!req.session.isLoggedIn) {
            send400(res, 'User not logged in');
            return;
        }

        const artworkId = req.params.id;
        const userId = req.session.user.id;

        const artwork = await getArtworkById(artworkId);
        if (!artwork) {
            send404(res, 'Artwork not found');
            return;
        }

        const artistId = artwork.artist._id;

        // Prevent self-unfollow
        if (artistId === userId) {
            send400(res, 'User cannot unfollow themselves');
            return;
        }

        const user = await unFollowUser(userId, artistId);
        send200(res);
    } catch (error) {
        console.log(error);
        send500(res, error.message);
    }
});

app.post('/reviews/:id', async (req, res) => {
    try {
        if(!req.session.isLoggedIn){
            send400(res, 'User not logged in');
            return;
        }

        const artworkId = req.params.id;
        const userId = req.session.user.id;
        const comment = req.body.comment;

        const artwork = await getArtworkById(artworkId);
        if(!artwork){
            send404(res, 'Artwork not found');
            return;
        }

        const review = await createReview(userId, artworkId, comment);
        
        
        res.status(201).json(review);
    } catch (error) {
        console.log(error);
        send500(res, error.message);
    }
});

app.delete('/reviews/:id', async (req, res) => {
    try {
        if(!req.session.isLoggedIn){
            send400(res, 'User not logged in');
            return;
        }

        const reviewId = req.params.id;
        const userId = req.session.user.id;

        const review = await getReviewById(reviewId);
        if(!review){
            send404(res, 'Review not found');
            return;
        }

        
        if(review.patron._id.toString() !== userId.toString()){ // Prevent user from deleting another user's review
            console.log('User cannot delete another user\'s review');
            send400(res, 'User cannot delete another user\'s review');
            return;
        }

        await deleteReview(reviewId);
        send204(res);
    } catch (error) {
        console.log(error);
        send500(res, error.message);
    }
});

app.get('/workshops/new', async (req, res) => {
    let notifications = [];
    if(req.session.isLoggedIn){
        const userId = req.session.user.id;
        const user = await getUserById(userId);
        notifications = user.notifications;
        res.render('pages/newWorkshop', { isLoggedIn: req.session.isLoggedIn, userId: userId, notifications: notifications });
    }else{
        res.redirect('/login');
    }
})
app.post('/workshops/new', async (req, res) => {
    try {
        if(!req.session.isLoggedIn){
            send400(res, 'User not logged in');
            return;
        }

        const userId = req.session.user.id;
        const workshop = {
            title: req.body.title,
            artist: userId,
            description: req.body.description,
            enrolledUsers: [],
        }

        const newWorkshop = await createWorkshop(userId, workshop);
        res.status(201).json({id:newWorkshop._id});
    } catch (error) {
        console.log(error);
        send500(res, error.message);
    }
})

app.put('/workshops/:id/enroll', async (req, res) => {
    try {
        if(!req.session.isLoggedIn){
            send400(res, 'User not logged in');
            return;
        }

        const workshopId = req.params.id;
        const userId = req.session.user.id;
        
        await enrollInWorkshop(workshopId, userId);
        addNotifications(userId, { message: `You have enrolled in a workshop`, link: `/workshops/${workshopId}` })
        send200(res);
    } catch (error) {
        console.log(error);
        send500(res, error.message);
    }
})

app.put('/workshops/:id/unenroll', async (req, res) => {
    try {
        if(!req.session.isLoggedIn){
            send400(res, 'User not logged in');
            return;
        }

        const workshopId = req.params.id;
        const userId = req.session.user.id;

        await unEnrollFromWorkshop(workshopId, userId);
        send200(res);
    } catch (error) {
        console.log(error);
        send500(res, error.message);
    }
})

app.get('/workshops/:id', async (req, res) => {
    console.log('workshop id');
    console.log(req.params.id);
    const workshop = await getWorkShopById(req.params.id);
    const userId = req.session.user ? req.session.user.id : null;
    let notifications = [];
    if(req.session.isLoggedIn){
        //userId = req.session.user.id;
        const user = await getUserById(userId);
        notifications = user.notifications;
    }
    console.log(userId);
    console.log(workshop);
    if(workshop){
        res.render('pages/workshop', { workshop: workshop, isLoggedIn: req.session.isLoggedIn, userId: userId, notifications: notifications });
    }else{
        send404(res);
    }
})
app.get('/check-session', (req, res) => { // Check if user is logged in using session
    if (req.session && req.session.user) {
        res.json({ loggedIn: true, user: req.session.user });
    } else {
        res.json({ loggedIn: false });
    }
});


app.put('/users/:id/switch-account-type', async (req, res) => {
    try {
        if(!req.session.isLoggedIn){
            send400(res, 'User not logged in');
            return;
        }

        const userId = req.params.id;
        const user = await getUserById(userId);
        if(!user){
            send404(res, 'User not found');
            return;
        }

        if(user.isArtist){
            await User.findByIdAndUpdate(userId, { isArtist: false });
        }else{
            await User.findByIdAndUpdate(userId, { isArtist: true });
        }
        send200(res);
    } catch (error) {
        console.log(error);
        send500(res, error.message);
    }
})


app.get('/get-notifications', async (req, res) => {
    try {
        if(!req.session.isLoggedIn){
            send400(res, 'User not logged in');
            return;
        }
        const userId = req.session.user.id;
        const user = await getUserById(userId);
        const notifications = user.notifications;
        send200(res, notifications);
    } catch (error) {
        console.log(error);
        send500(res, error.message);
    }
})

app.get('*', (req, res) => {
    res.render('pages/404', { isLoggedIn: req.session.isLoggedIn, notifications: [] });
})