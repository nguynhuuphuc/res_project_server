const fs = require('fs')
const path = require('path')

const jsonFilePath = path.join(__dirname,'config/default.json')


function setDefault(ip){
    fs.readFile(jsonFilePath,'utf8',(err,data)=>{
          if (err) {
            console.error('Lỗi khi đọc tệp JSON:', err);
            return;
          }

        try {
          // Phân tích JSON thành đối tượng JavaScript
          const jsonData = JSON.parse(data);
      
          // Cập nhật địa chỉ IP trong đối tượng JSON
          if (!jsonData.vnp_ReturnUrl.includes(ip)) {
            jsonData.vnp_ReturnUrl = `http://${ip}:3000/payment/vnpay_return`      
          
            // Chuyển đối tượng JSON thành chuỗi JSON
            const updatedJsonData = JSON.stringify(jsonData, null, 2)
          
            // Ghi lại tệp JSON với dữ liệu cập nhật
            fs.writeFile(jsonFilePath, updatedJsonData, 'utf8', (err) => {
              if (err) {
                console.error('Lỗi khi ghi tệp JSON:', err)
              } else {
                console.log('Đã cập nhật địa chỉ IP trong tệp JSON thành công.');
              }
            })
          }
        } catch (jsonParseError) {
          console.error('Lỗi khi phân tích JSON:', jsonParseError);
        }
      })
}

module.exports = setDefault