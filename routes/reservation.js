const express = require('express')
const router = express.Router()

const reservationController = require('../app/controllers/ReservationController')

router.use('/get_reservation_by_customer_id',reservationController.getReservationsByCustomerId)
router.use('/',reservationController.index)


module.exports = router