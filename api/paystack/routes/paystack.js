const express = require('express')
const router = express.Router()


const paystack = require('../controllers/paystack')



router.get('/', (req, res) => {
    res.json({ ok: true, service: 'paystack' })
})

//paystack verify payment
router.post('/verify/:ref', paystack.verify)

router.get('/confirmation', (req, res) => {
    const output = req.session.output || {}

    console.log("===========confirmation==============")
    console.log(output.status)
    res.render('multitenant/shop/confirmation', { ...output })
})

module.exports = router