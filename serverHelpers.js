const { getNArtworks, getArtworkById, createArtwork, getArtworksByArtistId, createUser, createArtist, getUserById, getUserByUsername, deleteUser, loginUser } = require('./database/databaseHelpers.js');


function send404(res){
	res.status(404);
	res.send('404: Resource Not Found');
}

function send400(res){
	res.status(400);
	res.send('400: Bad Request');
}

function send500(res, message=""){
	res.status(500);
	res.send(`500: Internal Server Error: ${message}`);
}

function send201(res, message=""){
	res.status(201);
	res.send(`201: Created: ${message}`);
}

function send200(res, message=""){
	res.status(200);
	res.send(`200: OK ${message}`);
}

function send204(res, message=""){
    res.status(204);
    res.send(`204: No Content ${message}`);
}

async function registerUser(formData) {
    try{
        const newUser = await createUser(formData);
        return newUser;
    }catch(error){
        throw error;
    }
}

async function login(formData) {
    try{
        const user = await loginUser(formData);
        return user;
    }catch (error){
        throw error;
    }

}

function generateRandomString(length) {
    let result = '';
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

module.exports = {
    send404,
    send400,
    send500,
    send201,
    send200,
    send204,
    registerUser,
    generateRandomString,
    login
}