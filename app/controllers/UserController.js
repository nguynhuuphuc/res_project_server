const pool = require('../../config/db')

class UserController {

    deleteCustomer(req,res){
        const {user_uid} = req.body;
        const text = `
            UPDATE customers
            SET is_deleted = true
            WHERE user_uid = '${user_uid}'
        `
        pool.query(text)
        .then(()=>{
            return res.json({message: "Delete Success"})
        })
        .catch((err)=>console.log("Err deleted customer:",err))
    }

    getCustomer(req,res){
        const {user_uid}  = req.body;
        console.log("user_uid: " + user_uid)
        pool.query('SELECT * FROM customers WHERE user_uid = $1',[user_uid] ,(err, result) => {
            if (err) {
              console.error(err);
              res.status(500).json({ error: 'An error occurred.' });
              return;
            }
            // Trả về kết quả dưới dạng JSON
            console.log(result.rows[0])
            return res.json(result.rows[0]);
        })
    }

    getCustomers(req,res){
        const text = `
            SELECT * 
            From customers
            WHERE is_deleted = false
        `
        pool.query(text)
        .then((result)=>{
            console.log(result.rows)
            return res.json(result.rows)

        })
        .catch((err)=>console.log("Err get customers:",err))
    }

    updateInfoCustomer(req,res){
        const {full_name,
            date_of_birth,
            gender,
            address,
            email,
            user_uid,
            avatar,
        }  = req.body;
        const cleanedData = {
            full_name: full_name !== undefined ? full_name : null,
            date_of_birth: date_of_birth !== undefined ? date_of_birth : null,
            gender: gender !== undefined ? gender : null,
            address: address !== undefined ? address : null,
            email: email !== undefined ? email : null,
            user_uid: user_uid !== undefined ? user_uid : null,
            avatar: avatar !== undefined ? avatar : null
        }
        
        const update_customers = `
            WITH updated_customers AS (
                UPDATE customers
                SET
                    full_name = CASE 
                        WHEN full_name IS NULL OR full_name <>  $1 THEN $1 ELSE full_name END,
                    date_of_birth = CASE 
                        WHEN date_of_birth IS NULL OR $2 <> date_of_birth THEN $2 ELSE date_of_birth END,
                    gender = CASE 
                        WHEN gender IS NULL OR $3 <> gender THEN $3 ELSE gender END,
                    address = CASE 
                        WHEN address IS NULL OR $4 <> address THEN $4 ELSE address END,
                    email = CASE 
                        WHEN email IS NULL OR $5 <> email THEN $5 ELSE email END,
                    avatar = CASE 
                        WHEN avatar IS NULL OR $7 <> avatar THEN $7 ELSE avatar END
                WHERE
                    user_uid = $6
                RETURNING *
            )
            SELECT updated_customers.*, accounts.*
            FROM updated_customers
            JOIN accounts ON updated_customers.user_uid = accounts.user_uid
        `
        const values = []
        for (const key in cleanedData) {
            values.push(cleanedData[key])
        }
        pool.query(update_customers,values,(err, result) => {
            if (err) {
                console.error(err);
                // Xử lý lỗi
            } else {
                // Truy vấn thành công
                res.json(result.rows[0]);
                // Xử lý thành công
            }
        
        })
    }

    getInfoCustomer(req,res){
        const{user_uid} = req.body;
        const text = `
            SELECT c.*, created_date 
            FROM customers c
            JOIN accounts a ON c.user_uid = a.user_uid
            WHERE c.user_uid = '${user_uid}'
        `
        pool.query(text)
        .then((result)=>{
            console.log(result.rows[0]);
            return res.json(result.rows[0])
        })
        .catch((err)=>console.log("Err get info customer:",err))
    }

