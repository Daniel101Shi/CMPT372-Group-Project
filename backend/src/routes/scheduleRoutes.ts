import express from 'express'
import {fetch_schedule, upload_schedule} from '../controllers/scheduleController.js'

const router = express.Router()

router.get('/schedule/:year/:semester', fetch_schedule)
router.post('/schedule/:year/:semester', upload_schedule)

export let scheduleRoutes = router