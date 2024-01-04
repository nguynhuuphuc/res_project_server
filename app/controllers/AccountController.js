const pool = require('../../config/db')
const bcrypt = require('bcrypt')

class AccountController{
    index(req,res){
        res.send("Account Index")
    }

    passwordChecking(req,res){
        const {password,user_uid} = req.body;
        const text = `
            SELECT password
            FROM accounts
            WHERE user_uid = '${user_uid}'
        `
        pool.query(text)
        .then((result)=>{
            if(bcrypt.compareSync(password, result.rows[0].password)){
                return res.json({message : "Correct password"})
            }else{
                return res.status(401).json({ error: 'Invalid password' });
            }
        })
        .catch((err)=>console.log("Err checking password: ", err))
    }
    
    add_new_account(req,res){
        const {phone_number,password,user_uid,position_id,is_verify} = req.body;

        const cleanedData = {
            phone_number: phone_number !== undefined ? phone_number : null,
            password: password !== undefined ? password : null,
            user_uid: user_uid !== undefined ? user_uid : null,
            position_id: position_id !== undefined ? position_id : null,
            is_verify: is_verify !== undefined ? is_verify : false
        }
        const values = []
        for (const key in cleanedData) {
            values.push(cleanedData[key])
        }
        let add_new_account_SQL
        if(position_id == 'KH'){
            add_new_account_SQL = `
            INSERT INTO accounts(phone_number,password,user_uid,position_id,is_verify,customer_uid) 
            VALUES($1, $2, $3, $4, $5,$3)
            `
        }else{
            add_new_account_SQL = `
            INSERT INTO accounts(phone_number,password,user_uid,position_id,is_verify,employee_uid) 
            VALUES($1, $2, $3, $4, $5,$3)
            `
        }
       
        pool.query(add_new_account_SQL,values,(err,result)=>{
            if(err){
                console.error(err);
                
            }else{
                console.log("Add new account");
                res.json({message: 'Đã thêm tài khoản mới'});
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
    check_password_exists(req,res){
        const { phone_number} = req.body;    
        // Perform user authentication in your database
        var query =`
            SELECT * 
            FROM accounts 
            WHERE password IS NOT NULL
            AND phone_number = $1 
        `
        
        pool.query(query, [phone_number], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'An error occurred during login.' });
            }
      
            if (result.rows.length === 1) {
                // Successful login
                return res.json({message: 'Tài khoản có mật khẩu'})
            } else {
                // Invalid credentials
                return res.status(401).json({ error: 'Tài khoản chưa có mật khẩu' });
            }
        });

    }
    create_password(req,res){
        const {user_uid,password} = req.body;
        var query = `
            UPDATE accounts
            SET password = $1
            WHERE user_uid = $2
        `
        pool.query(query,[password,user_uid],(err,result)=>{
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'An error occurred during login.' });
            }

            if(result.rowCount === 1){
                res.json({message: 'Đã thêm mật khẩu cho tài khoản'});
            }

        })

    }



}

module.exports = new AccountController;