    addNewCustomer(req,res){
        const {full_name,
            date_of_birth,
            gender,
            address,
            email,
            user_uid,
            avatar,
            phone_number
        }  = req.body;

        console.log(phone_number)
        const cleanedData = {
            full_name: full_name !== undefined ? full_name : phone_number,
            date_of_birth: date_of_birth !== undefined ? date_of_birth : null,
            gender: gender !== undefined ? gender : null,
            address: address !== undefined ? address : null,
            email: email !== undefined ? email : null,
            user_uid: user_uid !== undefined ? user_uid : null,
            avatar: avatar !== undefined ? avatar : null
        }
        const values = []
        for (const key in cleanedData) {
            values.push(cleanedData[key])
        }
        const add_new_customer = `
            INSERT INTO customers(full_name, date_of_birth, gender, address, email, user_uid, avatar,phone_number) 
            VALUES($1, $2, $3, $4, $5, $6, $7,'${phone_number}')
            ON CONFLICT(user_uid) 
            DO UPDATE SET 
              full_name = EXCLUDED.full_name,
              date_of_birth = EXCLUDED.date_of_birth,
              gender = EXCLUDED.gender,
              address = EXCLUDED.address,
              email = EXCLUDED.email,
              avatar = EXCLUDED.avatar,
              phone_number = EXCLUDED.phone_number,
              is_deleted = false
          WHERE customers.is_deleted = true;
        `
        pool.query(add_new_customer,values,(err,result) =>{
            if (err) {
                console.log("err add new customer: ",err)
                return res.status(500).json({ error: 'An error occurred during add new customer.' });
                // Xử lý lỗi
            } else {
                // Truy vấn thành công
                console.log("Add new customer");
                res.json({message: 'Đã thêm tài khoản mới'});
                // Xử lý thành công
            }
        })


    }


    employee(req,res){
        const {user_uid}  = req.body;
        console.log("user_uid: " + user_uid)
        pool.query('SELECT * FROM employees WHERE user_uid = $1',[user_uid] ,(err, result) => {
            if (err) {
              console.error(err);
              res.status(500).json({ error: 'An error occurred.' });
              return;
            }
            // Trả về kết quả dưới dạng JSON
            console.log(result.rows[0])
            return res.json(result.rows[0]);
        })
    }

    delete_employee(req,res){
        const {user_uid} = req.body;

        const text = `
            UPDATE employees
            SET is_delete = true
            WHERE user_uid = '${user_uid}'
            RETURNING *
        `
        pool.query(text)
        .then((result)=>{
            console.log(result.rows[0])
            return res.json(result.rows[0])
        })
        .catch((err)=> console.log("Error delete employee: ",err))
    }

    update_employee(req,res){
        
        const {full_name,
            date_of_birth,
            gender,
            address,
            email,
            user_uid,
            position_id,
            avatar,
        }  = req.body;
        const cleanedData = {
            full_name: full_name !== undefined ? full_name : null,
            date_of_birth: date_of_birth !== undefined ? date_of_birth : null,
            gender: gender !== undefined ? gender : null,
            address: address !== undefined ? address : null,
            email: email !== undefined ? email : null,
            user_uid: user_uid !== undefined ? user_uid : null,
            position_id: position_id !== undefined ? position_id : null,
            avatar: avatar !== undefined ? avatar : null
        }
        console.log(cleanedData.avatar)
        
        const update_employee = `
            UPDATE employees
            SET
                full_name = CASE 
                    WHEN full_name IS NULL OR full_name <>  $1 THEN $1 ELSE full_name END,
                date_of_birth = CASE 
                    WHEN date_of_birth IS NULL OR $2 <> date_of_birth THEN $2 ELSE date_of_birth END,
                gender = CASE 
                    WHEN gender IS NULL OR $3 <> gender THEN $3 ELSE gender END,
                address = CASE 
                    WHEN address IS NULL OR $4 <> address THEN $4 ELSE address END,
                email = CASE 
                    WHEN email IS NULL OR $5 <> email THEN $5 ELSE email END,
                position_id = CASE
                     WHEN position_id IS NULL OR $7 <> position_id THEN $7 ELSE position_id END,
                avatar = CASE 
                    WHEN avatar IS NULL OR $8 <> avatar THEN $8 ELSE avatar END
            WHERE
                user_uid = $6
            RETURNING *
        `
        const values = []
        for (const key in cleanedData) {
            values.push(cleanedData[key])
        }
        pool.query(update_employee,values,(err, result) => {
            if (err) {
                console.error(err);
                // Xử lý lỗi
            } else {
                // Truy vấn thành công
                res.json(result.rows[0]);
                // Xử lý thành công
            }
        
        })
        
    }

