const recordService = require('../services/recordService');

const getAll = async (req, res, next) => {
  try {
    const result = await recordService.getRecords({
      ...req.query,
      requesting_role:    req.user.role,
      requesting_user_id: req.user.id,
    });
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const record = await recordService.getRecordById(req.params.id, req.user);
    res.json({ success: true, data: record });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const record = await recordService.createRecord({
      ...req.body,
      user_id: req.user.id,
    });
    res.status(201).json({ success: true, message: 'Record created.', data: record });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const record = await recordService.updateRecord(req.params.id, req.body, req.user);
    res.json({ success: true, message: 'Record updated.', data: record });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await recordService.deleteRecord(req.params.id, req.user);
    res.json({ success: true, message: 'Record deleted successfully.' });
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, create, update, remove };
