import axios from 'axios'
import { sign } from 'jsonwebtoken'

import { prismaClient } from '../../prisma'

interface IAccessTokenResponse {
  access_token: string;
}

interface IUserResponse {
  avatar_url: string;
  login: string;
  id: number;
  name: string;
}

const CLIENT_ID = process.env.GITHUB_CLIENT_ID
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET
const JWT_SECRET = process.env.JWT_SECRET

export class AuthenticateUserService {
  async execute(code: string) {
    const url = 'https://github.com/login/oauth/access_token'
    const { data: accessTokenResponse } = await axios.post<IAccessTokenResponse>(url, null, {
      params: {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
      },
      headers: {
        'Accept': 'application/json',
      }
    })
    const response = await axios.get<IUserResponse>('https://api.github.com/user', {
      headers: {
        authorization: `Bearer ${accessTokenResponse.access_token}`
      }
    })
    const { avatar_url, id, login, name } = response.data
    let user = await prismaClient.user.findFirst({
      where: {
        github_id: id,
      }
    })

    if(!user) {
      user = await prismaClient.user.create({
        data: {
          github_id: id,
          login,
          avatar_url,
          name,
        }
      })
    }

    const token = sign(
      {
        user: {
          name: user.name,
          avatar_url: user.avatar_url,
          id: user.id,
        }
      },
      JWT_SECRET,
      {
        subject: user.id,
        expiresIn: '1d',
      }
    )

    return {
      token,
      user
    }
  }
}
