const express = require('express') // require -> commonJS
const crypto = require('node:crypto')
const movies = require('./movies.json')
const cors = require('cors')
const z = require('zod')

const { validateMovie, validatePartialMovie } = require('./schemas/movies')
const { callbackify } = require('node:util')

const app = express()

app.disable('x-powered-by');

app.use(cors({
    origin: (origin, callback) => {
        const ACCEPTED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:5500'
 ]
 if(ACCEPTED_ORIGINS.includes(origin)){
    return callback(null, true)
 }

 if(!origin){
    return callback(null, true)
 }

 return callback(new Error('Not allowed by CORS'))
    }
}))

app.use(express.json())

// Todos los recursos que sean movies, se identifican con /movies
app.get('/movies', (req, res) => {
    const { genre } = req.query
    if (genre) {
        const filteredMovies = movies.filter(
            movie => movie.genre.some(g => g.toLowerCase() === genre.toLowerCase())
        )
        return res.json(filteredMovies)
    }
    res.json(movies)
})

app.get('/movies/:id', (req, res) => { // Path to regexp
    const { id } = req.params
    const movie = movies.find(movie => movie.id === id)
    if(movie) return res.json(movie)
    
    res.status(404).json({ message: 'Movie not found' })
})

app.post('/movies', (req, res) => {
    const result = validateMovie(req.body)
    if (result.error) {
        return res.status(400).json({ error: JSON.parse(result.error.message) })
    }

    const newMovie = {
        id: crypto.randomUUID(),
        ...result.data
    }
    // Esto no es REST por que estamos guardando 
    // el estado de la aplicacion en memoria
    movies.push(newMovie)

    res.status(201).json(newMovie)
})

app.delete('/movies/:id', (req, res) => {
    const { id } = req.params
    const movieIndex = movies.findIndex(movie => movie.id === id)

    if(movieIndex === -1){
        return res.status(404).json({message: 'Movie not found'})
    }

    movies.splice(movieIndex, 1)

    return res.json({message: 'Movie deleted'})
})

app.patch('/movies/:id', (req, res) => {
    const result = validatePartialMovie(req.body)
    
    if (result.error){
        return res.status(400).json({ error: JSON.parse(result.error.message) })
    }
    
    const { id } = req.params
    const movieIndex = movies.findIndex(movie => movie.id === id)

    if (movieIndex === -1){
        return res.status(404).json({ message: 'Movie not found'})
    } 

    const updateMovie = {
        ...movies[movieIndex],
        ...result.data
    }

    movies[movieIndex] = updateMovie
    
    return res.json(updateMovie)
})
const PORT = process.env.PORT ?? 3000

app.listen(PORT, () => {
    console.log(`Server listening on port http://localhost:${PORT}`)
})