    add_new_employee(req,res){
        const {full_name,
            date_of_birth,
            gender,
            address,
            email,
            user_uid,
            position_id,
            avatar,
        }  = req.body;
        const cleanedData = {
            full_name: full_name !== undefined ? full_name : null,
            date_of_birth: date_of_birth !== undefined ? date_of_birth : null,
            gender: gender !== undefined ? gender : null,
            address: address !== undefined ? address : null,
            email: email !== undefined ? email : null,
            user_uid: user_uid !== undefined ? user_uid : null,
            position_id: position_id !== undefined ? position_id : null,
            avatar: avatar !== undefined ? avatar : null
        }
        const values = []
        for (const key in cleanedData) {
            values.push(cleanedData[key])
        }
        const add_new_employee = `
        INSERT INTO employees(full_name, date_of_birth, gender, address, email, user_uid, position_id, avatar) 
        VALUES($1, $2, $3, $4, $5, $6, $7, $8)
        `
        pool.query(add_new_employee,values,(err,result) =>{
            if (err) {
                console.log("err add new employee: ",err)
                return res.status(500).json({ error: 'An error occurred during add new employee.' });
                // Xử lý lỗi
            } else {
                // Truy vấn thành công
                console.log("Add new employee");
                res.json({message: 'Đã thêm nhân viên mới'});
                // Xử lý thành công
            }
        })


    }

    email_is_exists(req,res){
        const {email} = req.body;
        const query = `
        SELECT * 
        FROM employees
        WHERE email = $1;
        `

        console.log(email)
        pool.query(query,[email],(err,result)=>{
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'An error occurred.' });
            }
      
            if (result.rows.length === 0) {
                // Successful login
                return res.json({ message: 'Email hợp lệ!' })
            } else {
                // Invalid credentials
                return res.status(401).json({ error: 'Email đã tồn tại' });
            }
        })
    }
    phone_number_is_exists(req,res){
        const {phone_number} = req.body;
        const query = `
        SELECT * 
        FROM accounts
        WHERE phone_number = $1;
        `
        pool.query(query,[phone_number],(err,result)=>{
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'An error occurred.' });
            }
      
            if (result.rows.length === 1) {
                // Successful login
                return res.json({ message: 'Số điện thoại hợp lệ!' })
            } else {
                // Invalid credentials
                return res.status(401).json({ error: 'Số điện thoại không tồn tại' });
            }
        })
    }
    get_employee_by_id(req,res){
        const {user_uid} = req.body;
        var query =`
            SELECT employees.*, accounts.phone_number
            FROM employees
            JOIN accounts ON employees.user_uid = accounts.user_uid
            WHERE employees.user_uid = '${user_uid}'
        `
        pool.query(query)
        .then((result)=>{
            console.log(result.rows)
            return res.json(result.rows[0])
        })
        .catch((err)=>console.log("Err get employee id ",err))

    }

    get_list_employees_byPositionId(req,res){
        const {position_id} = req.body;
        var query =`
            SELECT employees.*, accounts.phone_number
            FROM employees
            JOIN accounts ON employees.user_uid = accounts.user_uid
        `
        if(position_id !== '*'){
            query = `
            SELECT employees.*, accounts.phone_number
            FROM employees
            JOIN accounts ON employees.user_uid = accounts.user_uid
            WHERE employees.position_id ='${position_id}'
            `
        }
        pool.query(query,(err, result) => {
            if (err) {
              console.error(err);
              res.status(500).json({ error: 'An error occurred.' });
              return;
            }
            // Trả về kết quả dưới dạng JSON
            res.json(result.rows);
        })
        
    }

}

module.exports = new UserController;