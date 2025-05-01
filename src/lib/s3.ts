import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { randomUUID } from 'crypto'
import path from 'path'

export const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function uploadToS3(file: Express.Multer.File) {
  const ext = path.extname(file.originalname)
  const filename = `${randomUUID()}${ext}`

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET!,
    Key: filename,
    Body: file.buffer,
    ContentType: file.mimetype,
  })

  await s3.send(command)

  return `https://${process.env.AWS_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${filename}`
}

export async function deleteFromS3(imageUrl: string): Promise<void> {
  try {
    const bucketName = process.env.AWS_BUCKET! // ✅ Corrigido para usar o mesmo nome do upload
    const url = new URL(imageUrl)
    const key = decodeURIComponent(url.pathname.slice(1)) // remove a `/` inicial

    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    })

    await s3.send(command)

    console.log(`Imagem removida do S3: ${key}`)
  } catch (err) {
    console.error('Erro ao deletar imagem do S3:', err)
    throw new Error('Erro ao deletar imagem do S3')
  }
}