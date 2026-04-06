import app from './app'
import { checkDatabaseConnection } from './db'

const PORT = process.env.PORT ?? 3000

async function start() {
  await checkDatabaseConnection()
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}

start()
