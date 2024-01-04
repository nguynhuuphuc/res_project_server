const express = require('express')
const router = express.Router()

const notificationController = require('../app/controllers/NotificationController')



router.use('/get_notify_count',notificationController.getCountNotify)
router.use('/get_notifications',notificationController.getNotification)
router.use('/',notificationController.index)


module.exports = router