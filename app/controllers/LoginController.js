const pool = require('../../config/db')
const bcrypt = require('bcrypt')

class LoginController {
    loginKitchen(req,res){
        const { phone_number, password } = req.body; 

        const text = `
            SELECT user_uid,is_verify,password 
            FROM accounts 
            WHERE phone_number = '${phone_number}' AND
                position_id = 'B'
        `  
        pool.query(text)
        .then((result)=>{
            if (result.rows.length === 1) {
                if(bcrypt.compareSync(password, result.rows[0].password)){
                    const user = {
                        user_uid: result.rows[0].user_uid,
                        is_verify: result.rows[0].is_verify,
                    }
                    return res.json(user)
                }else{
                    return res.status(401).json({ error: 'Invalid username or password' });
                }
            } else {
                return res.status(402).json({ error: 'Không tìm thấy tài khoản' });                
            }
        })
        .catch((err)=>console.log("err login kitchen: ",err))

    }
    index(req,res){
        const { phone_number, password } = req.body;    
        // Perform user authentication in your database
        pool.query('SELECT user_uid,is_verify,password FROM accounts WHERE phone_number = $1', [phone_number], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'An error occurred during login.' });
            }
      
            if (result.rows.length === 1) {
                if(bcrypt.compareSync(password, result.rows[0].password)){
                    const user = {
                        user_uid: result.rows[0].user_uid,
                        is_verify: result.rows[0].is_verify,
                    }
                    return res.json(user)
                }else{
                    return res.status(401).json({ error: 'Invalid username or password' });
                }
            } else {
                return res.status(402).json({ error: 'Không tìm thấy tài khoản' });                
            }
        });
    }
    
}

module.exports = new LoginController;