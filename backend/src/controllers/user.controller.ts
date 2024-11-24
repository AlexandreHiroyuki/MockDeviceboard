import bcrypt from 'bcrypt'
import { eq } from 'drizzle-orm'
import jwt from 'jsonwebtoken'

import { db } from '../database/db.js'
import { UsersTable } from '../database/schema.js'
import { UserSchema } from '../types.js'

const JWT_SECRET = process.env.JWT_SECRET

// Helper function to generate a JWT
const generateToken = (userId: string) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '1h' })
}

export default {
  async create(c: any) {
    const body = await c.req.json()
    const result = UserSchema.safeParse(body.params)

    console.log(result)

    if (!result.success) {
      console.log('Validation error: ', result.error.errors)
      return c.json({ type: 'form', message: 'Invalid form values' }, 422)
    }

    const email = result.data?.email
    const password = result.data?.password

    try {
      const [existingUser] = await db
        .select({ id: UsersTable.id })
        .from(UsersTable)
        .where(eq(UsersTable.email, email))

      if (existingUser) {
        return c.json(
          {
            type: 'email',
            message: `The email address ${email} is already used`
          },
          409
        )
      }
    } catch (e) {
      console.log(e)
      return c.json(
        { type: 'api', message: 'An error occurred while checking the user' },
        500
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const [newUser] = await db
      .insert(UsersTable)
      .values({ email: email, password: hashedPassword })
      .returning()

    return c.text(generateToken(String(newUser.id)), 201)
  },

  async delete(c: any) {
    const body = await c.req.json()
    const result = UserSchema.safeParse(body.params)

    if (!result.success) {
      console.log('Validation error: ', result.error.errors)
      return c.json({ type: 'form', message: 'Invalid form values' }, 422)
    }

    const email = result.data?.email

    const [deletedUser] = await db
      .delete(UsersTable)
      .where(eq(UsersTable.email, email))
      .returning()

    if (deletedUser) {
      console.log(
        `User with email ${deletedUser.email} was deleted successfully.`
      )
      c.text(
        `User with email ${deletedUser.email} was deleted successfully.`,
        200
      )
    } else {
      return c.json(
        {
          type: 'email',
          message: `No user with the email ${email} was found. Sign up first.`
        },
        401
      )
    }
  },

  async access(c: any) {
    const body = await c.req.json()
    const result = UserSchema.safeParse(body.params)

    console.log(result)

    if (!result.success) {
      console.log('Validation error: ', result.error.errors)
      return c.json({ type: 'form', message: 'Invalid form values' }, 422)
    }

    const email = result.data?.email
    const password = result.data?.password

    try {
      const [existingUser] = await db
        .select({
          id: UsersTable.id,
          email: UsersTable.email,
          password: UsersTable.password
        })
        .from(UsersTable)
        .where(eq(UsersTable.email, email))

      console.log('existingUser: ', existingUser, existingUser === undefined)
      if (existingUser === undefined) {
        return c.json(
          {
            type: 'email',
            message: `No user with the email ${email} was found. Sign up first.`
          },
          401
        )
      }

      let passwordMath = false

      // console.log(await bcrypt.hash(password, 10))
      console.log(existingUser.password)

      bcrypt.compare(password, existingUser.password, (err, data) => {
        console.log('error: ', err)
        console.log('data: ', data)
        //if both match than you can do anything
        passwordMath = data
      })

      if (passwordMath) {
        return c.json({ token: generateToken(String(existingUser.id)) }, 200)
      } else {
        console.log('Wrong password')
        return c.json({ type: 'password', message: 'Wrong password' }, 401)
      }
    } catch (e) {
      console.log(e)
      return c.json(
        { type: 'api', message: 'An error occurred while checking the user' },
        500
      )
    }
  }
}