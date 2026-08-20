// Thông tin liên hệ cửa hàng — chỉnh sửa tại đây hoặc override bằng env
module.exports = {
  phone: process.env.SHOP_PHONE || '1900 0000',
  phoneHref: process.env.SHOP_PHONE_HREF || 'tel:19000000',
  zalo: process.env.SHOP_ZALO || 'https://zalo.me/0000000000',
  facebook: process.env.SHOP_FACEBOOK || 'https://www.facebook.com/phoneshop',
  name: process.env.SHOP_NAME || 'PhoneShop',
  address: process.env.SHOP_ADDRESS || 'Hà Nội'
};
