const os = require('os')


function ipv4Address(){
    // Lấy tất cả các giao diện mạng trên máy tính
    const networkInterfaces = os.networkInterfaces();

    // Tìm giao diện có tên "Wireless LAN adapter Wi-Fi 2" và lấy địa chỉ IPv4 của nó
    const specificInterface = networkInterfaces['Wi-Fi 2'];

    if (specificInterface) {
      const ipv4Address = specificInterface.find(
        (address) => address.family === 'IPv4' && !address.internal
      );

      if (ipv4Address) {
        ip = ipv4Address.address
        console.log('Địa chỉ IPv4 của "Wi-Fi 2":', ipv4Address.address)
        return ip
        
      } else {
        console.log('Không tìm thấy địa chỉ IPv4 cho "Wi-Fi 2".');
      }
    } else {
      console.log('Không tìm thấy giao diện "Wi-Fi 2" trên máy tính.');
    }
}

module.exports = ipv4Address