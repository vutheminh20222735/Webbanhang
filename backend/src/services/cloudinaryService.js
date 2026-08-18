const cloudinary = require('../config/cloudinary');

exports.uploadBuffer = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    stream.end(buffer);
  });
};

exports.uploadBase64 = async (base64, options = {}) => {
  // if base64 includes data:image/...;base64, strip it
  const matched = base64.match(/^data:(image\/[^;]+);base64,(.+)$/);
  const data = matched ? matched[2] : base64;
  return cloudinary.uploader.upload(`data:image/jpeg;base64,${data}`, options);
};
