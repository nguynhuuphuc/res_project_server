const express = require('express')
const router = express.Router()

const userController = require('../app/controllers/UserController')

router.use('/get_customer',userController.getCustomer)
router.use('/get_customers',userController.getCustomers)

router.use('/update_customer',userController.updateInfoCustomer)
router.use('/get_info_customer',userController.getInfoCustomer)
router.use('/add_new_customer',userController.addNewCustomer)
router.use('/delete_customer',userController.deleteCustomer)
router.use('/get_employee_by_id',userController.get_employee_by_id)
router.use('/delete_employee',userController.delete_employee)
router.use('/employee',userController.employee)
router.use('/update_employee',userController.update_employee)
router.use('/add_new_employee',userController.add_new_employee)
router.use('/email_is_exists',userController.email_is_exists)
router.use('/phone_number_is_exists',userController.phone_number_is_exists)
router.use('/get_list_employees_byPositionId',userController.get_list_employees_byPositionId)


module.exports = router