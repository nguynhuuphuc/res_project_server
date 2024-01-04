const express = require('express')
const morgan = require('morgan')



const app = express()
const port = 3000

const route = require('./routes')
const webSocketServer = require('./websockerSever')

const pool = require('./config/db')
const c = require('config')


pool.connect()
.then(() => console.log('Connected to the database'))
.catch(err => console.error('Error connecting to the database', err))



app.use(express.urlencoded({
    extended: true,
}))

app.use(express.json())

app.use(morgan('combined'))

route(app)
webSocketServer(app,port)
