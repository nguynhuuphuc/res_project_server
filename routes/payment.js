const express = require('express')
const router = express.Router()

const paymentController = require('../app/controllers/PaymentController')

router.use("/get_all_payment_method",paymentController.getAllPaymentMethod)
router.use("/vnpay_return",paymentController.vnpay_return)
router.use("/create_payment_url",paymentController.create_payment_url)
router.use("/exchange",paymentController.exchange)

module.exports = router