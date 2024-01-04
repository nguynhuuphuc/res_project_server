const express = require('express')
const router = express.Router()

const bookingController = require('../app/controllers/BookingController')


router.use('/dishes_and_table',bookingController.dishesAndTable)
router.use('/get_reservations_by_day2',bookingController.getReservationByDay2)
router.use('/update_reservation_status',bookingController.updateReservationStatus)
router.use('/dishes_only',bookingController.dishesOnly)
router.use('/reservation_in_progress_release',bookingController.reservationInProgressRelease)
router.use('/reservation_in_progress',bookingController.reservationInProgress)
router.use('/post_booking_table',bookingController.tableBooking)
router.use('/get_reservation_by_day',bookingController.getReservationByDay)
router.use('/get_reservations',bookingController.getReservations)
router.use('/get_tables',bookingController.getTables)
router.use('/get_table_booking_by_day',bookingController.getTableByDay)
router.use('/',bookingController.index)


module.exports = router