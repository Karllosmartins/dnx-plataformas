import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { pinoHttp } from 'pino-http'
import pino from 'pino'

// Rotas
import authRoutes from './routes/auth'
import leadsRoutes from './routes/leads'
import healthRoutes from './routes/health'

const app = express()
const PORT = process.env.API_PORT || 3001

// Logger
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: { colorize: true }
  } : undefined
})

// Middlewares
app.use(helmet())
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}))
app.use(express.json())
app.use(pinoHttp({ logger }))

// Rotas
app.use('/api/health', healthRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/leads', leadsRoutes)

// Error handler global
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error({ err, url: req.url, method: req.method }, 'Unhandled error')
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  })
})

// Start server
app.listen(PORT, () => {
  logger.info(`API server running on http://localhost:${PORT}`)
})

export default app
