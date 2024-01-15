const mongoose = require('mongoose'); //import mongoose

//create schemas
const artworkSchema = new mongoose.Schema({
    title: { type: String, required: true, unique: true },
    artist: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    medium: { type: String, required: true },
    image: { type: String, required: true }, // URL or path to image
    tags: [{ type: String, required: true }],
    reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review', required: true }],
    dateTime: { type: Date, default: Date.now },
    year: { type: Number, required: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }], 
}, { collection: 'artworks', timestamps: true });

artworkSchema.index({ title: 'text', description: 'text', tags: 'text', category: 'text', medium: 'text' }); // Index for search

const Artwork = mongoose.model('Artwork', artworkSchema); //create Artwork model

const reviewSchema = new mongoose.Schema({
    artwork: { type: mongoose.Schema.Types.ObjectId, ref: 'Artwork', required: true },
    patron: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    comment: { type: String, required: true },
}, { collection: 'reviews', timestamps: true });

const Review = mongoose.model('Review', reviewSchema);

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Ensure to hash passwords
    isArtist: { type: Boolean, default: false },
    bio: { type: String, default: '' },
    profilePic: { type: String, default: 'https://th.bing.com/th/id/OIP.0siT9Vkwx8tb_kFTi-KV1wHaHa?w=175&h=180&c=7&r=0&o=5&dpr=1.5&pid=1.7' },
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    likedArtworks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Artwork' }],
    reviewedArtworks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],
    notifications: [
        {message: { type: String, required: true }, read: { type: Boolean, default: false }, dateTime: { type: Date, default: Date.now }, link: { type: String, required: true} 
    }],
    
    artistName: { type: String },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    artworks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Artwork' }],
    hasAgent: { type: Boolean, default: false },
    agentName: { type: String, default: '' },
    workshops: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Workshop' }],
}, { collection: 'users', timestamps: true });

userSchema.index({ username: 'text', artistName: 'text' }); // Index for search

const User = mongoose.model('User', userSchema);

const workshopSchema = new mongoose.Schema({
    title: { type: String, required: true },
    artist: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    description: { type: String, required: true },
    enrolledUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
}, { collection: 'workshops', timestamps: true });

const Workshop = mongoose.model('Workshop', workshopSchema);

module.exports = {  Artwork, Review, User, Workshop }; //export models