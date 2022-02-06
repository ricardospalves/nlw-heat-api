import { Request, Response } from 'express'
import { GetLatestMessagesService } from '../../services/GetLatestMessagesService'

export class GetLatestMessagesController {
  async handle(request: Request, response: Response) {
    const services = new GetLatestMessagesService()
    const result = await services.execute()

    return response.json(result)
  }
}
