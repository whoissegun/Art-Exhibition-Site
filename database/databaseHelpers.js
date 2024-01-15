const {User, Artwork, Review, Workshop} = require('./models');

async function getNArtworks(n = -1) {
    
    if(n == -1){ //get all artworks
        const artworks = await Artwork.find();
        return artworks;
    }
    const artworks = await Artwork.find().limit(n);
    return artworks;
}



async function getArtworkByText(query, skip, limit) {
    let searchQuery = query.trim() ? { $text: { $search: query } } : {}; // Use an empty object if query is empty

    const artworks = await Artwork.find(searchQuery)
                                  .skip(skip)
                                  .limit(limit);

    

    return artworks;
}



async function getArtworksByArtistId(artistId) {
    const artworks = await Artwork.find({artist: artistId});
    return artworks;
}

async function getArtworkById(artworkId) {
    const artwork = await Artwork.findById(artworkId)
        .populate('artist')
        .populate({
            path: 'reviews',
            // Populate fields in the Review model here
            populate: {
                path: 'patron',
                model: 'User' // Replace 'ModelName' with the actual model name of the populated field
            }
        });

    return artwork;
}


async function createArtwork(artistId, artwork) {
    try{
        
        const newArtwork = new Artwork(artwork);
        
        let artist = await User.findByIdAndUpdate(artistId, { $push: { artworks: newArtwork._id } });
        await newArtwork.save();
        return newArtwork;
    }catch(error){
        if(error.code === 11000){
            throw new Error(`An artwork with the title already exists.`);
        }else{
            throw new Error('Error creating artwork: ' + error.message);
        }
    }
}

async function createUser(user) {
    try {
        const newUser = new User(user);
        await newUser.save();
        return newUser;
    } catch (error) {
        if (error.code === 11000) { // MongoDB duplicate key error code
            throw new Error(`A user with the username '${user.username}' already exists.`);
        } else {
            throw new Error('Error creating user: ' + error.message);
        }
    }
}

async function loginUser(user){
    try{
        const userInDb = await getUserByUsername(user.username);
        
        if(userInDb.length === 0){
            throw new Error('User not found');
        }
        if(userInDb[0].password !== user.password){
            throw new Error('Incorrect password');
        }
        return userInDb[0];
    }catch(error){
        throw error;
    }
}


async function createArtist(userId){
    const artist = await User.findByIdAndUpdate(userId, {isArtist: true});
    return artist;
}

async function getUserById(userId) {
    const user = await User.findById(userId).populate('likedArtworks').populate('following').populate('followers').populate('reviewedArtworks').populate('artworks').populate('workshops').populate('likedArtworks')
    return user;
}

async function getUserByUsername(username){
    const user = await User.find({username: username});
    return user;
}

async function deleteUser(userId) {
    await User.findByIdAndDelete(userId);
}

async function likeArtwork(artworkId, userId) {
    try{
        await User.findByIdAndUpdate(userId, { $push: { likedArtworks: artworkId } });
        await Artwork.findByIdAndUpdate(artworkId, { $push: { likes: userId } });
    }catch(error){
        throw error;
    }
}

async function unlikeArtwork(artworkId, userId) {
    try{
        await User.findByIdAndUpdate(userId, { $pull: { likedArtworks: artworkId } });
        await Artwork.findByIdAndUpdate(artworkId, { $pull: { likes: userId } });
    }
    catch(error){
        throw error;
    }
}

async function checkIfLiked(artworkId, userId){
    const artwork = await Artwork.findById(artworkId);
    const likes = artwork.likes;
    if(likes.includes(userId)){
        return true;
    }
    return false;
}

async function followUser(userId, artistId){
    try{
        const isFollowing = await checkIfFollowing(userId, artistId);
        if(isFollowing){
            throw new Error('User is already following artist');
        }
        await User.findByIdAndUpdate(userId, { $push: { following: artistId } });
        await User.findByIdAndUpdate(artistId, { $push: { followers: userId } });
    }catch(error){
        throw error;
    }
}

async function unFollowUser(userId, artistId){
    try{
        const isFollowing = await checkIfFollowing(userId, artistId);
        if(!isFollowing){
            throw new Error('User is not following artist');
        }
        await User.findByIdAndUpdate(userId, { $pull: { following: artistId } });
        await User.findByIdAndUpdate(artistId, { $pull: { followers: userId } });
    }catch (err){
        throw err;
    }
}

async function checkIfFollowing(userId, artistId){
    try{
        
        const user = await User.findById(userId);
        let following = [];
        
        if(user){
            following = user.following
        }else{
            console.log('User not found');
            throw new Error('User not found');
        }
        if(following.includes(artistId)){
            return true;
        }

        return false;
    }catch (error){
        throw error;
    }
}

async function createReview(userId, artworkId, comment){
    try{
        const newReview = new Review({artwork: artworkId, patron: userId, comment: comment});
        await newReview.save();
        await Artwork.findByIdAndUpdate(artworkId, { $push: { reviews: newReview._id } });
        await User.findByIdAndUpdate(userId, { $push: { reviewedArtworks: newReview._id } });
        return newReview;
    }catch(error){
        throw error;
    }
}

async function deleteReview(reviewId){
    try{
        const review = await Review.findByIdAndDelete(reviewId);
        await Artwork.findByIdAndUpdate(review.artwork, { $pull: { reviews: reviewId } });
        await User.findByIdAndUpdate(review.patron, { $pull: { reviewedArtworks: reviewId } });
    }catch(error){
        throw error;
    }
}

async function getReviewById(reviewId){
    const review = await Review.findById(reviewId).populate('patron');
    return review;
}

async function createWorkshop(artistId, workshop){
    try {
        const newWorkshop = new Workshop(workshop);
        await newWorkshop.save();
        await User.findByIdAndUpdate(artistId, { $push: { workshops: newWorkshop._id } });
        return newWorkshop;
    } catch (error) {
        throw error;
    }
}

async function enrollInWorkshop(workshopId, userId){
    try {
        const workshop = await Workshop.findByIdAndUpdate(workshopId, { $push: { enrolledUsers: userId } });
        return workshop;
    } catch (error) {
        throw error;
    }
}

async function getWorkShopById(workshopId){
    const workshop = await Workshop.findById(workshopId).populate('artist').populate('enrolledUsers');
    return workshop;
}

async function unEnrollFromWorkshop(workshopId, userId){
    try{
        const workshop = await Workshop.findByIdAndUpdate(workshopId, { $pull: { enrolledUsers: userId } });
        return workshop;
    }catch(error){
        throw error;
    }
}

async function addNotifications(userId, notification){
    try{
        await User.findByIdAndUpdate(userId, { $push: { notifications: notification } });
    }catch(error){
        throw error;
    }
}

module.exports = {
    getNArtworks,
    getArtworkById,
    getArtworksByArtistId,
    createUser,
    createArtist,
    getUserById,
    getUserByUsername,
    deleteUser,
    loginUser,
    likeArtwork,
    checkIfLiked,
    unlikeArtwork,
    followUser,
    unFollowUser,
    checkIfFollowing,
    createReview,
    deleteReview,
    getReviewById,
    createArtwork,
    createWorkshop,
    enrollInWorkshop,
    getWorkShopById,
    unEnrollFromWorkshop,
    getArtworkByText,
    addNotifications
}