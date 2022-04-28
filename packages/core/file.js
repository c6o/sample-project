import fs from 'fs/promises'

// This is here to demonstrate editing data in volumes
// using czctl mount
export const fileResult = async () => {
    const path = './data/message.txt'
    let result = { path }
    try {
        const data = await fs.readFile(path, 'utf8')
        result.data = data
    }
    catch (error) {
        const message = error.message
        if (error.code === 'ENOENT')
            message += ' - This error will be fixed during the tutorials'

        result.error = message
    }
    return { file: result }
}
