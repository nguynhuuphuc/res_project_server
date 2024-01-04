const { query } = require('express')
const pool = require('../../config/db')

class HistoryController{
    index(req,res){
        res.send("History")
    }

    getRevenue(req,res){
        const {interval,day_start, day_end} = req.body;

        var text =""
        switch (interval) {
            case "day":
                text = queryRevByDay()
                break;
            case "week":
                text = queryRevByWeek()
                break;
            case "month":
                text = queryRevByMonth()
                break;
            case "quarter":
                text = queryRevByQuarter()
                break;
            case "year":
                text = queryRevByYear()
                break;
            case "today":
                text = queryRevByCurrentDate()
                break;
            case "forecast":
                text = queryRevForecastCurrentDate()
                break;
            default:
                text = queryInterval(day_start,day_end)
                break;
        }
        
        pool.query(text)
        .then((result)=>{
            console.log(result.rows)
            return res.json(result.rows)
        })
        .catch((err)=>{
            console.log("err get revenueStatistics: ",err)
        })


    }

    getPaidOrderItems(req,res){
        const {order_id} = req.body;
        console.log(req.body)
        const text = `
            SELECT *
            FROM paidorderitems
            WHERE order_id = ${order_id}
        `
        pool.query(text)
        .then((result)=>{
            console.log(result.rows)
            return res.json(result.rows)
        })
        .catch((err)=>{console.log("Err get paid orderitems:",err)})

    }


    getAllPaidOrders(req,res){

        const text = `
            SELECT 
                paidorders.order_id,
                paidorders.paid_time,
                paidorders.discount_amount,
                paidorders.discount_percentage,
                created_by,
                total_amount,
                paymentmethod.payment_method_id,
                paymentmethod.payment_method_name,
                SUM(paidorderitems.quantity) AS total_quantity
            FROM paidorders
            LEFT JOIN paidorderitems ON paidorders.order_id = paidorderitems.order_id 
            LEFT JOIN paymentmethod ON paymentmethod.payment_method_id = paidorders.payment_method_id
            GROUP BY paidorders.order_id,paymentmethod.payment_method_id
            ORDER BY paid_time DESC
        `

        pool.query(text)
        .then((result)=>{
            return res.json(result.rows)
        })
        .catch((err)=>{
            console.log("Err get all paid orders: ", err)
        })

    }
}
function queryRevByDay(){
    return `
    SELECT
	all_dates.date as interval,
	COALESCE(revenue.amount, 0) AS total,
	COALESCE(revenue.quantity, 0) AS quantity
    FROM
        (SELECT generate_series((SELECT MIN(DATE_TRUNC('day', paid_time)) AS min_date FROM paidorders), CURRENT_DATE, '1 day'::interval)::date AS date) AS all_dates
    LEFT JOIN
        revenue ON all_dates.date = revenue.date
    ORDER BY all_dates.date DESC
    LIMIT 7
    `
}

function queryRevByCurrentDate(){
    return `
        SELECT 
            id,
            amount as total,
            date,
            quantity
        FROM revenue
        WHERE date = CURRENT_DATE;
    `
}
function queryRevByWeek(){
    return`
    WITH weeks AS (
        SELECT generate_series(
          DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '3 weeks',
          DATE_TRUNC('week', CURRENT_DATE),
          INTERVAL '1 week'
        )::DATE AS week_start
      )
      SELECT
          weeks.week_start as interval,
          COALESCE(SUM(revenue.amount), 0) AS total,
          COALESCE(SUM(revenue.quantity), 0) AS quantity

      FROM
          weeks
      LEFT JOIN
          revenue ON DATE_TRUNC('week', revenue.date) = weeks.week_start
      GROUP BY
          weeks.week_start
      ORDER BY
          weeks.week_start DESC;
    `
}
function queryRevForecastCurrentDate(){
    return`
    SELECT 
        COALESCE((SUM(total_amount) + r.amount),r.amount) as total_forecast,
        COALESCE((SUM(oi.quantity) + r.quantity),r.quantity) as quantity_forecast
    FROM revenue r
    LEFT JOIN orders o ON DATE(o.order_date) = r.date
    LEFT JOIN orderitems oi ON o.order_id = oi.order_id
    LEFT JOIN reservations rs ON rs.order_id = o.order_id
    WHERE r.date = CURRENT_DATE and rs.id is null
    GROUP BY r.amount,r.quantity
    `
}

function queryRevByMonth(){
    return `
    WITH all_months AS (
        SELECT
                generate_series(
                    (SELECT MIN(DATE_TRUNC('month', date)) FROM revenue),
                    (SELECT MAX(DATE_TRUNC('month', date)) FROM revenue),
                    interval '1 month'
                ) AS month_start
        )
        SELECT
            all_months.month_start AS interval,
            COALESCE(SUM(revenue.amount), 0) AS total,
            COALESCE(SUM(revenue.quantity), 0) AS quantity
        FROM
            all_months
        LEFT JOIN
            revenue ON DATE_TRUNC('month', revenue.date) = all_months.month_start
        GROUP BY
            all_months.month_start
        ORDER BY
            all_months.month_start DESC;
    `
}

function queryRevByQuarter(){
    return `
    WITH quarters AS (
        SELECT generate_series(
          DATE_TRUNC('quarter', CURRENT_DATE) - INTERVAL '3 months',
          DATE_TRUNC('quarter', CURRENT_DATE),
          INTERVAL '1 month'
        )::DATE AS quarter_start
      )
      SELECT
          TO_CHAR(quarters.quarter_start, '"Quý "Q YYYY') AS quarter,
          COALESCE(SUM(revenue.amount), 0) AS total,
          COALESCE(SUM(revenue.quantity), 0) AS quantity
      FROM
          quarters
      LEFT JOIN
          revenue ON DATE_TRUNC('quarter', revenue.date) = quarters.quarter_start
      GROUP BY
          quarter
      ORDER BY
          quarter DESC;
    
    `
}
function queryRevByYear(){
    return `
    WITH years AS (
        SELECT generate_series(
          DATE_TRUNC('year', CURRENT_DATE) - INTERVAL '3 years',
          DATE_TRUNC('year', CURRENT_DATE),
          INTERVAL '1 year'
        )::DATE AS year_start
      )
      SELECT
          EXTRACT(YEAR FROM years.year_start) AS year,
          COALESCE(SUM(revenue.amount), 0) AS total,
          COALESCE(SUM(revenue.quantity), 0) AS quantity

      FROM
          years
      LEFT JOIN
          revenue ON DATE_TRUNC('year', revenue.date) = years.year_start
      GROUP BY
          year
      ORDER BY
          year DESC;
    
    `
}

function queryInterval(day_start,day_end){
    return `
    WITH date_range AS (
        SELECT
          generate_series(
            '${day_start}'::DATE,
            '${day_end}'::DATE,
            INTERVAL '1 day'
          )::DATE AS day
      )
      SELECT
        date_range.day,
        TO_CHAR(date_range.day, 'D') AS day_of_week_number,
        COALESCE(SUM(revenue.amount), 0) AS total,
        COALESCE(SUM(revenue.quantity), 0) AS quantity
      FROM
        date_range
      LEFT JOIN
        revenue ON date_range.day = DATE(revenue.date)
      GROUP BY
        date_range.day
      ORDER BY
        date_range.day;
    
    `
}

module.exports = new HistoryController