const mongoose = require('mongoose');
const mongo_url = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/term_project';
const {User, Artwork} = require('./models.js'); //import models   
const fs = require('fs');
const path = require('path');                      

mongoose.connect(mongo_url)
.then(async () => {
    console.log('Connected to database');
    const galleryData = JSON.parse(fs.readFileSync('../public/gallery.json', 'utf8'));  

    // Create artist users
    for (const item of galleryData) {
        const artist = await User.findOne({ artistName: item.Artist });
        if (!artist) {
            const artistData = {
                artistName: item.Artist,
                username: item.Artist.toLowerCase().replace(/ /g, '_'),
                password: 'password', // Hash the password in production
                following: [],
                likedArtworks: [],
                reviewedArtworks: [],
                notifications: [],
                followers: [],
                artworks: [],
                isArtist: true,
            };
            const newArtist = new User(artistData);
            await newArtist.save();
        }
    }

    // Create artworks
    for (const item of galleryData) {
        const artist = await User.findOne({ artistName: item.Artist });
        if (artist) {
            const newArtworkData = {
                title: item.Title,
                artist: artist._id,
                description: item.Description || 'No description',
                category: item.Category,
                medium: item.Medium,
                image: item.Poster,
                tags: [],
                reviews: [],
                year: Number(item.Year),
                likes: [],
            };
            const newArtwork = new Artwork(newArtworkData);
            const savedArtwork = await newArtwork.save();
            artist.artworks.push(savedArtwork);
            await artist.save();
            console.log('Artwork saved successfully', savedArtwork.title);
        } else {
            console.log(item.Artist, 'not found');
        }
    }

    console.log("Done seeding database");
})
.catch((err) => {
    console.error(err);
})
.finally(async () => {
    await mongoose.connection.close();
    console.log("Database connection closed");
});
