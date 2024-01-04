const pool = require('../../config/db')
const bcrypt = require('bcrypt')

class ReservationController{
    index(req,res){
        res.send("ReservationController")
    }
    getReservationsByCustomerId(req,res){
        const {customer_id} = req.body;
        const text = `
            Select r.* ,t.table_name
            From reservations r
            left join tables t on r.table_id = t.table_id
            where customer_id = ${customer_id}
        `
        pool.query(text)
        .then((result)=>{
            console.log(result.rows)
            return res.json(result.rows)
        })
        .catch((err)=>console.log("err get reservations: ",err))

    }

    
}

module.exports = new ReservationController;