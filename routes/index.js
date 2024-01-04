const login = require('./login')
const user = require('./user')
const account = require('./account')
const home = require('./home')
const order = require('./order')
const payment = require('./payment')
const history = require('./history')
const notification = require('./notification')
const kitchen = require('./kitchen')
const booking = require('./booking')
const reservation = require('./reservation')

function route(app){

    app.use('/reservation',reservation)
    app.use('/booking',booking )
    app.use('/kitchen',kitchen)
    app.use('/notification',notification)
    app.use('/history',history)
    app.use('/payment',payment)
    app.use('/login',login)
    app.use('/user', user)
    app.use('/account',account)
    app.use('/home',home)
    app.use('/order',order)
    

}

module.exports = route