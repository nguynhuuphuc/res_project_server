const pool = require('../../config/db')

class NotificationController{
    index(req,res){
        res.send("Notification Index")
    }

    getCountNotify(req,res){
        const text = `
            SELECT COUNT(id) as notify_count
            FROM notifications
        `

    pool.query(text)
    .then((result)=>{
        return res.json(result.rows[0])
    })
    .catch((err)=> console.log("Err get Notifications: ",err))
}

    getNotification(req,res){
        const {time_start} = req.body;
        let text =  `
            SELECT *
            FROM notifications
        `
        if(time_start != undefined ){
            text += `
                WHERE notify_time < '${time_start}'
            `
        }
        text += `
            ORDER BY notify_time DESC
            LIMIT 10 
        `

        pool.query(text)
        .then((result)=>{
            return res.json(result.rows)
        })
        .catch((err)=> console.log("Err get Notifications: ",err))
    }
    
}

module.exports = new NotificationController;