const Joi = require('joi');

const loginSchema = Joi.object({
    slug: Joi.string().pattern(/^[a-zA-Z0-9-_]+$/).min(3).max(30).required(),
    password: Joi.string().min(4).required(),
});

const appointmentSchema = Joi.object({
    tenant_id: Joi.string().guid({ version: 'uuidv4' }).optional(),
    customer_name: Joi.string().min(2).max(100).required(),
    customer_phone: Joi.string().pattern(/^\+?[0-9\s-]{10,20}$/).required(),
    appointment_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
    appointment_time: Joi.string().pattern(/^\d{2}:\d{2}(:\d{2})?$/).required(),
    service_id: Joi.string().guid({ version: 'uuidv4' }).allow(null).optional(),
    staff_id: Joi.string().guid({ version: 'uuidv4' }).allow(null).optional(),
    notes: Joi.string().max(500).allow(null, '').optional(),
    extra_ids: Joi.array().items(Joi.string().guid({ version: 'uuidv4' })).optional(),
});

const serviceSchema = Joi.object({
    tenant_id: Joi.string().guid({ version: 'uuidv4' }).optional(),
    name: Joi.string().min(2).max(100).required(),
    duration_minutes: Joi.number().integer().min(1).max(480).required(),
    price: Joi.number().min(0).allow(null).optional(),
    discounted_price: Joi.number().min(0).allow(null).optional(),
    description: Joi.string().max(1000).allow(null, '').optional(),
    body_area: Joi.string().max(100).allow(null, '').optional(),
});

const staffSchema = Joi.object({
    tenant_id: Joi.string().guid({ version: 'uuidv4' }).optional(),
    name: Joi.string().min(2).max(100).required(),
    surname: Joi.string().max(100).allow(null, '').optional(),
    phone: Joi.string().pattern(/^\+?[0-9\s-]{10,20}$/).allow(null, '').optional(),
    address: Joi.string().max(500).allow(null, '').optional(),
    role: Joi.string().max(100).allow(null, '').optional(),
});

module.exports = {
    loginSchema,
    appointmentSchema,
    serviceSchema,
    staffSchema
};
