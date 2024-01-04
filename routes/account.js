const express = require('express')
const router = express.Router()

const accountController = require('../app/controllers/AccountController')



router.use('/check_password',accountController.passwordChecking)
router.use('/create_password',accountController.create_password)
router.use('/check_password_exists',accountController.check_password_exists)
router.use('/add_new_account',accountController.add_new_account)
router.use('/',accountController.index)


module.exports = router