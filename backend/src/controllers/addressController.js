const Address = require('../models/Address');

async function unsetOthersDefault(userId, keepId) {
  await Address.updateMany(
    { user: userId, _id: { $ne: keepId } },
    { $set: { isDefault: false } }
  );
}

exports.list = async (req, res, next) => {
  try {
    const items = await Address.find({ user: req.user.id }).sort({ isDefault: -1, createdAt: -1 });
    res.json({ success: true, data: { items } });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { name, phone, line1, city, district, isDefault } = req.body || {};
    if (!name || !phone || !line1 || !city) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin' });
    }
    const count = await Address.countDocuments({ user: req.user.id });
    const doc = await Address.create({
      user: req.user.id,
      name: String(name).trim(),
      phone: String(phone).trim(),
      line1: String(line1).trim(),
      city: String(city).trim(),
      district: String(district || '').trim(),
      isDefault: count === 0 ? true : !!isDefault
    });
    if (doc.isDefault) await unsetOthersDefault(req.user.id, doc._id);
    res.json({ success: true, data: doc });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const doc = await Address.findOne({ _id: req.params.id, user: req.user.id });
    if (!doc) return res.status(404).json({ success: false, message: 'Không tìm thấy địa chỉ' });
    const { name, phone, line1, city, district, isDefault } = req.body || {};
    if (name !== undefined) doc.name = String(name).trim();
    if (phone !== undefined) doc.phone = String(phone).trim();
    if (line1 !== undefined) doc.line1 = String(line1).trim();
    if (city !== undefined) doc.city = String(city).trim();
    if (district !== undefined) doc.district = String(district || '').trim();
    if (isDefault !== undefined) doc.isDefault = !!isDefault;
    doc.updatedAt = Date.now();
    await doc.save();
    if (doc.isDefault) await unsetOthersDefault(req.user.id, doc._id);
    res.json({ success: true, data: doc });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const doc = await Address.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!doc) return res.status(404).json({ success: false, message: 'Không tìm thấy địa chỉ' });
    if (doc.isDefault) {
      const nextDefault = await Address.findOne({ user: req.user.id }).sort({ createdAt: -1 });
      if (nextDefault) {
        nextDefault.isDefault = true;
        await nextDefault.save();
      }
    }
    res.json({ success: true, message: 'Đã xóa địa chỉ' });
  } catch (err) { next(err); }
};

exports.setDefault = async (req, res, next) => {
  try {
    const doc = await Address.findOne({ _id: req.params.id, user: req.user.id });
    if (!doc) return res.status(404).json({ success: false, message: 'Không tìm thấy địa chỉ' });
    doc.isDefault = true;
    doc.updatedAt = Date.now();
    await doc.save();
    await unsetOthersDefault(req.user.id, doc._id);
    res.json({ success: true, data: doc });
  } catch (err) { next(err); }
};
