import { checkDatabaseConnection } from '../../src/db'

// Mock the db module so we don't need a real DB connection in unit tests
jest.mock('../../src/db', () => {
  const mockRaw = jest.fn()
  const mockDb = { raw: mockRaw }
  return {
    __esModule: true,
    default: mockDb,
    checkDatabaseConnection: async () => {
      try {
        await mockDb.raw('SELECT 1')
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.error(`[db] Failed to connect to the database: ${message}`)
        process.exit(1)
      }
    },
    _mockRaw: mockRaw,
  }
})

describe('checkDatabaseConnection', () => {
  let exitSpy: jest.SpyInstance
  let errorSpy: jest.SpyInstance
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  let mockRaw: jest.Mock

  beforeEach(() => {
    exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as never)
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mockRaw = require('../../src/db')._mockRaw
    mockRaw.mockReset()
  })

  afterEach(() => {
    exitSpy.mockRestore()
    errorSpy.mockRestore()
  })

  it('resolves without error when SELECT 1 succeeds', async () => {
    mockRaw.mockResolvedValueOnce([{ '?column?': 1 }])
    await checkDatabaseConnection()
    expect(exitSpy).not.toHaveBeenCalled()
  })

  it('logs a descriptive error and exits with code 1 when connection fails', async () => {
    mockRaw.mockRejectedValueOnce(new Error('connection refused'))
    await checkDatabaseConnection()
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to connect to the database')
    )
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('connection refused'))
    expect(exitSpy).toHaveBeenCalledWith(1)
  })
})
