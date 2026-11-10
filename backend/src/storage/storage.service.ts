import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createHash, randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'

export interface StoredObject {
  key: string
  sha256: string
  size: number
}

@Injectable()
export class StorageService {
  private readonly root: string

  constructor(private readonly config: ConfigService) {
    this.root = resolve(process.cwd(), config.get<string>('UPLOAD_DIR') ?? 'uploads')
  }

  async put(buffer: Buffer, folder: string, originalName: string): Promise<StoredObject> {
    const driver = this.config.get<string>('STORAGE_DRIVER') ?? 'local'
    if (driver !== 'local') {
      throw new InternalServerErrorException(`不支持的存储驱动：${driver}`)
    }

    const digest = createHash('sha256').update(buffer).digest('hex')
    const extension = extname(originalName).toLowerCase()
    const key = `${folder.replace(/^\/+|\/+$/g, '')}/${digest.slice(0, 2)}/${randomUUID()}${extension}`
    const absolutePath = this.getAbsolutePath(key)

    await mkdir(resolve(absolutePath, '..'), { recursive: true })
    await writeFile(absolutePath, buffer)

    return { key, sha256: digest, size: buffer.length }
  }

  getAbsolutePath(key: string): string {
    const absolutePath = resolve(this.root, key)
    if (!absolutePath.startsWith(`${this.root}${sep}`)) {
      throw new InternalServerErrorException('非法的存储路径')
    }
    return absolutePath
  }
}
